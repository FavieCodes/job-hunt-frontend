import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/confirm',
  '/check-email',
];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/jobs',
  '/scholarships',
  '/applications',
  '/saved',
  '/profile',
  '/admin',
];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userCookie = request.cookies.get('user')?.value;
  const { pathname } = request.nextUrl;

  let isConfirmed = true;
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      isConfirmed = user.is_confirmed !== false;
    } catch (e) {
      isConfirmed = false;
    }
  }

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  const bypassConfirmationRedirect = 
    pathname.startsWith('/confirm') || 
    pathname.startsWith('/check-email');

  if (!token && isProtectedRoute) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  if (!token && !isPublicPath && !isProtectedRoute && pathname !== '/') {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  if (token && !isConfirmed && !bypassConfirmationRedirect) {
    return NextResponse.redirect(new URL('/check-email', request.url));
  }

  if (token && isConfirmed && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (token && isConfirmed && isPublicPath && !bypassConfirmationRedirect) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api|.*\\..*).*)',
  ],
};