
//  app/api/scores/route.ts 

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Decimal } from '@prisma/client/runtime/library'
import { calculateDecisions } from '@/lib/auto-decisions'
import { Disponibilite, Statut } from '@prisma/client'
import { AuditService, getRequestInfo } from '@/lib/audit-service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')

    if (candidateId) {
      const score = await prisma.score.findUnique({
        where: { candidateId: parseInt(candidateId) },
        include: {
          candidate: {
            include: {
              session: true
            }
          }
        }
      })

      return NextResponse.json(score)
    }

    const scores = await prisma.score.findMany({
      include: {
        candidate: {
          include: {
            session: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(scores)
  } catch (error) {
    console.error('Error fetching scores:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const requestInfo = getRequestInfo(request)
    const data = await request.json()
    const { candidateId, ...scoreData } = data

    if (!candidateId) {
      return NextResponse.json(
        { error: 'ID candidat requis' },
        { status: 400 }
      )
    }

    // Récupérer le candidat pour obtenir son métier et disponibilité
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(candidateId) }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidat non trouvé' },
        { status: 404 }
      )
    }

    // Fonction helper pour convertir en Decimal
    const parseDecimal = (value: any) => {
      if (!value || value === '') return null
      const num = parseFloat(value)
      return isNaN(num) ? null : new Decimal(num)
    }

    const parseIntValue = (value: any) => {
      if (!value || value === '') return null
      const num = parseInt(value)
      return isNaN(num) ? null : num
    }

    // ✅ Préparer les objets de scores dans le bon ordre
    const juryAverages = {
      voiceQuality: parseFloat(scoreData.voice_quality) || 0,
      verbalCommunication: parseFloat(scoreData.verbal_communication) || 0,
      presentationVisuelle: parseFloat(scoreData.presentation_visuelle) || 0
    }

    const simulationAverages = {
      sensNegociation: parseFloat(scoreData.simulation_sens_negociation) || 0,
      capacitePersuasion: parseFloat(scoreData.simulation_capacite_persuasion) || 0,
      sensCombativite: parseFloat(scoreData.simulation_sens_combativite) || 0
    }

    const technicalScores = {
      typingSpeed: parseFloat(scoreData.typing_speed) || 0,
      typingAccuracy: parseFloat(scoreData.typing_accuracy) || 0,
      excelTest: parseFloat(scoreData.excel_test) || 0,
      dictation: parseFloat(scoreData.dictation) || 0,
      psychoRaisonnementLogique: parseFloat(scoreData.psycho_raisonnement_logique) || 0,
      psychoAttentionConcentration: parseFloat(scoreData.psycho_attention_concentration) || 0,
      analysisExercise: parseFloat(scoreData.analysis_exercise) || 0
    }

    // ✅ Calculer les décisions avec le BON ordre des paramètres
    const decisions = calculateDecisions(
      candidate.metier,                           // 1. metier
      candidate.availability as Disponibilite,    // 2. availability
      (scoreData.statut as Statut) || 'ABSENT',  // 3. statut
      juryAverages,                               // 4. juryAverages
      simulationAverages,                         // 5. simulationAverages
      technicalScores                             // 6. technicalScores
    )

    // Créer ou mettre à jour le score
    const score = await prisma.score.upsert({
      where: { candidateId: parseInt(candidateId) },
      update: {
        voiceQuality: parseDecimal(scoreData.voice_quality),
        verbalCommunication: parseDecimal(scoreData.verbal_communication),
        presentationVisuelle: parseDecimal(scoreData.presentation_visuelle),
        phase1FfDecision: decisions.phase1FfDecision,
        phase1Decision: decisions.phase1Decision,
        
        // Sous-critères simulation
        simulationSensNegociation: parseDecimal(scoreData.simulation_sens_negociation),
        simulationCapacitePersuasion: parseDecimal(scoreData.simulation_capacite_persuasion),
        simulationSensCombativite: parseDecimal(scoreData.simulation_sens_combativite),
        salesSimulation: parseDecimal(scoreData.sales_simulation),
        
        // Sous-critères psychotechnique
        psychoRaisonnementLogique: parseDecimal(scoreData.psycho_raisonnement_logique),
        psychoAttentionConcentration: parseDecimal(scoreData.psycho_attention_concentration),
        psychotechnicalTest: parseDecimal(scoreData.psychotechnical_test),
        
        typingSpeed: parseIntValue(scoreData.typing_speed),
        typingAccuracy: parseDecimal(scoreData.typing_accuracy),
        excelTest: parseDecimal(scoreData.excel_test),
        dictation: parseDecimal(scoreData.dictation),
        analysisExercise: parseDecimal(scoreData.analysis_exercise),
        
        decisionTest: decisions.decisionTest,
        finalDecision: decisions.finalDecision,
        
        statut: scoreData.statut || null,
        statutCommentaire: scoreData.statut_commentaire || null,
        
        comments: scoreData.comments || null,
        evaluatedBy: (session.user as any).id
      },
      create: {
        candidateId: parseInt(candidateId),
        voiceQuality: parseDecimal(scoreData.voice_quality),
        verbalCommunication: parseDecimal(scoreData.verbal_communication),
        presentationVisuelle: parseDecimal(scoreData.presentation_visuelle),
        phase1FfDecision: decisions.phase1FfDecision,
        phase1Decision: decisions.phase1Decision,
        
        simulationSensNegociation: parseDecimal(scoreData.simulation_sens_negociation),
        simulationCapacitePersuasion: parseDecimal(scoreData.simulation_capacite_persuasion),
        simulationSensCombativite: parseDecimal(scoreData.simulation_sens_combativite),
        salesSimulation: parseDecimal(scoreData.sales_simulation),
        
        psychoRaisonnementLogique: parseDecimal(scoreData.psycho_raisonnement_logique),
        psychoAttentionConcentration: parseDecimal(scoreData.psycho_attention_concentration),
        psychotechnicalTest: parseDecimal(scoreData.psychotechnical_test),
        
        typingSpeed: parseIntValue(scoreData.typing_speed),
        typingAccuracy: parseDecimal(scoreData.typing_accuracy),
        excelTest: parseDecimal(scoreData.excel_test),
        dictation: parseDecimal(scoreData.dictation),
        analysisExercise: parseDecimal(scoreData.analysis_exercise),
        
        decisionTest: decisions.decisionTest,
        finalDecision: decisions.finalDecision,
        
        statut: scoreData.statut || 'ABSENT',
        statutCommentaire: scoreData.statut_commentaire || null,
        
        comments: scoreData.comments || null,
        evaluatedBy: (session.user as any).id
      },
      include: {
        candidate: true
      }
    })

    // 🆕 ENREGISTRER L'AUDIT
    await AuditService.log({
      userId: session.user.id,
      userName: session.user.name || 'Utilisateur WFM',
      userEmail: session.user.email,
      action: 'UPDATE',
      entity: 'SCORE',
      entityId: score.id.toString(),
      description: `Mise à jour des scores pour ${candidate.nom} ${candidate.prenom}`,
      metadata: {
        candidateId: candidate.id,
        candidateName: `${candidate.nom} ${candidate.prenom}`,
        decisions: decisions,
        hasComments: !!scoreData.comments
      },
      ...requestInfo
    })

    return NextResponse.json(
      { score, decisions, message: 'Score enregistré avec succès' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating/updating score:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement du score' },
      { status: 500 }
    )
  }
}