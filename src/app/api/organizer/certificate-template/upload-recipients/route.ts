// API: /api/organizer/certificate-template/upload-recipients
// Purpose: Upload Excel file with recipient names and emails
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import * as XLSX from 'xlsx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const excelFile = formData.get('file') as File;
    const templateId = formData.get('templateId') as string;

    if (!excelFile || !templateId) {
      return NextResponse.json({ error: 'Missing file or template ID' }, { status: 400 });
    }

    // Verify template ownership
    const { data: template, error: templateError } = await supabase
      .from('certificate_templates')
      .select('id, organizer_email')
      .eq('id', templateId)
      .eq('organizer_email', session.user.email)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 403 });
    }

    // Parse Excel file
    const arrayBuffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, any>>;

    // Validate and clean data
    const recipients: Array<{ name: string; email: string; valid: boolean }> = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const row of data) {
      const name = (row['Name'] || row['name'] || row['Student Name'] || '').toString().trim();
      const email = (row['Email'] || row['email'] || row['Student Email'] || '').toString().trim().toLowerCase();

      const isValid = name && emailRegex.test(email);
      recipients.push({
        name: name || 'Unknown',
        email,
        valid: isValid,
      });
    }

    // Separate valid and invalid
    const validRecipients = recipients.filter((r) => r.valid);
    const invalidRecipients = recipients.filter((r) => !r.valid);

    // Delete existing recipients for this template
    await supabase.from('certificate_recipients').delete().eq('template_id', templateId);

    // Insert valid recipients
    if (validRecipients.length > 0) {
      const { error: insertError } = await supabase.from('certificate_recipients').insert(
        validRecipients.map((r) => ({
          template_id: templateId,
          student_email: r.email,
          student_name: r.name,
          generation_status: 'pending',
        }))
      );

      if (insertError) {
        return NextResponse.json({ error: 'Failed to insert recipients' }, { status: 500 });
      }
    }

    // Log action
    await supabase.rpc('log_certificate_action', {
      p_template_id: templateId,
      p_action: 'uploaded_recipients',
      p_actor_email: session.user.email,
      p_details: {
        total: recipients.length,
        valid: validRecipients.length,
        invalid: invalidRecipients.length,
      },
    });

    return NextResponse.json({
      success: true,
      recipients: validRecipients,
      invalidRecipients,
      stats: {
        totalRecipients: recipients.length,
        validRecipients: validRecipients.length,
        invalidRecipients: invalidRecipients.length,
      },
    });
  } catch (error) {
    console.error('Excel upload error:', error);
    return NextResponse.json({ error: 'Failed to process Excel file' }, { status: 500 });
  }
}
