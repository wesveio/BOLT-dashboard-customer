import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Cache duration in seconds (1 hour = 3600 seconds)
 * Plans don't change frequently, so we can cache aggressively
 */
const CACHE_DURATION = 3600; // 1 hour
const CACHE_STALE_WHILE_REVALIDATE = 86400; // 24 hours (stale content is acceptable while revalidating)

/**
 * GET /api/public/pricing
 * Public endpoint to get all active pricing plans
 * 
 * Implements aggressive caching with:
 * - Server-side cache (Next.js fetch cache)
 * - HTTP cache headers (CDN/browser cache)
 * - Stale-while-revalidate pattern
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

    const response = NextResponse.json({
      plans: plans || [],
      cached: false, // Indicates this is a fresh response
    });

    // Set cache headers for browser/CDN caching
    // Cache-Control: public = can be cached by CDN/browser
    // max-age = how long to serve from cache
    // stale-while-revalidate = serve stale content while revalidating in background
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${CACHE_DURATION}, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE}`
    );

    // ETag for conditional requests (if client supports)
    // Generate a simple hash from plans data
    const plansString = JSON.stringify(plans);
    let hash = 0;
    for (let i = 0; i < plansString.length; i++) {
      const char = plansString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const etag = `"${Math.abs(hash).toString(16)}"`;
    response.headers.set('ETag', etag);

    // Check if client sent If-None-Match header (conditional request)
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      // Client has fresh cache, return 304 Not Modified
      return new NextResponse(null, { status: 304, headers: response.headers });
    }

    return response;
  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error in pricing endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

