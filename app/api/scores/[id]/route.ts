//app/api/scores/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Decimal } from "@prisma/client/runtime/library"
import { calculateDecisions } from "@/lib/auto-decisions"
import { Disponibilite, Statut } from "@prisma/client"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    console.log("📦 Données WFM reçues pour calcul automatique:", data)

    // Fonction helper pour convertir les valeurs
    const parseDecimal = (value: string) => {
      if (!value || value === '' || value === 'null') return null
      const num = parseFloat(value)
      return isNaN(num) ? null : new Decimal(num)
    }

    const parseIntValue = (value: string) => {
      if (!value || value === '' || value === 'null') return null
      const num = parseInt(value)
      return isNaN(num) ? null : num
    }

    const parseDate = (value: string) => {
      if (!value || value === '') return null
      return new Date(value)
    }

    // Récupérer le candidat pour son métier et disponibilité
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(id) },
      select: { metier: true, availability: true, nom: true, prenom: true }
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidat non trouvé" }, { status: 404 })
    }

    console.log("🎯 Candidat récupéré:", {
      nom: candidate.nom,
      prenom: candidate.prenom,
      metier: candidate.metier,
      availability: candidate.availability
    })

    // Conversion de presentation_visuelle
    const presentationVisuelle = parseDecimal(data.presentation_visuelle)

    // Conversion de typingSpeed de String à Int
    const typingSpeed = parseIntValue(data.typing_speed)

    // Récupérer les notes des jurys pour vérification de cohérence
    const faceToFaceScores = await prisma.faceToFaceScore.findMany({
      where: { 
        candidateId: parseInt(id),
        phase: 1 
      },
      include: {
        juryMember: {
          select: {
            fullName: true,
            roleType: true
          }
        }
      }
    })

    // Calculer les moyennes des jurys
    let juryAverages = {
      presentation_visuelle: 0,
      verbal_communication: 0,
      voice_quality: 0
    }

    if (faceToFaceScores.length > 0) {
      const presAvg = faceToFaceScores.reduce((sum, s) => sum + (Number(s.presentationVisuelle) || 0), 0) / faceToFaceScores.length
      const verbalAvg = faceToFaceScores.reduce((sum, s) => sum + (Number(s.verbalCommunication) || 0), 0) / faceToFaceScores.length
      const voiceAvg = faceToFaceScores.reduce((sum, s) => sum + (Number(s.voiceQuality) || 0), 0) / faceToFaceScores.length

      juryAverages = {
        presentation_visuelle: Number(presAvg.toFixed(2)),
        verbal_communication: Number(verbalAvg.toFixed(2)),
        voice_quality: Number(voiceAvg.toFixed(2))
      }
    }

    // Vérifier les incohérences
    const inconsistencies = []
    const tolerance = 0.5

    if (data.presentation_visuelle && juryAverages.presentation_visuelle > 0) {
      const diff = Math.abs(parseFloat(data.presentation_visuelle) - juryAverages.presentation_visuelle)
      if (diff > tolerance) {
        inconsistencies.push({
          criterion: 'Présentation Visuelle',
          wfmScore: data.presentation_visuelle,
          juryAverage: juryAverages.presentation_visuelle,
          difference: diff.toFixed(2)
        })
      }
    }

    if (data.verbal_communication && juryAverages.verbal_communication > 0) {
      const diff = Math.abs(parseFloat(data.verbal_communication) - juryAverages.verbal_communication)
      if (diff > tolerance) {
        inconsistencies.push({
          criterion: 'Communication Verbale',
          wfmScore: data.verbal_communication,
          juryAverage: juryAverages.verbal_communication,
          difference: diff.toFixed(2)
        })
      }
    }

    if (data.voice_quality && juryAverages.voice_quality > 0) {
      const diff = Math.abs(parseFloat(data.voice_quality) - juryAverages.voice_quality)
      if (diff > tolerance) {
        inconsistencies.push({
          criterion: 'Qualité Vocale',
          wfmScore: data.voice_quality,
          juryAverage: juryAverages.voice_quality,
          difference: diff.toFixed(2)
        })
      }
    }

    // ⭐⭐⭐ CALCUL DES DÉCISIONS AUTOMATIQUES ⭐⭐⭐
    const juryAveragesForDecision = {
      voiceQuality: parseFloat(data.voice_quality) || 0,
      verbalCommunication: parseFloat(data.verbal_communication) || 0,
      presentationVisuelle: parseFloat(data.presentation_visuelle) || 0
    }

    const simulationAverages = {
      sensNegociation: parseFloat(data.simulation_sens_negociation) || 0,
      capacitePersuasion: parseFloat(data.simulation_capacite_persuasion) || 0,
      sensCombativite: parseFloat(data.simulation_sens_combativite) || 0
    }

    const technicalScores = {
      typingSpeed: parseFloat(data.typing_speed) || 0,
      typingAccuracy: parseFloat(data.typing_accuracy) || 0,
      excelTest: parseFloat(data.excel_test) || 0,
      dictation: parseFloat(data.dictation) || 0,
      psychoRaisonnementLogique: parseFloat(data.psycho_raisonnement_logique) || 0,
      psychoAttentionConcentration: parseFloat(data.psycho_attention_concentration) || 0,
      analysisExercise: parseFloat(data.analysis_exercise) || 0
    }

    console.log("📊 Données pour calcul des décisions:", {
      metier: candidate.metier,
      availability: candidate.availability,
      statut: data.statut || 'ABSENT',
      juryAverages: juryAveragesForDecision,
      simulationAverages: simulationAverages,
      technicalScores: technicalScores
    })

    // ✅ Calculer les décisions avec le BON ordre des 6 paramètres
    const decisions = calculateDecisions(
      candidate.metier,                           // 1. metier
      candidate.availability as Disponibilite,    // 2. availability
      (data.statut as Statut) || 'ABSENT',       // 3. statut
      juryAveragesForDecision,                    // 4. juryAverages
      simulationAverages,                         // 5. simulationAverages
      technicalScores                             // 6. technicalScores
    )

    console.log("✅ Décisions automatiques calculées:", decisions)

    // Journaliser les incohérences si elles existent
    let comments = data.comments || ''
    if (inconsistencies.length > 0) {
      console.log(`⚠️ Incohérences détectées pour le candidat ${id}:`, inconsistencies)
      
      const inconsistencyComment = `\n\n--- INCOHÉRENCES DÉTECTÉES ---\n` +
        inconsistencies.map(inc => 
          `${inc.criterion}: Note WFM ${inc.wfmScore} vs Moyenne Jury ${inc.juryAverage} (diff: ${inc.difference})`
        ).join('\n')
      
      comments += inconsistencyComment
    }

    // Ajouter le résumé des décisions automatiques aux commentaires
    const autoDecisionComment = `\n\n--- DÉCISIONS AUTOMATIQUES ---\n` +
      `Phase 1 FF: ${decisions.phase1FfDecision || 'N/A'}\n` +
      `Phase 1: ${decisions.phase1Decision || 'N/A'}\n` +
      `Test: ${decisions.decisionTest || 'N/A'}\n` +
      `Finale: ${decisions.finalDecision || 'N/A'}`

    comments += autoDecisionComment

    // Préparer les données pour la sauvegarde
    const scoreData: any = {
      presentationVisuelle: presentationVisuelle,
      verbalCommunication: parseDecimal(data.verbal_communication),
      voiceQuality: parseDecimal(data.voice_quality),
      
      // ⭐ UTILISER LES DÉCISIONS AUTOMATIQUES
      phase1FfDecision: decisions.phase1FfDecision,
      phase1Decision: decisions.phase1Decision,
      decisionTest: decisions.decisionTest,
      finalDecision: decisions.finalDecision,
      
      // Sous-critères simulation
      simulationSensNegociation: parseDecimal(data.simulation_sens_negociation),
      simulationCapacitePersuasion: parseDecimal(data.simulation_capacite_persuasion),
      simulationSensCombativite: parseDecimal(data.simulation_sens_combativite),
      salesSimulation: parseDecimal(data.sales_simulation),
      
      // Sous-critères psychotechnique
      psychoRaisonnementLogique: parseDecimal(data.psycho_raisonnement_logique),
      psychoAttentionConcentration: parseDecimal(data.psycho_attention_concentration),
      psychotechnicalTest: parseDecimal(data.psychotechnical_test),
      
      // Tests techniques
      typingSpeed: typingSpeed,
      typingAccuracy: parseDecimal(data.typing_accuracy),
      excelTest: parseDecimal(data.excel_test),
      dictation: parseDecimal(data.dictation),
      analysisExercise: parseDecimal(data.analysis_exercise),
      phase2Date: parseDate(data.phase2_date),
      
      // Statut de présence
      statut: data.statut || 'ABSENT',
      statutCommentaire: data.statutCommentaire || null,
      
      comments: comments,
      evaluatedBy: (session.user as any).id,
      updatedAt: new Date()
    }

    // Sauvegarder les scores avec Prisma
    const score = await prisma.score.upsert({
      where: { candidateId: parseInt(id) },
      update: scoreData,
      create: {
        candidateId: parseInt(id),
        ...scoreData,
        createdAt: new Date(),
      },
    })

    console.log("✅ Score WFM sauvegardé avec décisions automatiques:", score.id)
    
    // Retourner la réponse avec les décisions et incohérences
    return NextResponse.json({ 
      score,
      decisions,
      inconsistencies: inconsistencies.length > 0 ? inconsistencies : null,
      message: "Score enregistré avec calcul automatique des décisions"
    })
    
  } catch (error) {
    console.error("❌ Erreur de sauvegarde des scores WFM:", error)
    return NextResponse.json({ 
      error: "Erreur serveur lors de l'enregistrement",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}

// Méthode PATCH pour mettre à jour seulement le statut
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    console.log("📝 Mise à jour statut pour le candidat:", id, data)

    // Vérifier que les données nécessaires sont présentes
    if (!data.statut) {
      return NextResponse.json({ error: "Statut requis" }, { status: 400 })
    }

    // Si statut = ABSENT, commentaire obligatoire
    if (data.statut === 'ABSENT' && !data.statutCommentaire) {
      return NextResponse.json({ 
        error: "Commentaire obligatoire pour justifier l'absence" 
      }, { status: 400 })
    }

    // Mettre à jour le statut
    const score = await prisma.score.upsert({
      where: { candidateId: parseInt(id) },
      update: {
        statut: data.statut,
        statutCommentaire: data.statutCommentaire || null,
        updatedAt: new Date()
      },
      create: {
        candidateId: parseInt(id),
        statut: data.statut,
        statutCommentaire: data.statutCommentaire || null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    })

    console.log("✅ Statut mis à jour pour le candidat:", id)
    
    return NextResponse.json({ 
      score,
      message: `Statut mis à jour: ${data.statut}`
    })
    
  } catch (error) {
    console.error("❌ Erreur de mise à jour du statut:", error)
    return NextResponse.json({ 
      error: "Erreur serveur lors de la mise à jour du statut",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}

// Méthode GET pour récupérer les scores
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const score = await prisma.score.findUnique({
      where: { candidateId: parseInt(id) },
      include: {
        candidate: {
          include: {
            session: true
          }
        }
      }
    })

    if (!score) {
      return NextResponse.json(null)
    }

    return NextResponse.json(score)
    
  } catch (error) {
    console.error("❌ Erreur de récupération des scores:", error)
    return NextResponse.json({ 
      error: "Erreur serveur lors de la récupération des scores"
    }, { status: 500 })
  }
}