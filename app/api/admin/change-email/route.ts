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
    const { userId, newEmail } = body

    // Validation
    if (!userId || !newEmail) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
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

    // Vérifier que le nouvel email n'est pas déjà utilisé
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail }
    })

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    const oldEmail = user.email

    // Récupérer le compte associé
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        providerId: 'credential'
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Compte introuvable' },
        { status: 404 }
      )
    }

    // ✅ Utiliser une transaction Prisma pour garantir la cohérence
    await prisma.$transaction([
      // Mettre à jour l'email dans la table User
      prisma.user.update({
        where: { id: userId },
        data: { 
          email: newEmail,
          emailVerified: false, // Réinitialiser la vérification
          updatedAt: new Date()
        }
      }),
      
      // Mettre à jour l'accountId dans la table Account
      prisma.account.update({
        where: { id: account.id },
        data: {
          accountId: newEmail,
          updatedAt: new Date()
        }
      })
    ])

    // Invalider toutes les sessions de l'utilisateur
    await prisma.session.deleteMany({
      where: { userId: userId }
    })

    console.log(`✅ Admin ${session.user.email} a changé l'email de ${oldEmail} vers ${newEmail}`)

    return NextResponse.json({
      success: true,
      message: `Email modifié avec succès pour ${oldEmail} → ${newEmail}`,
      oldEmail,
      newEmail
    })

  } catch (error: any) {
    console.error('❌ Erreur lors du changement d\'email par admin:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors du changement d\'email',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}