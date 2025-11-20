import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, JuryRoleType } from "@prisma/client"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    console.log(`🎯 PUT /api/jury/${id} - Mise à jour membre du jury`)
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    console.log("👤 Session user:", session?.user)
    console.log("🔐 Role:", (session?.user as any)?.role)

    if (!session || (session.user as any).role !== "WFM") {
      console.log("❌ Non autorisé - Role:", (session?.user as any)?.role)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    const juryId = parseInt(id)

    if (isNaN(juryId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    // Vérifier que le membre du jury existe
    const existingJury = await prisma.juryMember.findUnique({
      where: { id: juryId },
    })

    if (!existingJury) {
      return NextResponse.json({ error: "Membre du jury non trouvé" }, { status: 404 })
    }

    // Préparer les données de mise à jour
    const updateData: any = {}

    if (data.full_name) updateData.fullName = data.full_name
    if (data.department !== undefined) updateData.department = data.department
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.is_active !== undefined) updateData.isActive = data.is_active

    // Validation du role_type
    if (data.role_type) {
      if (Object.values(JuryRoleType).includes(data.role_type)) {
        updateData.roleType = data.role_type
      } else {
        return NextResponse.json({ error: "Type de rôle invalide" }, { status: 400 })
      }
    }

    // Validation de la spécialité
    if (data.specialite !== undefined) {
      if (data.specialite === "" || data.specialite === null || data.specialite === "none") {
        updateData.specialite = null
      } else if (Object.values(Metier).includes(data.specialite)) {
        updateData.specialite = data.specialite
      } else {
        return NextResponse.json({ error: "Spécialité invalide" }, { status: 400 })
      }
    }

    const juryMember = await prisma.juryMember.update({
      where: { id: juryId },
      data: updateData,
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

    console.log("✅ Membre du jury mis à jour:", juryMember.id)
    return NextResponse.json(juryMember)

  } catch (error) {
    console.error(`💥 ERREUR dans PUT /api/jury:`, error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    console.log(`🎯 DELETE /api/jury/${id} - Suppression membre du jury`)
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    console.log("👤 Session user:", session?.user)
    console.log("🔐 User role:", (session?.user as any)?.role)

    if (!session) {
      console.log("❌ Pas de session")
      return NextResponse.json({ error: "Non autorisé - Pas de session" }, { status: 401 })
    }

    if ((session.user as any).role !== "WFM") {
      console.log("❌ Rôle non autorisé:", (session.user as any).role)
      return NextResponse.json({ 
        error: "Non autorisé - Accès réservé aux WFM" 
      }, { status: 403 })
    }

    const juryId = parseInt(id)

    if (isNaN(juryId)) {
      console.log("❌ ID invalide:", id)
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    // Vérifier que le membre du jury existe
    const existingJury = await prisma.juryMember.findUnique({
      where: { id: juryId },
      include: {
        faceToFaceScores: {
          select: { id: true }
        },
        juryPresences: {
          select: { id: true }
        }
      }
    })

    if (!existingJury) {
      console.log("❌ Membre du jury non trouvé:", juryId)
      return NextResponse.json({ error: "Membre du jury non trouvé" }, { status: 404 })
    }

    console.log("📊 Données à supprimer:", {
      juryId,
      evaluations: existingJury.faceToFaceScores.length,
      presences: existingJury.juryPresences.length
    })

    // Suppression en cascade avec transaction pour plus de sécurité
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer les évaluations face à face
      console.log("1️⃣ Suppression des évaluations face à face...")
      await tx.faceToFaceScore.deleteMany({
        where: { juryMemberId: juryId }
      })

      // 2. Supprimer les présences aux sessions
      console.log("2️⃣ Suppression des présences...")
      await tx.juryPresence.deleteMany({
        where: { juryMemberId: juryId }
      })

      // 3. Supprimer le membre du jury
      console.log("3️⃣ Suppression du membre du jury...")
      await tx.juryMember.delete({
        where: { id: juryId }
      })
    })

    console.log("✅ Membre du jury supprimé avec succès:", juryId)
    return NextResponse.json({ 
      message: "Membre du jury supprimé avec succès",
      deletedId: juryId
    })

  } catch (error) {
    console.error(`💥 ERREUR dans DELETE /api/jury:`, error)
    return NextResponse.json({ 
      error: "Erreur serveur lors de la suppression" 
    }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    console.log(`🎯 GET /api/jury/${id} - Récupération membre spécifique`)
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const juryId = parseInt(id)

    if (isNaN(juryId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const juryMember = await prisma.juryMember.findUnique({
      where: { id: juryId },
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
            phase: true,
            score: true,
            evaluatedAt: true,
            candidate: {
              select: {
                fullName: true,
              }
            }
          },
        },
        juryPresences: {
          select: {
            id: true,
            wasPresent: true,
            session: {
              select: {
                metier: true,
                date: true,
              },
            },
          },
        },
      },
    })

    if (!juryMember) {
      return NextResponse.json({ error: "Membre du jury non trouvé" }, { status: 404 })
    }

    return NextResponse.json(juryMember)

  } catch (error) {
    console.error(`💥 ERREUR dans GET /api/jury:`, error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}