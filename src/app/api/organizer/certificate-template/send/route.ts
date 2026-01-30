// API: /api/organizer/certificate-template/send
// Purpose: Send generated certificates to students
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendCertificateEmail(
  studentEmail: string,
  studentName: string,
  eventName: string,
  certificateUrl: string
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: studentEmail,
    subject: `🎓 Your Certificate from ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Congratulations, ${studentName}!</h2>
        <p style="color: #666; font-size: 16px;">
          Thank you for your participation in <strong>${eventName}</strong>. 
          Your certificate is ready for download.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${certificateUrl}" 
             style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            📥 Download Certificate
          </a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          You can also view all your certificates in your Happenin dashboard.
        </p>
      </div>
    `,
  };

  return emailTransporter.sendMail(mailOptions);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    // Verify template ownership
    const { data: template, error: templateError } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .eq('organizer_email', session.user.email)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 403 });
    }

    // Get event name
    const { data: event } = await supabase
      .from('events')
      .select('name')
      .eq('id', template.event_id)
      .single();

    // Get all generated recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from('certificate_recipients')
      .select('*')
      .eq('template_id', templateId)
      .eq('generation_status', 'generated')
      .is('sent_at', null);

    if (recipientsError || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No generated certificates to send' },
        { status: 400 }
      );
    }

    const sent: Array<{ studentEmail: string; studentName: string }> = [];
    const failed: Array<{ studentEmail: string; reason: string }> = [];

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        // Send email
        await sendCertificateEmail(
          recipient.student_email,
          recipient.student_name,
          event?.name || 'Event',
          recipient.certificate_url
        );

        // Update sent_at
        await supabase
          .from('certificate_recipients')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', recipient.id);

        // Create student_certificates record
        await supabase.from('student_certificates').insert({
          student_email: recipient.student_email,
          certificate_url: recipient.certificate_url,
          event_name: event?.name || 'Event',
          event_id: template.event_id,
          certificate_type: template.recipient_type,
          issued_by: session.user.email,
          recipient_type: template.recipient_type,
          sent_date: new Date().toISOString(),
          template_id: templateId,
        });

        // Trigger badge checking
        await supabase.rpc('check_and_award_badges', {
          p_student_email: recipient.student_email,
        });

        sent.push({
          studentEmail: recipient.student_email,
          studentName: recipient.student_name,
        });

        // Log action
        await supabase.rpc('log_certificate_action', {
          p_template_id: templateId,
          p_action: 'sent',
          p_actor_email: session.user.email,
          p_recipient_email: recipient.student_email,
        });
      } catch (error) {
        console.error(`Error sending certificate to ${recipient.student_email}:`, error);
        failed.push({
          studentEmail: recipient.student_email,
          reason: error instanceof Error ? error.message : 'Email send failed',
        });
      }
    }

    // Update template status
    await supabase
      .from('certificate_templates')
      .update({ template_status: 'sent' })
      .eq('id', templateId);

    return NextResponse.json({
      success: true,
      status: 'completed',
      total: recipients.length,
      sent: sent.length,
      failed: failed.length,
      sentRecipients: sent,
      failedRecipients: failed,
    });
  } catch (error) {
    console.error('Certificate send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
