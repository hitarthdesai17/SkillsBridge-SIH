import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options
        });
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        supabaseResponse.cookies.set({
          name,
          value,
          ...options
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options
        });
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        supabaseResponse.cookies.set({
          name,
          value: '',
          ...options
        });
      }
    }
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const demoSession = request.cookies.get('sb-demo-session')?.value;
  const isAuthenticated = Boolean(user) || Boolean(demoSession);

  const pathname = request.nextUrl.pathname;

  // Protected paths that require authentication
  const protectedRoutes = ['/dashboard', '/upload', '/profile', '/opportunity'];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  // Auth pages (login/signup)
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  // If user is unauthenticated and tries to access a protected route
  if (!isAuthenticated && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is already authenticated and visits login/signup, redirect to dashboard
  if (isAuthenticated && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.searchParams.delete('redirect');
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
