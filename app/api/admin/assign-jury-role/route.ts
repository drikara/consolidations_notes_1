import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
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

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { juryMember: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est WFM
    if (targetUser.role !== 'WFM') {
      return NextResponse.json({ 
        error: 'Seuls les utilisateurs avec le rôle WFM peuvent avoir le double rôle WFM_JURY' 
      }, { status: 400 })
    }

    // Vérifier si l'utilisateur est déjà juryMember
    let juryMember
    
    if (targetUser.juryMember) {
      // Mettre à jour l'existant
      juryMember = await prisma.juryMember.update({
        where: { userId },
        data: { 
          roleType: 'WFM_JURY',
          isActive: true, // Correction: utiliser isActive au lieu de status
          updatedAt: new Date()
        }
      })
    } else {
      // Créer une nouvelle entrée
      // Tu dois t'assurer que tous les champs requis sont fournis
      juryMember = await prisma.juryMember.create({
        data: {
          userId,
          roleType: 'WFM_JURY',
          isActive: true, // Correction: utiliser isActive au lieu de status
          fullName: targetUser.name || 'Utilisateur WFM', // Champ requis probablement
          // Ajoute d'autres champs requis si nécessaire
          phone: null,
          notes: null,
          department: null,
          specialite: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Rôle WFM_JURY attribué avec succès',
      data: {
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        },
        juryMember: {
          roleType: juryMember.roleType,
          isActive: juryMember.isActive // Correction
        }
      }
    })

  } catch (error) {
    console.error('Erreur attribution rôle jury:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de l\'attribution du rôle',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}