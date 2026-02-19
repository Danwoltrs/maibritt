import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Validate session server-side (getUser() verifies the JWT, unlike getSession())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected admin routes - all (admin) route group paths
  // Be specific to avoid blocking public routes (/series page, /exhibitions page, /artworks/series)
  const pathname = req.nextUrl.pathname
  const isAdminRoute = (
    // Exclusively admin prefixes (no public overlap)
    pathname.startsWith('/galleries') ||
    pathname.startsWith('/journal') ||
    pathname.startsWith('/quotes') ||
    pathname.startsWith('/sales') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/exhibitions/manage') ||
    // /admin/* but not /admin itself (login page)
    (pathname.startsWith('/admin') && pathname !== '/admin') ||
    // /artworks admin pages: /artworks (exact list page), /artworks/new, /artworks/locations, /artworks/[id]/edit
    (pathname.startsWith('/artworks') && !pathname.startsWith('/artworks/series')) ||
    // /series/[id] is admin; /series (exact) is public
    (pathname.startsWith('/series/') && pathname !== '/series') ||
    // Protected API routes
    pathname.startsWith('/api/scrape-press')
  )

  // Redirect to admin (with login modal) if accessing admin routes without authentication
  if (isAdminRoute && !user) {
    const redirectUrl = new URL('/admin', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Let client-side handle login redirects for authenticated users
  // Middleware redirects don't work reliably with client-side navigation in dev mode
  // if (req.nextUrl.pathname === '/login' && session) {
  //   const redirectTo = req.nextUrl.searchParams.get('redirectTo') || '/admin/dashboard'
  //   return NextResponse.redirect(new URL(redirectTo, req.url))
  // }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}