// API: /api/organizer/certificate-template/generate
// Purpose: Generate certificates from template
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import sharp from 'sharp';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to generate certificate image
async function generateCertificateImage(
  imageUrl: string,
  studentName: string,
  namePositionX: number,
  namePositionY: number,
  nameFontFamily: string,
  nameFontSize: number,
  nameFontColor: string,
  textAlignment: string
) {
  try {
    // Download base image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    // Get image metadata
    const metadata = await sharp(Buffer.from(buffer)).metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 800;

    // Calculate text position
    const posX = Math.round((width * namePositionX) / 100);
    const posY = Math.round((height * namePositionY) / 100);

    // Create SVG text overlay
    const textAnchor =
      textAlignment === 'left' ? 'start' : textAlignment === 'right' ? 'end' : 'middle';

    const svg = `
      <svg width="${width}" height="${height}">
        <text
          x="${posX}"
          y="${posY}"
          font-family="${nameFontFamily}"
          font-size="${nameFontSize}"
          fill="${nameFontColor}"
          text-anchor="${textAnchor}"
          dominant-baseline="middle"
        >
          ${escapeXml(studentName)}
        </text>
      </svg>
    `;

    // Overlay text on image
    const composited = await sharp(Buffer.from(buffer))
      .composite([
        {
          input: Buffer.from(svg),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    return composited;
  } catch (error) {
    console.error('Certificate generation error:', error);
    throw new Error('Failed to generate certificate image');
  }
}

function escapeXml(str: string) {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
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

    // Get all pending recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from('certificate_recipients')
      .select('*')
      .eq('template_id', templateId)
      .eq('generation_status', 'pending');

    if (recipientsError || !recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients to generate' }, { status: 400 });
    }

    // Generate certificates for each recipient
    const generatedUrls: Array<{ studentEmail: string; studentName: string; certificateUrl: string }> = [];
    const errors: Array<{ studentEmail: string; reason: string }> = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      try {
        // Update status to generating
        await supabase
          .from('certificate_recipients')
          .update({ generation_status: 'generating' })
          .eq('id', recipient.id);

        // Generate certificate image
        const certImage = await generateCertificateImage(
          template.certificate_image_url,
          recipient.student_name,
          template.name_position_x,
          template.name_position_y,
          template.name_font_family,
          template.name_font_size,
          template.name_font_color,
          template.name_text_alignment
        );

        // Upload to storage
        const fileName = `certificates/${template.event_id}/${templateId}/${Date.now()}-${recipient.student_email}.png`;
        const { data, error: uploadError } = await supabase.storage
          .from('happenin-certificates')
          .upload(fileName, certImage, { contentType: 'image/png' });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('happenin-certificates').getPublicUrl(fileName);

        // Update recipient with certificate URL
        await supabase
          .from('certificate_recipients')
          .update({
            certificate_url: publicUrl,
            generation_status: 'generated',
          })
          .eq('id', recipient.id);

        generatedUrls.push({
          studentEmail: recipient.student_email,
          studentName: recipient.student_name,
          certificateUrl: publicUrl,
        });

        // Log action
        await supabase.rpc('log_certificate_action', {
          p_template_id: templateId,
          p_action: 'generated',
          p_actor_email: session.user.email,
          p_recipient_email: recipient.student_email,
        });
      } catch (error) {
        console.error(`Error generating certificate for ${recipient.student_email}:`, error);

        await supabase
          .from('certificate_recipients')
          .update({
            generation_status: 'failed',
            failed_reason: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', recipient.id);

        errors.push({
          studentEmail: recipient.student_email,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: 'completed',
      total: recipients.length,
      generated: generatedUrls.length,
      failed: errors.length,
      certificateUrls: generatedUrls,
      errors,
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
