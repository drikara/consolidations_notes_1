// app/api/candidates/[id]/consolidation/route.ts
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

    // ✅ Vérifier la disponibilité du candidat
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { availability: true, metier: true }
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidat non trouvé" }, { status: 404 })
    }

    // ✅ RÈGLE MÉTIER : Si disponibilité = NON, finalDecision = NON_RECRUTE automatiquement
    if (candidate.availability === 'NON') {
      await prisma.score.upsert({
        where: { candidateId },
        update: {
          finalDecision: 'NON_RECRUTE'
        },
        create: {
          candidateId,
          finalDecision: 'NON_RECRUTE'
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Candidat non disponible, automatiquement NON_RECRUTE',
        finalDecision: 'NON_RECRUTE'
      })
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

    // ✅ Calculer les moyennes des critères spécifiques pour la Phase 1
    let voiceQualityAvg = null
    let verbalCommunicationAvg = null
    let presentationVisuelleAvg = null

    if (phase1Scores.length > 0) {
      const voiceScores = phase1Scores.filter(s => s.voiceQuality).map(s => s.voiceQuality!.toNumber())
      const verbalScores = phase1Scores.filter(s => s.verbalCommunication).map(s => s.verbalCommunication!.toNumber())
      const presentationScores = phase1Scores.filter(s => s.presentationVisuelle).map(s => s.presentationVisuelle!.toNumber())

      voiceQualityAvg = voiceScores.length > 0 ? voiceScores.reduce((a, b) => a + b, 0) / voiceScores.length : null
      verbalCommunicationAvg = verbalScores.length > 0 ? verbalScores.reduce((a, b) => a + b, 0) / verbalScores.length : null
      presentationVisuelleAvg = presentationScores.length > 0 ? presentationScores.reduce((a, b) => a + b, 0) / presentationScores.length : null
    }

    // ✅ RÈGLE MÉTIER : Validation du Face à Face Phase 1
    let phase1_ff_decision = null
    let phase1Decision = null

    if (voiceQualityAvg !== null && verbalCommunicationAvg !== null) {
      // Pour AGENCES : vérifier aussi la présentation visuelle
      if (candidate.metier === 'AGENCES') {
        if (presentationVisuelleAvg !== null && 
            presentationVisuelleAvg >= 3 && 
            voiceQualityAvg >= 3 && 
            verbalCommunicationAvg >= 3) {
          phase1_ff_decision = 'FAVORABLE'
        } else {
          phase1_ff_decision = 'DEFAVORABLE'
          phase1Decision = 'ELIMINE'
        }
      } else {
        // Pour les autres métiers
        if (voiceQualityAvg >= 3 && verbalCommunicationAvg >= 3) {
          phase1_ff_decision = 'FAVORABLE'
        } else {
          phase1_ff_decision = 'DEFAVORABLE'
          phase1Decision = 'ELIMINE'
        }
      }
    }

    // Mettre à jour le score principal avec les moyennes et décisions
    const updatedScore = await prisma.score.upsert({
      where: { candidateId },
      update: {
        faceToFacePhase1Average: phase1Average ? new Decimal(phase1Average.toFixed(2)) : null,
        faceToFacePhase2Average: phase2Average ? new Decimal(phase2Average.toFixed(2)) : null,
        voiceQuality: voiceQualityAvg ? new Decimal(voiceQualityAvg.toFixed(2)) : null,
        verbalCommunication: verbalCommunicationAvg ? new Decimal(verbalCommunicationAvg.toFixed(2)) : null,
        presentationVisuelle: presentationVisuelleAvg ? new Decimal(presentationVisuelleAvg.toFixed(2)) : null,
        phase1_ff_decision: phase1_ff_decision as any,
        phase1Decision: phase1Decision as any,
      },
      create: {
        candidateId,
        faceToFacePhase1Average: phase1Average ? new Decimal(phase1Average.toFixed(2)) : null,
        faceToFacePhase2Average: phase2Average ? new Decimal(phase2Average.toFixed(2)) : null,
        voiceQuality: voiceQualityAvg ? new Decimal(voiceQualityAvg.toFixed(2)) : null,
        verbalCommunication: verbalCommunicationAvg ? new Decimal(verbalCommunicationAvg.toFixed(2)) : null,
        presentationVisuelle: presentationVisuelleAvg ? new Decimal(presentationVisuelleAvg.toFixed(2)) : null,
        phase1_ff_decision: phase1_ff_decision as any,
        phase1Decision: phase1Decision as any,
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
        average: phase1Average,
        voiceQuality: voiceQualityAvg,
        verbalCommunication: verbalCommunicationAvg,
        presentationVisuelle: presentationVisuelleAvg,
        decision: phase1_ff_decision
      },
      phase2: {
        count: phase2Scores.length,
        average: phase2Average
      },
      phase1Decision,
      updatedScore
    })

  } catch (error) {
    console.error("❌ Erreur lors de la consolidation:", error)
    
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