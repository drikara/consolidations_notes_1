//api/scores/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Decimal } from "@prisma/client/runtime/library"

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
    console.log("📦 Données WFM reçues:", data)

    // Fonction helper pour convertir les valeurs
    const parseDecimal = (value: string) => {
      if (!value || value === '') return null
      const num = parseFloat(value)
      return isNaN(num) ? null : new Decimal(num)
    }

    const parseIntValue = (value: string) => {
      if (!value || value === '') return null
      const num = parseInt(value)
      return isNaN(num) ? null : num
    }

    const parseDate = (value: string) => {
      if (!value || value === '') return null
      return new Date(value)
    }

    // CORRECTION : Utiliser presentation_visuelle au lieu de visual_presentation
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

    // Sauvegarder les scores avec Prisma
    const score = await prisma.score.upsert({
      where: { candidateId: parseInt(id) },
      update: {
        // CORRECTION : Utiliser presentationVisuelle avec les bonnes données
        presentationVisuelle: presentationVisuelle,
        verbalCommunication: parseDecimal(data.verbal_communication),
        voiceQuality: parseDecimal(data.voice_quality),
        phase1FfDecision: data.phase1_ff_decision || null,
        
        // Sous-critères simulation
        simulationSensNegociation: parseDecimal(data.simulation_sens_negociation),
        simulationCapacitePersuasion: parseDecimal(data.simulation_capacite_persuasion),
        simulationSensCombativite: parseDecimal(data.simulation_sens_combativite),
        
        // Sous-critères psychotechnique
        psychoRaisonnementLogique: parseDecimal(data.psycho_raisonnement_logique),
        psychoAttentionConcentration: parseDecimal(data.psycho_attention_concentration),
        psychotechnicalTest: parseDecimal(data.psychotechnical_test),
        
        phase1Decision: data.phase1_decision || null,
        typingSpeed: typingSpeed,
        typingAccuracy: parseDecimal(data.typing_accuracy),
        excelTest: parseDecimal(data.excel_test),
        dictation: parseDecimal(data.dictation),
        salesSimulation: parseDecimal(data.sales_simulation),
        analysisExercise: parseDecimal(data.analysis_exercise),
        phase2Date: parseDate(data.phase2_date),
        decisionTest: data.decision_test || null, // Remplacer phase2FfDecision par decisionTest
        finalDecision: data.final_decision || null,
        statut: data.statut || null, // Ajouter statut
        statutCommentaire: data.statutCommentaire || null, // Ajouter commentaire statut
        comments: comments,
      },
      create: {
        candidateId: parseInt(id),
        presentationVisuelle: presentationVisuelle,
        verbalCommunication: parseDecimal(data.verbal_communication),
        voiceQuality: parseDecimal(data.voice_quality),
        phase1FfDecision: data.phase1_ff_decision || null,
        
        // Sous-critères simulation
        simulationSensNegociation: parseDecimal(data.simulation_sens_negociation),
        simulationCapacitePersuasion: parseDecimal(data.simulation_capacite_persuasion),
        simulationSensCombativite: parseDecimal(data.simulation_sens_combativite),
        
        // Sous-critères psychotechnique
        psychoRaisonnementLogique: parseDecimal(data.psycho_raisonnement_logique),
        psychoAttentionConcentration: parseDecimal(data.psycho_attention_concentration),
        psychotechnicalTest: parseDecimal(data.psychotechnical_test),
        
        phase1Decision: data.phase1_decision || null,
        typingSpeed: typingSpeed,
        typingAccuracy: parseDecimal(data.typing_accuracy),
        excelTest: parseDecimal(data.excel_test),
        dictation: parseDecimal(data.dictation),
        salesSimulation: parseDecimal(data.sales_simulation),
        analysisExercise: parseDecimal(data.analysis_exercise),
        phase2Date: parseDate(data.phase2_date),
        decisionTest: data.decision_test || null, // Remplacer phase2FfDecision par decisionTest
        finalDecision: data.final_decision || null,
        statut: data.statut || null, // Ajouter statut
        statutCommentaire: data.statutCommentaire || null, // Ajouter commentaire statut
        comments: comments,
      },
    })

    console.log("✅ Score WFM sauvegardé:", score.id)
    
    // Retourner la réponse avec les incohérences détectées
    return NextResponse.json({ 
      score,
      inconsistencies: inconsistencies.length > 0 ? inconsistencies : null 
    })
    
  } catch (error) {
    console.error("❌ Erreur de sauvegarde des scores WFM:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}