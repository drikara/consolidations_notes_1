import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { consolidateCandidate } from "@/lib/consolidation"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        scores: true,
        faceToFaceScores: {
          select: {
            score: true,
          },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidat non trouvé" }, { status: 404 })
    }

    // Consolidate
    const result = consolidateCandidate(candidate.metier, {
      faceToFaceScores: candidate.faceToFaceScores,
      typingSpeed: candidate.scores?.typingSpeed || undefined,
      typingAccuracy: candidate.scores?.typingAccuracy ? Number(candidate.scores.typingAccuracy) : undefined,
      excel: candidate.scores?.excelTest ? Number(candidate.scores.excelTest) : undefined,
      dictation: candidate.scores?.dictation ? Number(candidate.scores.dictation) : undefined,
      salesSimulation: candidate.scores?.salesSimulation ? Number(candidate.scores.salesSimulation) : undefined,
      psychotechnical: candidate.scores?.psychotechnicalTest ? Number(candidate.scores.psychotechnicalTest) : undefined,
      analysisExercise: candidate.scores?.analysisExercise ? Number(candidate.scores.analysisExercise) : undefined,
    })

    return NextResponse.json({
      candidate,
      score: candidate.scores,
      consolidation: result,
    })
  } catch (error) {
    console.error("[v0] Error consolidating candidate:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        scores: true,
        faceToFaceScores: {
          select: {
            score: true,
          },
        },
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidat non trouvé" }, { status: 404 })
    }

    // Consolidate
    const result = consolidateCandidate(candidate.metier, {
      faceToFaceScores: candidate.faceToFaceScores,
      typingSpeed: candidate.scores?.typingSpeed || undefined,
      typingAccuracy: candidate.scores?.typingAccuracy ? Number(candidate.scores.typingAccuracy) : undefined,
      excel: candidate.scores?.excelTest ? Number(candidate.scores.excelTest) : undefined,
      dictation: candidate.scores?.dictation ? Number(candidate.scores.dictation) : undefined,
      salesSimulation: candidate.scores?.salesSimulation ? Number(candidate.scores.salesSimulation) : undefined,
      psychotechnical: candidate.scores?.psychotechnicalTest ? Number(candidate.scores.psychotechnicalTest) : undefined,
      analysisExercise: candidate.scores?.analysisExercise ? Number(candidate.scores.analysisExercise) : undefined,
    })

    // Update final decision in database
    const finalDecision = result.isAdmitted ? "RECRUTÉ" : "NON RECRUTÉ"

    await prisma.score.upsert({
      where: { candidateId: Number.parseInt(id) },
      update: {
        finalDecision,
      },
      create: {
        candidateId: Number.parseInt(id),
        finalDecision,
      },
    })

    return NextResponse.json({
      success: true,
      finalDecision,
      consolidation: result,
    })
  } catch (error) {
    console.error("[v0] Error applying consolidation:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
