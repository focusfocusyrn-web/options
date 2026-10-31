import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = req.nextUrl.pathname === '/admin/login';
  
  // Check for YOUR specific cookie name
  const session = req.cookies.get('nova_admin_session')?.value;

  // If trying to access admin dashboard without login, redirect to login
  if (isAdminRoute && !isLoginPage && !session) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  // If already logged in and trying to visit login page, redirect to dashboard
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};