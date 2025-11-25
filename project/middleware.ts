import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(request: NextRequest) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: [
    '/client-information/:path*',
    '/financial-position/:path*',
    '/investment-properties/:path*',
    '/projections/:path*',
    '/summary/:path*',
    '/tax-optimization/:path*',
    '/api/clients/:path*'
  ]
};