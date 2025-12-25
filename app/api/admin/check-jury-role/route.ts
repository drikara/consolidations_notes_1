// app/api/admin/check-jury-role/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userRole = (session.user as any)?.role
    if (userRole !== 'WFM') {
      return NextResponse.json({ 
        error: 'Accès réservé aux administrateurs WFM' 
      }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ 
        error: 'ID utilisateur requis' 
      }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { juryMember: true }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        hasJuryRole: !!user.juryMember,
        juryRoleType: user.juryMember?.roleType || null,
        isWFMJury: user.role === 'WFM' && user.juryMember?.roleType === 'WFM_JURY',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      }
    })

  } catch (error) {
    console.error('Erreur vérification rôle jury:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la vérification du rôle',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}