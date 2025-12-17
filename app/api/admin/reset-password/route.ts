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
    const { userId, newPassword } = body

    // Validation
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
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

    // ✅ SOLUTION : Utiliser crypto + bcrypt natif de Node.js
    // BetterAuth utilise bcrypt, donc on l'utilise directement
    const bcrypt = await import('bcrypt')
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe dans la base de données
    await prisma.account.update({
      where: { id: account.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // Invalider toutes les sessions de l'utilisateur
    await prisma.session.deleteMany({
      where: { userId: userId }
    })

    console.log(`✅ Admin ${session.user.email} a réinitialisé le mot de passe de ${user.email}`)

    return NextResponse.json({
      success: true,
      message: `Mot de passe réinitialisé avec succès pour ${user.email}`
    })

  } catch (error: any) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la réinitialisation du mot de passe',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}