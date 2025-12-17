import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est connecté
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    console.log('🔍 Changement de mot de passe demandé par:', session.user.email)
    console.log('📊 Données reçues:', { 
      hasCurrentPassword: !!currentPassword, 
      hasNewPassword: !!newPassword,
      currentPasswordLength: currentPassword?.length,
      newPasswordLength: newPassword?.length
    })

    // Validation
    if (!currentPassword || !newPassword) {
      console.log('❌ Validation échouée: champs manquants')
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit être différent de l\'ancien' },
        { status: 400 }
      )
    }

    // Récupérer le compte
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: 'credential'
      }
    })

    if (!account || !account.password) {
      return NextResponse.json(
        { error: 'Compte introuvable' },
        { status: 404 }
      )
    }

    // ✅ Vérifier le mot de passe actuel avec bcrypt
    console.log('🔐 Vérification du mot de passe actuel...')
    const isValidPassword = await bcrypt.compare(currentPassword, account.password)
    console.log('🔐 Résultat de la vérification:', isValidPassword ? '✅ Valide' : '❌ Invalide')

    if (!isValidPassword) {
      console.log('❌ Mot de passe actuel incorrect pour:', session.user.email)
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 }
      )
    }

    // ✅ Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // ✅ Mettre à jour le mot de passe dans la base de données
    await prisma.account.update({
      where: { id: account.id },
      data: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    })

    console.log(`✅ Utilisateur ${session.user.email} a changé son mot de passe`)

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    })

  } catch (error: any) {
    console.error('❌ Erreur lors du changement de mot de passe:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors du changement de mot de passe',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}