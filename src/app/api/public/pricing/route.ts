import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/public/pricing
 * Public endpoint to get all active pricing plans
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch all active plans using public function
    const { data: plans, error } = await supabase.rpc('get_plans');

    if (error) {
      console.error('❌ [DEBUG] Error fetching plans:', error);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    return NextResponse.json({
      plans: plans || [],
    });
  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error in pricing endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

