/**
 * Script to verify PostgREST schema cache and function availability
 * 
 * This script checks if the get_user_profiles function exists
 * and provides instructions on how to refresh PostgREST's schema cache.
 */

import { config } from 'dotenv';
config({ path: './.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Make sure .env.local is configured correctly.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkFunctionExists() {
  console.log('📞 Attempting to call get_user_profiles function...\n');
  
  // Try to call the function directly with a dummy UUID
  // This will tell us if PostgREST can see the function
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_profiles', {
    p_customer_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID for testing
    p_limit: 1,
  });

  if (rpcError) {
    console.error('❌ Function call failed:');
    console.error(`   Code: ${rpcError.code}`);
    console.error(`   Message: ${rpcError.message}`);
    if (rpcError.details) {
      console.error(`   Details: ${rpcError.details}`);
    }
    if (rpcError.hint) {
      console.error(`   Hint: ${rpcError.hint}`);
    }
    console.log('');

    if (rpcError.code === 'PGRST202' || rpcError.code === 'PGRST205') {
      console.log('🔧 DIAGNOSIS: PostgREST schema cache needs to be refreshed\n');
      console.log('📝 SOLUTIONS:\n');
      console.log('Option 1: Re-run migration 046 (Recommended)');
      console.log('   - Open Supabase Dashboard → SQL Editor');
      console.log('   - Copy content from: supabase/migrations/046_expose_user_profiles_via_public_functions.sql');
      console.log('   - Execute the SQL (CREATE OR REPLACE will refresh the schema cache)\n');
      console.log('Option 2: Wait for automatic refresh');
      console.log('   - PostgREST refreshes its cache automatically every 1-5 minutes');
      console.log('   - Just wait and try again\n');
      console.log('Option 3: Contact Supabase Support');
      console.log('   - If the issue persists, contact Supabase support');
      console.log('   - They can manually refresh the PostgREST schema cache\n');
    } else if (rpcError.code === '42883') {
      console.log('🔧 DIAGNOSIS: Function does not exist in database\n');
      console.log('📝 SOLUTION: Run migration 046\n');
      console.log('   - Open Supabase Dashboard → SQL Editor');
      console.log('   - Copy content from: supabase/migrations/046_expose_user_profiles_via_public_functions.sql');
      console.log('   - Execute the SQL\n');
    } else {
      console.log('🔧 DIAGNOSIS: Unknown error - may need to check database\n');
    }
  } else {
    console.log('✅ SUCCESS: Function exists and is callable!');
    console.log('   PostgREST schema cache is up to date.\n');
    if (rpcData) {
      console.log(`   Function returned ${Array.isArray(rpcData) ? rpcData.length : 'data'} result(s)\n`);
    }
  }

  console.log('💡 To manually verify in Supabase Dashboard:');
  console.log('   1. Go to SQL Editor');
  console.log('   2. Run this query:');
  console.log('      SELECT routine_name, routine_type');
  console.log('      FROM information_schema.routines');
  console.log('      WHERE routine_schema = \'public\'');
  console.log('        AND routine_name = \'get_user_profiles\';');
  console.log('   3. If it returns a row → function exists, cache needs refresh');
  console.log('   4. If it returns nothing → run migration 046\n');
}

async function main() {
  console.log('🚀 PostgREST Schema Cache Verification');
  console.log('='.repeat(50));
  console.log('');

  await checkFunctionExists();

  console.log('='.repeat(50));
  console.log('✅ Verification complete\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

