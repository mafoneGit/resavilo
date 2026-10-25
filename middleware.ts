import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())
  const isProduction = process.env.NODE_ENV === 'production'
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isProduction ? '' : " 'unsafe-eval'"}`,
    // The current design and UI components use inline style attributes.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${isProduction ? '' : ' ws: wss:'}`,
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    ...(isProduction ? ['upgrade-insecure-requests'] : []),
  ].join('; ')

  // Overwrite client headers so Next.js only uses our generated nonce.
  const headers = new Headers(request.headers)
  headers.set('Content-Security-Policy', policy)
  headers.set('x-nonce', nonce)
  const response = NextResponse.next({ request: { headers } })
  response.headers.set('Content-Security-Policy', policy)
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
