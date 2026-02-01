import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { assetId, type } = await request.json();

    if (!assetId || !type) {
      return NextResponse.json({ 
        error: 'assetId and type are required' 
      }, { status: 400 });
    }

    if (!['click', 'impression'].includes(type)) {
      return NextResponse.json({ 
        error: 'type must be either "click" or "impression"' 
      }, { status: 400 });
    }

    // Get current asset
    const { data: asset, error: fetchError } = await supabase
      .from('sponsorship_assets')
      .select('id, click_count, impression_count')
      .eq('id', assetId)
      .single();

    if (fetchError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Increment appropriate counter
    const updateField = type === 'click' ? 'click_count' : 'impression_count';
    const currentCount = asset[updateField] || 0;

    const { error: updateError } = await supabase
      .from('sponsorship_assets')
      .update({ [updateField]: currentCount + 1 })
      .eq('id', assetId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to track interaction' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `${type} tracked successfully`
    });

  } catch (error) {
    console.error('Sponsorship tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sponsorshipId = searchParams.get('sponsorshipId');

    if (!sponsorshipId) {
      return NextResponse.json({ error: 'sponsorshipId is required' }, { status: 400 });
    }

    // Get assets and calculate total metrics
    const { data: assets, error } = await supabase
      .from('sponsorship_assets')
      .select('id, asset_type, click_count, impression_count, created_at')
      .eq('sponsorship_id', sponsorshipId);

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    const totalClicks = assets?.reduce((sum, a) => sum + (a.click_count || 0), 0) || 0;
    const totalImpressions = assets?.reduce((sum, a) => sum + (a.impression_count || 0), 0) || 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return NextResponse.json({ 
      analytics: {
        totalClicks,
        totalImpressions,
        clickThroughRate: ctr,
        assets: assets || []
      }
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
