import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Client-side Supabase client (for browser)
 * Uses anon key and respects Row Level Security (RLS)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Server-side Supabase client (for API routes, server components)
 * Uses service role key to bypass RLS when necessary
 * ⚠️ NEVER expose this to the client-side
 */
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Get validated Supabase admin client for API routes
 * This function ensures the admin client is properly configured before use
 * 
 * @returns SupabaseClient - Guaranteed non-null admin client
 * @throws Error if admin client is not configured
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured. Check SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }
  return supabaseAdmin;
}

/**
 * Validate Supabase admin client and return error response if not configured
 * Use this in API route handlers to return proper HTTP error response
 * 
 * @returns NextResponse with error if not configured, null if valid
 */
export function validateSupabaseAdmin(): NextResponse | null {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database configuration error' },
      { status: 500 }
    );
  }
  return null;
}

