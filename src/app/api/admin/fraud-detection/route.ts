import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

interface FraudPattern {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  count: number;
  affectedUsers: string[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const patterns: FraudPattern[] = [];

    // 1. Detect multiple accounts from same IP (requires IP logging - placeholder)
    // This would require implementing IP tracking in registration

    // 2. Detect suspicious registration patterns
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Check for accounts created in bulk
    const { data: recentUsers } = await supabase
      .from('users')
      .select('email, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (recentUsers && recentUsers.length > 0) {
      // Group by creation time windows (5 minute intervals)
      const timeWindows: { [key: string]: string[] } = {};
      
      recentUsers.forEach(user => {
        const timestamp = new Date(user.created_at).getTime();
        const windowKey = Math.floor(timestamp / (5 * 60 * 1000)).toString();
        
        if (!timeWindows[windowKey]) {
          timeWindows[windowKey] = [];
        }
        timeWindows[windowKey].push(user.email);
      });

      // Flag windows with 5+ accounts
      Object.entries(timeWindows).forEach(([window, emails]) => {
        if (emails.length >= 5) {
          patterns.push({
            type: 'bulk_registration',
            severity: 'high',
            description: `${emails.length} accounts created within 5 minutes`,
            count: emails.length,
            affectedUsers: emails
          });
        }
      });
    }

    // 3. Detect events with unusual registration patterns
    const { data: events } = await supabase
      .from('events')
      .select(`
        id,
        title,
        max_participants,
        registrations (
          id,
          student_email,
          payment_status,
          created_at
        )
      `);

    events?.forEach(event => {
      const registrations = event.registrations as any[];
      
      if (registrations.length > 0) {
        // Check for rapid registrations from same email pattern
        const emailCounts: { [key: string]: number } = {};
        registrations.forEach(reg => {
          const emailPrefix = reg.student_email.split('@')[0];
          emailCounts[emailPrefix] = (emailCounts[emailPrefix] || 0) + 1;
        });

        // Flag if multiple similar emails
        const suspiciousPatterns = Object.entries(emailCounts)
          .filter(([prefix, count]) => count >= 3);

        if (suspiciousPatterns.length > 0) {
          patterns.push({
            type: 'suspicious_registrations',
            severity: 'medium',
            description: `Event "${event.title}" has multiple registrations with similar email patterns`,
            count: suspiciousPatterns.length,
            affectedUsers: suspiciousPatterns.map(([prefix]) => prefix)
          });
        }

        // Check for registrations exceeding max capacity significantly
        if (event.max_participants && registrations.length > event.max_participants * 1.5) {
          patterns.push({
            type: 'over_registration',
            severity: 'high',
            description: `Event "${event.title}" has ${registrations.length} registrations but capacity is ${event.max_participants}`,
            count: registrations.length - event.max_participants,
            affectedUsers: []
          });
        }
      }
    });

    // 4. Detect payment fraud patterns
    const { data: failedPayments } = await supabase
      .from('registrations')
      .select('student_email, payment_status, created_at')
      .eq('payment_status', 'failed')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (failedPayments && failedPayments.length > 0) {
      const failuresByUser: { [email: string]: number } = {};
      
      failedPayments.forEach(payment => {
        failuresByUser[payment.student_email] = (failuresByUser[payment.student_email] || 0) + 1;
      });

      // Flag users with multiple payment failures
      const suspiciousUsers = Object.entries(failuresByUser)
        .filter(([email, count]) => count >= 3)
        .map(([email]) => email);

      if (suspiciousUsers.length > 0) {
        patterns.push({
          type: 'payment_fraud_attempts',
          severity: 'high',
          description: 'Multiple payment failures from same users',
          count: suspiciousUsers.length,
          affectedUsers: suspiciousUsers
        });
      }
    }

    // 5. Detect duplicate event submissions
    const { data: duplicateEvents } = await supabase
      .from('events')
      .select('title, organizer_email, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (duplicateEvents && duplicateEvents.length > 0) {
      const titleMap: { [key: string]: { emails: string[]; count: number } } = {};
      
      duplicateEvents.forEach(event => {
        const normalizedTitle = event.title.toLowerCase().trim();
        if (!titleMap[normalizedTitle]) {
          titleMap[normalizedTitle] = { emails: [], count: 0 };
        }
        titleMap[normalizedTitle].emails.push(event.organizer_email);
        titleMap[normalizedTitle].count++;
      });

      // Flag titles appearing multiple times
      Object.entries(titleMap).forEach(([title, data]) => {
        if (data.count >= 3) {
          patterns.push({
            type: 'duplicate_events',
            severity: 'low',
            description: `Event title "${title}" appears ${data.count} times`,
            count: data.count,
            affectedUsers: [...new Set(data.emails)]
          });
        }
      });
    }

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2 };
    patterns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return NextResponse.json({ 
      patterns,
      summary: {
        total: patterns.length,
        high: patterns.filter(p => p.severity === 'high').length,
        medium: patterns.filter(p => p.severity === 'medium').length,
        low: patterns.filter(p => p.severity === 'low').length
      },
      scannedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fraud detection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
