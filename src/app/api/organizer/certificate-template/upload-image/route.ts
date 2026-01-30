// API: /api/organizer/certificate-template/upload-image
// Purpose: Upload certificate image and get URL
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

    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const eventId = formData.get('eventId') as string;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate event ownership
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organizer_email', session.user.email)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found or unauthorized' }, { status: 403 });
    }

    // Upload to Supabase Storage
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `certificates/${eventId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const arrayBuffer = await imageFile.arrayBuffer();
    const { data, error } = await supabase.storage
      .from('happenin-certificates')
      .upload(fileName, Buffer.from(arrayBuffer), {
        contentType: imageFile.type,
      });

    if (error) {
      return NextResponse.json({ error: 'Upload failed: ' + error.message }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('happenin-certificates').getPublicUrl(fileName);

    // Get image dimensions
    const dimensions = {
      width: 1200,
      height: 800, // Default, could be calculated from actual image
    };

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      imageDimensions: dimensions,
    });
  } catch (error) {
    console.error('Certificate image upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
