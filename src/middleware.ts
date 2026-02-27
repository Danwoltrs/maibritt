import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isAdminRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/galleries') ||
    pathname.startsWith('/journal/manage') ||
    pathname.startsWith('/quotes') ||
    pathname.startsWith('/sales') ||
    pathname.startsWith('/exhibitions/manage') ||
    pathname.startsWith('/dashboard') ||
    (pathname.startsWith('/admin') && pathname !== '/admin') ||
    (pathname.startsWith('/artworks') && !pathname.startsWith('/artworks/series')) ||
    (pathname.startsWith('/series/') && pathname !== '/series') ||
    pathname.startsWith('/api/scrape-press') ||
    pathname.startsWith('/api/translate')
  )
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Skip Supabase auth entirely for public routes
  if (!isAdminRoute(pathname)) {
    return NextResponse.next({ request: req })
  }

  // Only create Supabase client and check auth for admin routes
  let supabaseResponse = NextResponse.next({ request: req })

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
          supabaseResponse = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = new URL('/admin', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
