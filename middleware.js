import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Proteksi rute admin pada level server
  if (pathname.startsWith('/admin')) {
    const isPublicAdminRoute =
      pathname === '/admin/login' ||
      pathname === '/admin/reset-password';

    const token = request.cookies.get('sb-access-token')?.value;

    // Jika pengunjung tidak memiliki token auth dan membuka halaman privat admin
    if (!token && !isPublicAdminRoute) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Jika pengunjung sudah memiliki token auth dan membuka halaman login
    if (token && pathname === '/admin/login') {
      const adminUrl = new URL('/admin', request.url);
      return NextResponse.redirect(adminUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

