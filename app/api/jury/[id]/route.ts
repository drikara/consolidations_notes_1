import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier } from "@prisma/client"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Vérifier que le membre du jury existe
    const existingMember = await prisma.juryMember.findUnique({
      where: { id: Number.parseInt(id) },
    })

    if (!existingMember) {
      return NextResponse.json({ error: "Membre du jury non trouvé" }, { status: 404 })
    }

    // Conversion du métier si fourni
    const specialite = data.specialite 
      ? (Metier[data.specialite as keyof typeof Metier])
      : data.specialite === null ? null : undefined // Permet de mettre à null explicitement

    const juryMember = await prisma.juryMember.update({
      where: { id: Number.parseInt(id) },
      data: {
        fullName: data.full_name,
        roleType: data.role_type,
        specialite: specialite,
        department: data.department !== undefined ? data.department : undefined,
        phone: data.phone !== undefined ? data.phone : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        isActive: data.is_active !== undefined ? data.is_active : undefined,
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

    return NextResponse.json(juryMember)
  } catch (error) {
    console.error("[v0] Error updating jury member:", error)
    
    // Gestion d'erreurs plus spécifique
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Membre du jury non trouvé" }, { status: 404 })
    }
    
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que le membre du jury existe avant suppression
    const existingMember = await prisma.juryMember.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        faceToFaceScores: {
          select: { id: true }
        },
        juryPresences: {
          select: { id: true }
        }
      }
    })

    if (!existingMember) {
      return NextResponse.json({ error: "Membre du jury non trouvé" }, { status: 404 })
    }

    // Vérifier s'il y a des données associées (optionnel - pour informer l'utilisateur)
    const hasAssociatedData = existingMember.faceToFaceScores.length > 0 || existingMember.juryPresences.length > 0

    await prisma.juryMember.delete({
      where: { id: Number.parseInt(id) },
    })

    return NextResponse.json({ 
      success: true,
      message: hasAssociatedData 
        ? "Membre du jury supprimé (les données associées ont été conservées)" 
        : "Membre du jury supprimé avec succès"
    })
  } catch (error) {
    console.error(" Error deleting jury member:", error)
    
    // Gestion d'erreurs plus spécifique
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Membre du jury non trouvé" }, { status: 404 })
    }
    
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}