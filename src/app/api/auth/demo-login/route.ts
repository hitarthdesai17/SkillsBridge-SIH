import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceRoleSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST() {
  const demoEmail = 'demo@skillbridge.local';
  const demoPassword = 'DemoUser2026!';

  let sessionData: any = null;
  let userData: any = { id: 'demo_user_01', email: demoEmail, user_metadata: { full_name: 'Demo Candidate' } };

  try {
    const adminClient = getServiceRoleSupabase();
    await adminClient.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Demo Candidate' }
    }).catch(() => {});
  } catch (e) {
    // Ignored
  }

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword
    });
    if (data?.session) sessionData = data.session;
    if (data?.user) userData = data.user;
  } catch (e) {
    // Local demo fallback
  }

  const response = NextResponse.json({
    success: true,
    message: 'Demo session active.',
    session: sessionData,
    user: userData
  });

  // Set demo session cookie with 7-day validity
  response.cookies.set({
    name: 'sb-demo-session',
    value: 'true',
    httpOnly: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax'
  });

  return response;
}
