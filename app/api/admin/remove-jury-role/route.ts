
// app/api/admin/remove-jury-role/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { AuditService, getRequestInfo } from '@/lib/audit-service'

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
      return NextResponse.json({ error: 'Accès réservé aux administrateurs WFM' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { juryMember: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    if (!targetUser.juryMember) {
      return NextResponse.json({ 
        error: 'Cet utilisateur n\'a pas le rôle WFM_JURY' 
      }, { status: 400 })
    }

    if (userId === session.user.id) {
      return NextResponse.json({ 
        error: 'Vous ne pouvez pas retirer votre propre rôle WFM_JURY' 
      }, { status: 400 })
    }

    await prisma.juryMember.delete({
      where: { userId }
    })

    // Audit
    const requestInfo = getRequestInfo(request)
    await AuditService.log({
      userId: session.user.id,
      userName: session.user.name || 'Utilisateur',
      userEmail: session.user.email,
      action: 'DELETE',
      entity: 'USER_ROLE',
      entityId: userId,
      description: `Retrait du rôle WFM_JURY de ${targetUser.name} (${targetUser.email})`,
      metadata: {
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        removedRoleType: targetUser.juryMember.roleType
      },
      ...requestInfo
    })

    return NextResponse.json({
      success: true,
      message: 'Rôle WFM_JURY retiré avec succès',
      data: {
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        }
      }
    })

  } catch (error) {
    console.error('Erreur retrait rôle jury:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors du retrait du rôle',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}