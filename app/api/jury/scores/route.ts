import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Decimal } from "@prisma/client/runtime/library"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "JURY") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    const score = await prisma.faceToFaceScore.upsert({
      where: {
        candidateId_juryMemberId_phase: {
          candidateId: data.candidate_id,
          juryMemberId: data.jury_member_id,
          phase: data.phase,
        },
      },
      update: {
        score: new Decimal(data.score),
      },
      create: {
        candidateId: data.candidate_id,
        juryMemberId: data.jury_member_id,
        phase: data.phase,
        score: new Decimal(data.score),
      },
    })

    return NextResponse.json(score)
  } catch (error) {
    console.error("[v0] Error saving jury score:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
