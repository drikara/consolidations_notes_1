// app/api/sessions/[id]/jury/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🎯 POST /api/sessions/${id}/jury - Ajout membre du jury`)

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    const { juryMemberId, wasPresent, absenceReason } = data

    if (!juryMemberId) {
      return NextResponse.json({ 
        error: "juryMemberId requis" 
      }, { status: 400 })
    }

    // Vérifier que la session existe
    const recruitmentSession = await prisma.recruitmentSession.findUnique({
      where: { id }
    })

    if (!recruitmentSession) {
      return NextResponse.json({ 
        error: "Session non trouvée" 
      }, { status: 404 })
    }

    // Vérifier que le jury existe
    const juryMember = await prisma.juryMember.findUnique({
      where: { id: juryMemberId }
    })

    if (!juryMember) {
      return NextResponse.json({ 
        error: "Membre du jury non trouvé" 
      }, { status: 404 })
    }

    // Vérifier que le jury n'est pas déjà dans cette session
    const existingPresence = await prisma.juryPresence.findFirst({
      where: {
        sessionId: id,
        juryMemberId: juryMemberId
      }
    })

    if (existingPresence) {
      return NextResponse.json({ 
        error: "Ce membre est déjà assigné à cette session" 
      }, { status: 400 })
    }

    // Créer la présence
    const juryPresence = await prisma.juryPresence.create({
      data: {
        sessionId: id,
        juryMemberId: juryMemberId,
        wasPresent: wasPresent ?? true,
        absenceReason: !wasPresent ? absenceReason : null
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

    console.log("✅ Jury ajouté à la session:", juryPresence.id)
    return NextResponse.json(juryPresence)

  } catch (error) {
    console.error("❌ Erreur POST jury:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// app/api/sessions/[sessionId]/jury/[presenceId]/route.ts
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; presenceId: string }> }
) {
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; presenceId: string }> }
) {
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