// API: /api/organizer/certificate-template/create
// Purpose: Create certificate template with customizations
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';

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

    const body = await req.json();
    const {
      eventId,
      imageUrl,
      namePositionX,
      namePositionY,
      nameFontFamily,
      nameFontSize,
      nameFontColor,
      textAlignment,
      recipientType,
    } = body;

    // Validate required fields
    if (
      !eventId ||
      !imageUrl ||
      namePositionX === undefined ||
      namePositionY === undefined ||
      !recipientType
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate positions are 0-100
    if (namePositionX < 0 || namePositionX > 100 || namePositionY < 0 || namePositionY > 100) {
      return NextResponse.json({ error: 'Position must be between 0 and 100' }, { status: 400 });
    }

    // Verify event ownership
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organizer_email', session.user.email)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 403 });
    }

    // Create template
    const { data: template, error: createError } = await supabase
      .from('certificate_templates')
      .insert({
        event_id: eventId,
        organizer_email: session.user.email,
        certificate_image_url: imageUrl,
        name_position_x: namePositionX,
        name_position_y: namePositionY,
        name_font_family: nameFontFamily || 'Arial',
        name_font_size: nameFontSize || 32,
        name_font_color: nameFontColor || '#000000',
        name_text_alignment: textAlignment || 'center',
        recipient_type: recipientType,
        template_status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    // Log action
    await supabase.rpc('log_certificate_action', {
      p_template_id: template.id,
      p_action: 'created',
      p_actor_email: session.user.email,
      p_details: { event_id: eventId, recipient_type: recipientType },
    });

    return NextResponse.json({
      success: true,
      templateId: template.id,
      template,
    });
  } catch (error) {
    console.error('Certificate template creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Retrieve template details
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const { data: template, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('id', templateId)
      .eq('organizer_email', session.user.email)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get recipients count
    const { count: recipientCount } = await supabase
      .from('certificate_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', templateId);

    // Get sent count
    const { count: sentCount } = await supabase
      .from('certificate_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', templateId)
      .not('sent_at', 'is', null);

    return NextResponse.json({
      success: true,
      template,
      stats: {
        totalRecipients: recipientCount || 0,
        sent: sentCount || 0,
      },
    });
  } catch (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
