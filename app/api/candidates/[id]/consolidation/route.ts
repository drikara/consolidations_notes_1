import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Decimal } from "@prisma/client/runtime/library"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const candidateId = parseInt(id)
    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "ID candidat invalide" }, { status: 400 })
    }

    // Récupérer tous les scores face à face pour ce candidat
    const faceToFaceScores = await prisma.faceToFaceScore.findMany({
      where: { candidateId },
      include: {
        juryMember: {
          include: { user: true }
        }
      }
    })

    // Calculer les moyennes
    const phase1Scores = faceToFaceScores.filter(score => score.phase === 1)
    const phase2Scores = faceToFaceScores.filter(score => score.phase === 2)

    const phase1Average = phase1Scores.length > 0 
      ? phase1Scores.reduce((sum, score) => sum + score.score.toNumber(), 0) / phase1Scores.length
      : null

    const phase2Average = phase2Scores.length > 0
      ? phase2Scores.reduce((sum, score) => sum + score.score.toNumber(), 0) / phase2Scores.length
      : null

    // Mettre à jour le score principal avec les moyennes
    const updatedScore = await prisma.score.update({
      where: { candidateId },
      data: {
        faceToFacePhase1Average: phase1Average ? new Decimal(phase1Average.toFixed(2)) : null,
        faceToFacePhase2Average: phase2Average ? new Decimal(phase2Average.toFixed(2)) : null,
      },
      include: {
        candidate: true
      }
    })

    console.log("✅ Consolidation terminée pour le candidat:", candidateId)
    
    return NextResponse.json({
      success: true,
      candidateId,
      phase1: {
        count: phase1Scores.length,
        average: phase1Average
      },
      phase2: {
        count: phase2Scores.length,
        average: phase2Average
      },
      updatedScore
    })

  } catch (error) {
    console.error("❌ Erreur lors de la consolidation:", error)
    
    // Si le score n'existe pas encore
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: "Aucun score trouvé pour ce candidat" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: "Erreur lors de la consolidation" },
      { status: 500 }
    )
  }
}

// Méthode GET pour récupérer les données de consolidation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const candidateId = parseInt(id)
    if (isNaN(candidateId)) {
      return NextResponse.json({ error: "ID candidat invalide" }, { status: 400 })
    }

    // Récupérer les données existantes
    const faceToFaceScores = await prisma.faceToFaceScore.findMany({
      where: { candidateId },
      include: {
        juryMember: {
          include: { user: true }
        }
      }
    })

    const mainScore = await prisma.score.findUnique({
      where: { candidateId },
      include: {
        candidate: true
      }
    })

    return NextResponse.json({
      candidateId,
      faceToFaceScores,
      mainScore,
      consolidation: {
        phase1Count: faceToFaceScores.filter(s => s.phase === 1).length,
        phase2Count: faceToFaceScores.filter(s => s.phase === 2).length,
      }
    })

  } catch (error) {
    console.error("❌ Erreur lors de la récupération:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}