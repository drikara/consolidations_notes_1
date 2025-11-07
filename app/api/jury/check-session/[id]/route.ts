// app/api/jury/check-session/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const candidateId = parseInt(id)
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        session: {
          select: {
            status: true,
            date: true,
            metier: true
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidat non trouvé" }, { status: 404 })
    }

    const canEvaluate = candidate.session && 
      (candidate.session.status === "PLANIFIED" || candidate.session.status === "IN_PROGRESS")

    return NextResponse.json({
      canEvaluate,
      sessionStatus: candidate.session?.status,
      sessionDate: candidate.session?.date,
      candidateName: candidate.fullName
    })

  } catch (error) {
    console.error("Erreur vérification session:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}