import { NextResponse } from 'next/server';
import { getServiceRoleSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const adminClient = getServiceRoleSupabase();
    const testEmail = 'test_user@skillbridge.local';
    const testPassword = 'TEST_USER1!'; // Complies with all password requirements

    // 1. Check if user already exists
    const { data: userList, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      return NextResponse.json(
        { success: false, error: listError.message },
        { status: 500 }
      );
    }

    const existingUser = userList?.users?.find((u) => u.email === testEmail);

    if (existingUser) {
      // Ensure password and confirmation status are up to date
      const { data: updated, error: updateError } = await adminClient.auth.admin.updateUserById(
        existingUser.id,
        {
          password: testPassword,
          email_confirm: true,
          user_metadata: { full_name: 'SkillBridge Test User' }
        }
      );

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Test user already exists. Credentials updated and confirmed.',
        user_id: existingUser.id,
        email: testEmail
      });
    }

    // 2. Create the user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: 'SkillBridge Test User' }
    });

    if (createError) {
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test user successfully created and auto-confirmed.',
      user_id: newUser.user.id,
      email: testEmail
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed test user' },
      { status: 500 }
    );
  }
}
