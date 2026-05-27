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

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userCookie = request.cookies.get('user')?.value;
  let isConfirmed = true;

  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      isConfirmed = user.is_confirmed !== false;
    } catch (e) {}
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Unauthenticated user hitting a protected route → login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const bypassRedirect =
    pathname.startsWith('/confirm') || pathname.startsWith('/check-email');

  // Logged-in but unconfirmed → check-email 
  if (token && !isConfirmed && !bypassRedirect) {
    return NextResponse.redirect(new URL('/check-email', request.url));
  }

  // Logged-in confirmed user hitting a public/auth page → dashboard
  if (token && isPublic && !bypassRedirect) {
    return NextResponse.redirect(new URL('/jobs', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
