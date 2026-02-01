import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const state = searchParams.get('state')

    let query = supabase
      .from('colleges')
      .select('*', { count: 'exact' })
      .order('name')

    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`)
    }

    if (state) {
      query = query.eq('state', state)
    }

    const { data, count, error } = await query
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching colleges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch colleges' },
      { status: 500 }
    )
  }
}
