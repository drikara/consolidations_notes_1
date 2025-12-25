// app/api/auth/switch-mode/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      console.log('❌ Switch-mode: Pas de session')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2️⃣ Récupérer le viewMode depuis le body
    const body = await request.json()
    const { viewMode } = body

    console.log('🔄 Switch-mode request:', {
      userId: session.user.id,
      requestedMode: viewMode
    })

    // 3️⃣ Valider le viewMode
    if (!viewMode || !['WFM', 'JURY'].includes(viewMode)) {
      console.log('❌ viewMode invalide:', viewMode)
      return NextResponse.json({ 
        error: 'viewMode doit être WFM ou JURY' 
      }, { status: 400 })
    }

    // 4️⃣ Vérifier que l'utilisateur peut basculer (doit être WFM_JURY)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        juryMember: {
          select: {
            roleType: true,
            isActive: true
          }
        }
      }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé:', session.user.id)
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé' 
      }, { status: 404 })
    }

    const isWFMJury = user.role === 'WFM' && user.juryMember?.roleType === 'WFM_JURY'

    if (!isWFMJury) {
      console.log('❌ Utilisateur non WFM_JURY:', {
        role: user.role,
        juryRoleType: user.juryMember?.roleType
      })
      return NextResponse.json({ 
        error: 'Seuls les utilisateurs WFM_JURY peuvent basculer de mode' 
      }, { status: 403 })
    }

    // 5️⃣ Définir le cookie viewMode
    const cookieStore = await cookies()
    cookieStore.set('viewMode', viewMode, {
      httpOnly: false, // Accessible côté client pour lecture
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 jours
      path: '/'
    })

    console.log(`✅ Cookie viewMode défini: ${viewMode} pour ${user.email}`)

    // 6️⃣ Retourner la réponse de succès
    return NextResponse.json({
      success: true,
      viewMode,
      message: `Mode basculé vers ${viewMode}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        juryRoleType: user.juryMember?.roleType
      }
    })

  } catch (error) {
    console.error('❌ Erreur switch-mode:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du changement de mode',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}