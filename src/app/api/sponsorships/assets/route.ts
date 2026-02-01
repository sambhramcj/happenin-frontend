import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sponsorshipId = formData.get('sponsorshipId') as string;
    const assetType = formData.get('assetType') as string;
    const placement = formData.get('placement') as string;

    if (!file || !sponsorshipId || !assetType) {
      return NextResponse.json({ 
        error: 'File, sponsorshipId, and assetType are required' 
      }, { status: 400 });
    }

    // Verify sponsorship exists and user has permission
    const { data: sponsorship, error: sponsorshipError } = await supabase
      .from('sponsorships')
      .select('id, event_id, events(organizer_email)')
      .eq('id', sponsorshipId)
      .single();

    if (sponsorshipError || !sponsorship) {
      return NextResponse.json({ error: 'Sponsorship not found' }, { status: 404 });
    }

    const event = sponsorship.events as any;
    if (event.organizer_email !== session.user.email) {
      return NextResponse.json({ 
        error: 'Only event organizer can upload sponsor assets' 
      }, { status: 403 });
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `sponsor-assets/${sponsorshipId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-assets')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('event-assets')
      .getPublicUrl(filePath);

    // Save asset record
    const { data: asset, error: assetError } = await supabase
      .from('sponsorship_assets')
      .insert({
        sponsorship_id: sponsorshipId,
        asset_type: assetType,
        asset_url: urlData.publicUrl,
        placement: placement || 'banner',
        click_count: 0,
        impression_count: 0
      })
      .select()
      .single();

    if (assetError) {
      console.error('Asset creation error:', assetError);
      return NextResponse.json({ error: 'Failed to create asset record' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      asset,
      message: 'Sponsor asset uploaded successfully'
    });

  } catch (error) {
    console.error('Asset upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const placement = searchParams.get('placement');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    // Get sponsorships for this event
    const { data: sponsorships, error: sponsorshipError } = await supabase
      .from('sponsorships')
      .select(`
        id,
        tier,
        sponsors (
          id,
          name,
          logo_url,
          website_url
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'active');

    if (sponsorshipError) {
      console.error('Sponsorships fetch error:', sponsorshipError);
      return NextResponse.json({ error: 'Failed to fetch sponsorships' }, { status: 500 });
    }

    if (!sponsorships || sponsorships.length === 0) {
      return NextResponse.json({ assets: [] });
    }

    const sponsorshipIds = sponsorships.map(s => s.id);

    // Get assets for these sponsorships
    let query = supabase
      .from('sponsorship_assets')
      .select('*')
      .in('sponsorship_id', sponsorshipIds);

    if (placement) {
      query = query.eq('placement', placement);
    }

    const { data: assets, error: assetsError } = await query.order('created_at', { ascending: false });

    if (assetsError) {
      console.error('Assets fetch error:', assetsError);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    // Combine assets with sponsor info
    const enrichedAssets = assets?.map(asset => {
      const sponsorship = sponsorships.find(s => s.id === asset.sponsorship_id);
      return {
        ...asset,
        sponsor: sponsorship?.sponsors,
        tier: sponsorship?.tier
      };
    }) || [];

    return NextResponse.json({ assets: enrichedAssets });

  } catch (error) {
    console.error('Assets fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
