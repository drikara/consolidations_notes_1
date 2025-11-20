// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentSession } from '@/lib/session'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method

  console.log('🔍 PROXY - Pathname:', pathname, 'Method:', method)

  // Laisser passer les routes auth et API auth
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/auth/')) {
    console.log('🔓 Auth route bypassed:', pathname)
    return NextResponse.next()
  }

  // Laisser passer les routes static
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
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
      if (session?.user) {
        // Rediriger les utilisateurs connectés depuis les pages auth
        const redirectPath = session.user.role === 'WFM' 
          ? '/wfm/dashboard' 
          : '/jury/dashboard'
        console.log(`🔄 Redirection depuis auth vers: ${redirectPath}`)
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
      return NextResponse.next()
    }

    // Vérification de session pour les routes protégées
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

    // ⭐ CORRECTION ICI : Protection des API routes
    if (pathname.startsWith('/api/')) {
      // API /api/jury : réservée aux WFM (gestion des membres du jury)
      if (pathname.startsWith('/api/jury') && userRole !== 'WFM') {
        console.log(`🚫 API /api/jury access denied for role: ${userRole}`)
        return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
      }
      
      // API /api/sessions : réservée aux WFM
      if (pathname.startsWith('/api/sessions') && userRole !== 'WFM') {
        console.log(`🚫 API /api/sessions access denied for role: ${userRole}`)
        return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
      }
      
      // API /api/evaluations : accessible aux JURY uniquement
      if (pathname.startsWith('/api/evaluations') && userRole !== 'JURY') {
        console.log(`🚫 API /api/evaluations access denied for role: ${userRole}`)
        return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('❌ Proxy error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}