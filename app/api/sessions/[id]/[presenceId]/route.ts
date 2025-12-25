
//  app/api/sessions/[id]/[presenceId]/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

interface JuryPresenceParams {
  params: Promise<{ id: string; presenceId: string }>
}

export async function DELETE(request: Request, { params }: JuryPresenceParams) {
  try {
    const { id, presenceId } = await params
    console.log(`🎯 DELETE /api/sessions/${id}/jury/${presenceId}`)

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que la présence existe
    const presence = await prisma.juryPresence.findUnique({
      where: { id: parseInt(presenceId) }
    })

    if (!presence) {
      return NextResponse.json({ 
        error: "Présence non trouvée" 
      }, { status: 404 })
    }

    // Supprimer la présence
    await prisma.juryPresence.delete({
      where: { id: parseInt(presenceId) }
    })

    console.log("✅ Présence supprimée:", presenceId)
    return NextResponse.json({ message: "Présence supprimée avec succès" })

  } catch (error) {
    console.error("❌ Erreur DELETE présence:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: JuryPresenceParams) {
  try {
    const { id, presenceId } = await params
    console.log(`🎯 PATCH /api/sessions/${id}/jury/${presenceId}`)

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    const { wasPresent, absenceReason } = data

    // Vérifier que la présence existe
    const presence = await prisma.juryPresence.findUnique({
      where: { id: parseInt(presenceId) }
    })

    if (!presence) {
      return NextResponse.json({ 
        error: "Présence non trouvée" 
      }, { status: 404 })
    }

    // Mettre à jour la présence
    const updatedPresence = await prisma.juryPresence.update({
      where: { id: parseInt(presenceId) },
      data: {
        wasPresent: wasPresent ?? presence.wasPresent,
        absenceReason: wasPresent ? null : (absenceReason || presence.absenceReason)
      },
      include: {
        juryMember: {
          select: {
            id: true,
            fullName: true,
            roleType: true,
            specialite: true
          }
        }
      }
    })

    console.log("✅ Présence mise à jour:", presenceId)
    return NextResponse.json(updatedPresence)

  } catch (error) {
    console.error("❌ Erreur PATCH présence:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}