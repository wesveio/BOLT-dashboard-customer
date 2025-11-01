import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { signupSchema } from '@/lib/validations/auth';
import {
  sanitizeEmail,
  sanitizeVTEXAccount,
  sanitizeText,
  sanitizeCompanyName,
} from '@/utils/auth/sanitize';

/**
 * POST /api/dashboard/auth/signup
 * Create a new user account with VTEX Account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input with Zod schema
    const validationResult = signupSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { email, first_name, last_name, vtex_account, company_name } = validationResult.data;

    // Sanitize all inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedVTEXAccount = sanitizeVTEXAccount(vtex_account);
    const sanitizedFirstName = sanitizeText(first_name, 100);
    const sanitizedLastName = sanitizeText(last_name, 100);
    const sanitizedCompanyName = company_name ? sanitizeCompanyName(company_name) : null;

    // Validate sanitized data still meets requirements
    if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!sanitizedVTEXAccount || sanitizedVTEXAccount.length < 3) {
      return NextResponse.json(
        { error: 'Invalid VTEX Account' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Check if email already exists
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .schema('dashboard')
      .from('users')
      .select('id, email')
      .eq('email', sanitizedEmail)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected when user doesn't exist
      console.error('Error checking existing user:', userCheckError);
      return NextResponse.json(
        { error: 'Failed to verify email availability' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered. Please login instead.' },
        { status: 409 }
      );
    }

    // Check if VTEX Account already exists
    const { data: existingAccounts, error: accountCheckError } = await supabaseAdmin
      .schema('dashboard')
      .rpc('get_account_by_vtex_name', { p_vtex_account_name: sanitizedVTEXAccount });

    if (accountCheckError) {
      console.error('Error checking existing account:', accountCheckError);
      return NextResponse.json(
        { error: 'Failed to verify VTEX Account availability' },
        { status: 500 }
      );
    }

    if (existingAccounts && existingAccounts.length > 0) {
      return NextResponse.json(
        { error: 'VTEX Account already registered. Please use a different account or login.' },
        { status: 409 }
      );
    }

    // Create account and user in a transaction-like approach
    // Since Supabase doesn't support transactions directly, we'll use error handling
    try {
      // First, create the account using SQL function
      const { data: accountId, error: accountError } = await supabaseAdmin
        .schema('dashboard')
        .rpc('create_account', {
          p_vtex_account_name: sanitizedVTEXAccount,
          p_company_name: sanitizedCompanyName || sanitizedVTEXAccount,
          p_plan_type: 'basic',
          p_status: 'active',
        });

      if (accountError) {
        console.error('Error creating account:', accountError);
        
        // Check if it's a unique constraint violation
        if (accountError.code === '23505' || accountError.message?.includes('unique')) {
          return NextResponse.json(
            { error: 'VTEX Account already registered' },
            { status: 409 }
          );
        }
        
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        );
      }

      if (!accountId) {
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        );
      }

      const newAccount = { id: accountId };

      // Create the user linked to the account
      // Set role to 'owner' for the first user of an account
      const { data: newUser, error: userError } = await supabaseAdmin
        .schema('dashboard')
        .from('users')
        .insert({
          account_id: newAccount.id,
          email: sanitizedEmail,
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          name: `${sanitizedFirstName} ${sanitizedLastName}`, // Full name for compatibility
          role: 'owner', // First user is always owner
        })
        .select('id, email, first_name, last_name, role')
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        
        // If user creation fails, try to clean up the account
        // (best effort, don't fail if cleanup fails)
        await supabaseAdmin
          .schema('dashboard')
          .rpc('delete_account', { p_account_id: newAccount.id });

        // Check if it's a unique constraint violation
        if (userError.code === '23505') {
          return NextResponse.json(
            { error: 'Email already registered' },
            { status: 409 }
          );
        }
        
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      if (!newUser) {
        // Cleanup account if user creation failed
        await supabaseAdmin
          .schema('dashboard')
          .rpc('delete_account', { p_account_id: newAccount.id });
        
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      // Success - return user data (without sensitive info)
      return NextResponse.json({
        success: true,
        message: 'Account created successfully. You can now login.',
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role,
        },
      }, { status: 201 });

    } catch (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'SyntaxError') {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

