// app/api/admin/create-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import bcrypt from 'bcrypt'
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
    const { name, email, password, role, roleType, specialite } = body

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Validation du rôle
    const validRoles = ['WFM', 'JURY']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Les rôles valides sont : WFM, JURY' },
        { status: 400 }
      )
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // Validation du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // ✅ Hasher le mot de passe avec bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        emailVerified: true,
        role,
      }
    })

    // Créer le compte avec les credentials
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: email,
        providerId: 'credential',
        password: hashedPassword,
      }
    })

    // Si le rôle est JURY, créer une entrée JuryMember
    if (role === 'JURY') {
      await prisma.juryMember.create({
        data: {
          userId: user.id,
          fullName: name,
          roleType: roleType || 'REPRESENTANT_METIER',
          specialite: (specialite && specialite !== 'NONE') ? specialite : null,
          isActive: true,
        }
      })
    }

    console.log(`✅ Admin ${session.user.email} a créé l'utilisateur ${email} avec le rôle ${role}`)

    return NextResponse.json({
      success: true,
      message: `Utilisateur créé avec succès`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    })

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    )
  }
}