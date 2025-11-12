// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentSession } from '@/lib/session'

const protectedWFMRoutes = ['/wfm', '/api/wfm']

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  console.log('🔍 PROXY - Pathname:', pathname)

  // Laisser passer les routes auth (CORS géré par middleware.ts)
  if (pathname.startsWith('/api/auth')) {
    console.log('🔓 Auth route bypassed:', pathname)
    return NextResponse.next()
  }

  // Redirection depuis /unauthorized
  if (pathname === '/unauthorized') {
    console.log('🔄 Redirecting from /unauthorized')
    const session = await getCurrentSession()
    
    if (session?.user) {
      const redirectPath = session.user.role === 'WFM' 
        ? '/wfm/dashboard' 
        : '/jury/dashboard'
      console.log(`🎯 Redirecting to: ${redirectPath} (role: ${session.user.role})`)
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  try {
    const session = await getCurrentSession()

    // Routes publiques
    if (pathname.startsWith('/auth') || pathname === '/') {
      return NextResponse.next()
    }

    // Vérification de session
    if (!session?.user) {
      console.log('❌ No session for:', pathname)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const userRole = session.user.role

    console.log(`✅ Proxy: ${pathname} - Role: ${userRole} - Email: ${session.user.email}`)

    // Protection routes WFM
    if (pathname.startsWith('/wfm') && userRole !== 'WFM') {
      console.log(`🚫 WFM route access denied for role: ${userRole}`)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Protection routes Jury
    if (pathname.startsWith('/jury') && userRole !== 'JURY') {
      console.log(`🚫 Jury route access denied for role: ${userRole}`)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('❌ Proxy error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}