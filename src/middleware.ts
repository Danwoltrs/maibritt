import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: req,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add code between createServerClient and getUser().
  // A simple mistake could make it very hard to debug issues with users
  // being randomly logged out.

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

  // IMPORTANT: You *must* return the supabaseResponse object as is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so: const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so: myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing the cookies!
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
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