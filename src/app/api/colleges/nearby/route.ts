import { NextRequest, NextResponse } from 'next/server'
import { getNearbyColleges } from '@/lib/geolocation'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')
    const radius = parseInt(searchParams.get('radius') || '10')
    const usePostGIS = searchParams.get('usePostGIS') === 'true'

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude required' },
        { status: 400 }
      )
    }

    let colleges;
    let method = 'haversine';

    // Try PostGIS if requested
    if (usePostGIS) {
      try {
        const startTime = Date.now();
        
        const { data, error } = await supabase.rpc('get_nearby_colleges', {
          user_lat: lat,
          user_lng: lng,
          radius_km: radius
        });

        if (!error && data) {
          colleges = data;
          method = 'postgis';
          console.log(`PostGIS query took ${Date.now() - startTime}ms`);
        } else {
          console.warn('PostGIS failed, falling back to Haversine:', error);
          colleges = await getNearbyColleges(lat, lng, radius);
        }
      } catch (postgisError) {
        console.warn('PostGIS error, falling back to Haversine:', postgisError);
        colleges = await getNearbyColleges(lat, lng, radius);
      }
    } else {
      // Use Haversine by default
      const startTime = Date.now();
      colleges = await getNearbyColleges(lat, lng, radius);
      console.log(`Haversine calculation took ${Date.now() - startTime}ms`);
    }

    return NextResponse.json({ 
      data: colleges,
      meta: { method, count: colleges.length }
    })
  } catch (error) {
    console.error('Error fetching nearby colleges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nearby colleges' },
      { status: 500 }
    )
  }
}
