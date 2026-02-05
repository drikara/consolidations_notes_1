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

    // Récupérer le candidat
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(candidateId) }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidat non trouvé' },
        { status: 404 }
      )
    }

    // Fonctions de parsing
    const parseDecimal = (value: any) => {
      if (value === null || value === undefined || value === '') return null
      const num = parseFloat(value)
      return isNaN(num) ? null : new Decimal(num)
    }

    const parseIntValue = (value: any) => {
      if (value === null || value === undefined || value === '') return null
      const num = parseInt(value)
      return isNaN(num) ? null : num
    }

    // ✅ CORRECTION : Accepter les deux formats (snake_case et camelCase)
    const voiceQuality = scoreData.voiceQuality !== undefined ? scoreData.voiceQuality : scoreData.voice_quality
    const verbalCommunication = scoreData.verbalCommunication !== undefined ? scoreData.verbalCommunication : scoreData.verbal_communication
    const presentationVisuelle = scoreData.presentationVisuelle !== undefined ? scoreData.presentationVisuelle : scoreData.presentation_visuelle
    
    const simulationSensNegociation = scoreData.simulationSensNegociation !== undefined ? scoreData.simulationSensNegociation : scoreData.simulation_sens_negociation
    const simulationCapacitePersuasion = scoreData.simulationCapacitePersuasion !== undefined ? scoreData.simulationCapacitePersuasion : scoreData.simulation_capacite_persuasion
    const simulationSensCombativite = scoreData.simulationSensCombativite !== undefined ? scoreData.simulationSensCombativite : scoreData.simulation_sens_combativite
    
    const typingSpeed = scoreData.typingSpeed !== undefined ? scoreData.typingSpeed : scoreData.typing_speed
    const typingAccuracy = scoreData.typingAccuracy !== undefined ? scoreData.typingAccuracy : scoreData.typing_accuracy
    const excelTest = scoreData.excelTest !== undefined ? scoreData.excelTest : scoreData.excel_test
    const dictation = scoreData.dictation !== undefined ? scoreData.dictation : scoreData.dictation
    const psychoRaisonnementLogique = scoreData.psychoRaisonnementLogique !== undefined ? scoreData.psychoRaisonnementLogique : scoreData.psycho_raisonnement_logique
    const psychoAttentionConcentration = scoreData.psychoAttentionConcentration !== undefined ? scoreData.psychoAttentionConcentration : scoreData.psycho_attention_concentration
    const analysisExercise = scoreData.analysisExercise !== undefined ? scoreData.analysisExercise : scoreData.analysis_exercise

    // Construire les objets pour calculateDecisions
    const juryAverages = {
      voiceQuality: parseFloat(voiceQuality) || 0,
      verbalCommunication: parseFloat(verbalCommunication) || 0,
      presentationVisuelle: parseFloat(presentationVisuelle) || 0
    }

    const simulationAverages = {
      sensNegociation: parseFloat(simulationSensNegociation) || 0,
      capacitePersuasion: parseFloat(simulationCapacitePersuasion) || 0,
      sensCombativite: parseFloat(simulationSensCombativite) || 0
    }

    const technicalScores = {
      typingSpeed: parseFloat(typingSpeed) || 0,
      typingAccuracy: parseFloat(typingAccuracy) || 0,
      excelTest: parseFloat(excelTest) || 0,
      dictation: parseFloat(dictation) || 0,
      psychoRaisonnementLogique: parseFloat(psychoRaisonnementLogique) || 0,
      psychoAttentionConcentration: parseFloat(psychoAttentionConcentration) || 0,
      analysisExercise: parseFloat(analysisExercise) || 0
    }

    console.log('📊 Données pour calculateDecisions:', {
      metier: candidate.metier,
      availability: candidate.availability,
      statut: scoreData.statut || 'ABSENT',
      juryAverages,
      simulationAverages,
      technicalScores
    })

    // ✅ Calculer les décisions
    const decisions = calculateDecisions(
      candidate.metier,
      candidate.availability as Disponibilite,
      (scoreData.statut as Statut) || 'ABSENT',
      juryAverages,
      simulationAverages,
      technicalScores
    )

    console.log('✅ Décisions calculées:', decisions)

    // Créer ou mettre à jour le score
    const score = await prisma.score.upsert({
      where: { candidateId: parseInt(candidateId) },
      update: {
        // Phase 1
        voiceQuality: parseDecimal(voiceQuality),
        verbalCommunication: parseDecimal(verbalCommunication),
        presentationVisuelle: parseDecimal(presentationVisuelle),
        
        // Simulation
        simulationSensNegociation: parseDecimal(simulationSensNegociation),
        simulationCapacitePersuasion: parseDecimal(simulationCapacitePersuasion),
        simulationSensCombativite: parseDecimal(simulationSensCombativite),
        salesSimulation: parseDecimal(scoreData.sales_simulation || scoreData.salesSimulation),
        
        // Tests techniques
        typingSpeed: parseIntValue(typingSpeed),
        typingAccuracy: parseDecimal(typingAccuracy),
        excelTest: parseDecimal(excelTest),
        dictation: parseDecimal(dictation),
        psychoRaisonnementLogique: parseDecimal(psychoRaisonnementLogique),
        psychoAttentionConcentration: parseDecimal(psychoAttentionConcentration),
        analysisExercise: parseDecimal(analysisExercise),
        
        // Décisions
        phase1FfDecision: decisions.phase1FfDecision,
        phase1Decision: decisions.phase1Decision,
        decisionTest: decisions.decisionTest,
        finalDecision: decisions.finalDecision,
        
        // Statut et commentaires
        statut: scoreData.statut || null,
        statutCommentaire: scoreData.statutCommentaire || scoreData.statut_commentaire || null,
        comments: scoreData.comments || null,
        
        evaluatedBy: (session.user as any).id
      },
      create: {
        candidateId: parseInt(candidateId),
        // Phase 1
        voiceQuality: parseDecimal(voiceQuality),
        verbalCommunication: parseDecimal(verbalCommunication),
        presentationVisuelle: parseDecimal(presentationVisuelle),
        
        // Simulation
        simulationSensNegociation: parseDecimal(simulationSensNegociation),
        simulationCapacitePersuasion: parseDecimal(simulationCapacitePersuasion),
        simulationSensCombativite: parseDecimal(simulationSensCombativite),
        salesSimulation: parseDecimal(scoreData.sales_simulation || scoreData.salesSimulation),
        
        // Tests techniques
        typingSpeed: parseIntValue(typingSpeed),
        typingAccuracy: parseDecimal(typingAccuracy),
        excelTest: parseDecimal(excelTest),
        dictation: parseDecimal(dictation),
        psychoRaisonnementLogique: parseDecimal(psychoRaisonnementLogique),
        psychoAttentionConcentration: parseDecimal(psychoAttentionConcentration),
        analysisExercise: parseDecimal(analysisExercise),
        
        // Décisions
        phase1FfDecision: decisions.phase1FfDecision,
        phase1Decision: decisions.phase1Decision,
        decisionTest: decisions.decisionTest,
        finalDecision: decisions.finalDecision,
        
        // Statut et commentaires
        statut: scoreData.statut || 'ABSENT',
        statutCommentaire: scoreData.statutCommentaire || scoreData.statut_commentaire || null,
        comments: scoreData.comments || null,
        
        evaluatedBy: (session.user as any).id
      },
      include: {
        candidate: true
      }
    })

    // Audit
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