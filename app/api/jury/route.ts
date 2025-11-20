// app/api/jury/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, JuryRoleType } from "@prisma/client"

// ⭐ FONCTION HELPER pour vérifier le rôle WFM
async function verifyWFMAccess() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  console.log("🔍 Session complète:", JSON.stringify(session, null, 2))

  if (!session?.user?.id) {
    console.log("❌ Pas de session ou d'ID utilisateur")
    return { authorized: false, error: "Non autorisé", status: 401 }
  }

  // ⭐ SOLUTION: Récupérer le rôle directement depuis la DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true }
  })

  console.log("👤 Utilisateur DB:", user)

  if (!user) {
    console.log("❌ Utilisateur non trouvé en DB")
    return { authorized: false, error: "Utilisateur non trouvé", status: 404 }
  }

  if (user.role !== "WFM") {
    console.log(`❌ Rôle insuffisant: ${user.role} (requis: WFM)`)
    return { 
      authorized: false, 
      error: `Accès réservé aux WFM (votre rôle: ${user.role})`, 
      status: 403 
    }
  }

  console.log("✅ Accès WFM autorisé pour:", user.email)
  return { authorized: true, userId: session.user.id }
}

export async function POST(request: Request) {
  try {
    console.log("🎯 POST /api/jury - Création d'un membre du jury")
    
    // ⭐ Vérification avec la nouvelle fonction
    const access = await verifyWFMAccess()
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const data = await request.json()
    console.log("📦 Données reçues:", data)

    // Validation des champs requis
    if (!data.user_id || !data.full_name || !data.role_type) {
      return NextResponse.json({ 
        error: "Champs manquants: user_id, full_name et role_type sont requis" 
      }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: data.user_id },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Vérifier que l'utilisateur n'est pas déjà membre du jury
    const existingJury = await prisma.juryMember.findUnique({
      where: { userId: data.user_id },
    })

    if (existingJury) {
      return NextResponse.json({ 
        error: "Cet utilisateur est déjà membre du jury" 
      }, { status: 400 })
    }

    // Validation du rôle
    if (!Object.values(JuryRoleType).includes(data.role_type)) {
      return NextResponse.json({ 
        error: `Rôle invalide. Valeurs acceptées: ${Object.values(JuryRoleType).join(", ")}` 
      }, { status: 400 })
    }

    // Validation de la spécialité si fournie
    if (data.specialite && data.specialite !== "none" && !Object.values(Metier).includes(data.specialite)) {
      return NextResponse.json({ 
        error: `Spécialité invalide. Valeurs acceptées: ${Object.values(Metier).join(", ")}` 
      }, { status: 400 })
    }

    // Création du membre du jury
    const juryMember = await prisma.juryMember.create({
      data: {
        userId: data.user_id,
        fullName: data.full_name,
        roleType: data.role_type,
        specialite: data.specialite === "none" ? null : data.specialite || null,
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

    console.log("✅ Membre du jury créé:", juryMember.id)
    return NextResponse.json(juryMember)

  } catch (error) {
    console.error("💥 ERREUR dans POST /api/jury:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log("🎯 GET /api/jury - Récupération des membres du jury")
    
    // ⭐ Vérification avec la nouvelle fonction
    const access = await verifyWFMAccess()
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
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
    console.error("💥 ERREUR dans GET /api/jury:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}