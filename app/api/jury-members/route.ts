import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, JuryRoleType } from "@prisma/client"

export async function POST(request: Request) {
  try {
    console.log("🎯 POST /api/jury-members - Début de la création d'un membre du jury")
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    console.log("🔐 Session user:", session?.user)

    if (!session) {
      console.log("❌ Pas de session")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "WFM") {
      console.log("❌ Rôle non autorisé:", session.user.role)
      return NextResponse.json({ error: "Accès réservé aux WFM" }, { status: 403 })
    }

    const data = await request.json()
    console.log("📦 Données reçues:", data)

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: data.user_id },
    })

    if (!user) {
      console.log("❌ Utilisateur non trouvé:", data.user_id)
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    console.log("✅ Utilisateur trouvé:", user.email)

    // Vérifier l'unicité
    const existing = await prisma.juryMember.findUnique({
      where: { userId: data.user_id },
    })

    if (existing) {
      console.log("❌ Utilisateur déjà membre du jury")
      return NextResponse.json({ error: "Cet utilisateur est déjà membre du jury" }, { status: 400 })
    }

    // Conversion des enums avec validation
    let specialite = null
    if (data.specialite) {
      if (Object.values(Metier).includes(data.specialite)) {
        specialite = data.specialite
        console.log("✅ Spécialité valide:", specialite)
      } else {
        console.log("❌ Spécialité invalide:", data.specialite)
        return NextResponse.json({ error: "Spécialité invalide" }, { status: 400 })
      }
    }

    let roleType: JuryRoleType
    if (data.role_type && Object.values(JuryRoleType).includes(data.role_type)) {
      roleType = data.role_type
      console.log("✅ Role type valide:", roleType)
    } else {
      console.log("❌ Role type invalide:", data.role_type)
      return NextResponse.json({ 
        error: "Type de rôle invalide. Valeurs acceptées: " + Object.values(JuryRoleType).join(", ") 
      }, { status: 400 })
    }

    // Création du membre du jury
    console.log("🔄 Création du membre du jury...")
    const juryMember = await prisma.juryMember.create({
      data: {
        userId: data.user_id,
        fullName: data.full_name,
        roleType: roleType,
        specialite: specialite,
        department: data.department || null,
        phone: data.phone || null,
        notes: data.notes || null,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            role: true,
          },
        },
      },
    })

    console.log("✅ Membre du jury créé avec succès:", juryMember.id)
    return NextResponse.json(juryMember)

  } catch (error) {
    console.error("💥 ERREUR dans POST /api/jury-members:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log("🎯 GET /api/jury-members - Récupération des membres du jury")
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // ✅ WFM peut voir tous les membres, JURY peut voir seulement certains
    if (session.user.role !== "WFM" && session.user.role !== "JURY") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const juryMembers = await prisma.juryMember.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
            role: true,
            isActive: true,
            lastLogin: true,
          },
        },
        faceToFaceScores: {
          select: {
            id: true,
          },
        },
        juryPresences: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`✅ ${juryMembers.length} membres du jury récupérés`)

    const formattedMembers = juryMembers.map(member => ({
      id: member.id,
      userId: member.userId,
      fullName: member.fullName,
      roleType: member.roleType,
      specialite: member.specialite,
      department: member.department,
      phone: member.phone,
      isActive: member.isActive,
      notes: member.notes,
      user: member.user,
      stats: {
        evaluationsCount: member.faceToFaceScores.length,
        presencesCount: member.juryPresences.length,
      },
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }))

    return NextResponse.json(formattedMembers)

  } catch (error) {
    console.error("💥 ERREUR dans GET /api/jury-members:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}