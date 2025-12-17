//app/api/admin/change-role/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est WFM
    const session = await auth.api.getSession({
      headers: await headers()
     })

    if (!session || session.user.role !== 'WFM') {
      return NextResponse.json(
        { error: 'Non autorisé - réservé aux administrateurs WFM' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, newRole } = body

    // Validation
    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que le rôle est valide
    const validRoles = ['WFM', 'JURY']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Les rôles valides sont : WFM, JURY' },
        { status: 400 }
      )
    }

    // Empêcher de changer son propre rôle
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier votre propre rôle' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    const oldRole = user.role

    // Chercher si un juryMember existe pour cet utilisateur
    const existingJuryMember = await prisma.juryMember.findUnique({
      where: { userId: userId }
    })

    // Mettre à jour le rôle
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    })

    // Si on passe de JURY à WFM, supprimer l'entrée JuryMember
    if (oldRole === 'JURY' && newRole === 'WFM' && existingJuryMember) {
      await prisma.juryMember.delete({
        where: { userId: userId }
      })
    }

    // Si on passe de WFM à JURY, créer une entrée JuryMember si elle n'existe pas
    if (oldRole === 'WFM' && newRole === 'JURY' && !existingJuryMember) {
      await prisma.juryMember.create({
        data: {
          userId: user.id,
          fullName: user.name,
          roleType: 'REPRESENTANT_METIER', // Valeur par défaut
          isActive: true,
        }
      })
    }

    console.log(`✅ Admin ${session.user.email} a changé le rôle de ${user.email} de ${oldRole} vers ${newRole}`)

    return NextResponse.json({
      success: true,
      message: `Rôle changé de ${oldRole} vers ${newRole} avec succès`,
      oldRole,
      newRole
    })

  } catch (error) {
    console.error('❌ Erreur lors du changement de rôle:', error)
    return NextResponse.json(
      { error: 'Erreur lors du changement de rôle' },
      { status: 500 }
    )
  }
}