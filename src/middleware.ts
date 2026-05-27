import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/jobs',
    '/scholarships',
    '/applications',
    '/saved',
    '/profile',
    '/admin',
  ];

  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If trying to access protected route without token, redirect to landing page
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and trying to access landing page, redirect to dashboard
  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If already logged in and trying to access auth pages, redirect to dashboard
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/confirm', '/check-email'];
  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    //  Match all request paths except:
    
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};