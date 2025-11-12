import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentSession } from '@/lib/session'

const protectedWFMRoutes = ['/wfm', '/api/wfm']

// ⭐ AJOUTEZ LA CONFIGURATION CORS ICI
const allowedOrigins = [
  'https://consolidations-notes-1-eppvmf8mj.vercel.app',
  'https://consolidations-notes-1-g5qh3cu3u.vercel.app',
  'http://localhost:3000'
]

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  console.log('🔍 PROXY - Pathname:', pathname)

  // ⭐ GESTION CORS - AJOUTEZ CETTE SECTION
  const origin = request.headers.get('origin')
  if (origin && allowedOrigins.includes(origin)) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    // Gestion des requêtes OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200,
        headers: Object.fromEntries(response.headers)
      })
    }
    
    return response
  }

  // Laisser passer les routes auth
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

    // Protection routes WFM - SEULEMENT les routes /wfm/**
    if (pathname.startsWith('/wfm') && userRole !== 'WFM') {
      console.log(`🚫 WFM route access denied for role: ${userRole}`)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Protection routes Jury - SEULEMENT les routes /jury/**
    if (pathname.startsWith('/jury') && userRole !== 'JURY') {
      console.log(`🚫 Jury route access denied for role: ${userRole}`)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // ✅ LES ROUTES /api/jury SONT ACCESSIBLES AUX WFM ET JURY
    // selon les permissions dans chaque route API

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