// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

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

  try {
    const session = await getCurrentSession()

    // Routes publiques - AMÉLIORATION ICI
    if (pathname.startsWith('/auth') || pathname === '/') {
      if (session?.user) {
        // Récupérer le juryMember pour déterminer la redirection
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { juryMember: true }
        })
        
        const isWFMJury = user?.role === 'WFM' && user?.juryMember?.roleType === 'WFM_JURY'
        
        let redirectPath = '/wfm/dashboard'
        
        if (user?.role === 'JURY') {
          redirectPath = '/jury/dashboard'
        } else if (isWFMJury) {
          // Pour WFM_JURY, lire le cookie viewMode
          const viewModeCookie = request.cookies.get('viewMode')?.value
          redirectPath = viewModeCookie === 'JURY' ? '/jury/dashboard' : '/wfm/dashboard'
          console.log(`🔄 WFM_JURY redirection based on viewMode: ${viewModeCookie || 'default(WFM)'} -> ${redirectPath}`)
        }
        
        console.log(`🔄 Redirection depuis auth vers: ${redirectPath}`)
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
      return NextResponse.next()
    }

    // Redirection depuis /unauthorized
    if (pathname === '/unauthorized') {
      console.log('🔄 Redirecting from /unauthorized')
      
      if (session?.user) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { juryMember: true }
        })
        
        const isWFMJury = user?.role === 'WFM' && user?.juryMember?.roleType === 'WFM_JURY'
        
        let redirectPath = '/wfm/dashboard'
        
        if (user?.role === 'JURY') {
          redirectPath = '/jury/dashboard'
        } else if (isWFMJury) {
          const viewModeCookie = request.cookies.get('viewMode')?.value
          redirectPath = viewModeCookie === 'JURY' ? '/jury/dashboard' : '/wfm/dashboard'
        }
        
        console.log(`🎯 Redirecting to: ${redirectPath}`)
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Vérification de session pour les routes protégées
    if (!session?.user) {
      console.log('❌ No session for:', pathname)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const userRole = session.user.role

    // Récupérer le juryMember pour vérifier WFM_JURY
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { juryMember: true }
    })
    
    const isWFMJury = user?.role === 'WFM' && user?.juryMember?.roleType === 'WFM_JURY'
    const viewMode = request.cookies.get('viewMode')?.value || 'WFM'

    console.log(`✅ Proxy: ${pathname} - Role: ${userRole} - WFM_JURY: ${isWFMJury} - ViewMode: ${viewMode}`)

    // 🎯 Protection routes WFM - LOGIQUE AMÉLIORÉE
    if (pathname.startsWith('/wfm')) {
      // Seuls les WFM peuvent accéder
      if (userRole !== 'WFM') {
        console.log(`🚫 WFM route access denied for role: ${userRole}`)
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
      
      // WFM_JURY en mode JURY ne peut PAS accéder aux routes WFM
      if (isWFMJury && viewMode === 'JURY') {
        console.log('🚫 WFM_JURY en mode JURY tente d\'accéder à /wfm → Redirection vers /jury/dashboard')
        return NextResponse.redirect(new URL('/jury/dashboard', request.url))
      }
      
      console.log(`✅ WFM route authorized (ViewMode: ${viewMode})`)
      return NextResponse.next()
    }

    // 🎯 Protection routes Jury - LOGIQUE AMÉLIORÉE
    if (pathname.startsWith('/jury')) {
      // JURY standard avec juryMember
      if (userRole === 'JURY') {
        if (!user?.juryMember) {
          console.log('🚫 JURY sans profil juryMember')
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
        console.log(`✅ JURY route authorized for JURY`)
        return NextResponse.next()
      } 
      
      // WFM_JURY peut toujours accéder (peu importe le viewMode)
      if (isWFMJury) {
        console.log(`✅ JURY route authorized for WFM_JURY (ViewMode: ${viewMode})`)
        return NextResponse.next()
      }
      
      // WFM standard (sans WFM_JURY) ne peut PAS accéder
      console.log(`🚫 Jury route access denied for role: ${userRole} (not WFM_JURY)`)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // ⭐ PROTECTION DES API ROUTES
    if (pathname.startsWith('/api/')) {
      // 1️⃣ Routes JURY - Autoriser JURY et WFM_JURY
      if (pathname.startsWith('/api/jury/scores') || 
          pathname.startsWith('/api/jury/check-session')) {
        if (userRole === 'JURY' || isWFMJury) {
          console.log(`✅ API ${pathname} authorized for ${isWFMJury ? 'WFM_JURY' : 'JURY'}`)
          return NextResponse.next()
        }
        console.log(`🚫 API ${pathname} access denied for role: ${userRole}`)
        return NextResponse.json({ error: 'Accès réservé aux membres du jury' }, { status: 403 })
      }
      
      // 2️⃣ Routes WFM - Gestion des jurys (réservé aux WFM uniquement)
      if (pathname.startsWith('/api/jury') && !pathname.startsWith('/api/jury/scores') && !pathname.startsWith('/api/jury/check-session')) {
        if (userRole !== 'WFM') {
          console.log(`🚫 API /api/jury (gestion) access denied for role: ${userRole}`)
          return NextResponse.json({ error: 'Accès réservé aux WFM' }, { status: 403 })
        }
        console.log(`✅ API /api/jury (gestion) authorized`)
        return NextResponse.next()
      }
      
      // 3️⃣-7️⃣ Autres routes WFM (sessions, candidats, scores, export, consolidation, admin)
      const wfmApiPaths = ['/api/sessions', '/api/candidates', '/api/scores', '/api/export', '/api/consolidation', '/api/admin']
      for (const path of wfmApiPaths) {
        if (pathname.startsWith(path)) {
          if (userRole !== 'WFM') {
            console.log(`🚫 API ${pathname} access denied for role: ${userRole}`)
            return NextResponse.json({ error: 'Accès réservé aux WFM' }, { status: 403 })
          }
          console.log(`✅ API ${pathname} authorized`)
          return NextResponse.next()
        }
      }
      
      console.log(`✅ API ${pathname} authorized (no specific rule)`)
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