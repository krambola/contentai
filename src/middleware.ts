import { NextRequest, NextResponse } from 'next/server';

// Rotas públicas (sem autenticação)
const PUBLIC_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Deixa passar rotas públicas e assets
  if (
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Verifica cookie de sessão do Firebase
  // O Firebase Auth usa cookies internamente via IndexedDB no client-side.
  // Para proteção server-side real, use Firebase Admin SDK + session cookies.
  // Por ora, o guard é feito no client via AuthGuard component.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
