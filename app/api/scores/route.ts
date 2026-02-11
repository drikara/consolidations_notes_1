import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { AuditService, getRequestInfo } from "@/lib/audit-service"
import { Prisma } from "@prisma/client"
import { getMetierConfig } from "@/lib/metier-config"

export async function POST(request: NextRequest) {
  try {
    const requestInfo = getRequestInfo(request)
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== 'WFM') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    
    console.log('📝 POST /api/scores - Données reçues:', {
      candidateId: body.candidateId,
      statut: body.statut,
      voice_quality: body.voice_quality,
      verbal_communication: body.verbal_communication,
      appetence_digitale: body.appetence_digitale,
      typing_speed: body.typing_speed,
      typing_accuracy: body.typing_accuracy,
      dictation: body.dictation,
    })

    // Récupérer le score existant pour garder l'évaluateur WFM_JURY
    const existingScore = await prisma.score.findUnique({
      where: { candidateId: body.candidateId },
      select: { evaluatedBy: true }
    })

    console.log('📖 Score existant - Évalué par:', existingScore?.evaluatedBy || 'Aucun évaluateur enregistré')

    // Validation du candidat
    const candidate = await prisma.candidate.findUnique({
      where: { id: body.candidateId },
      include: {
        faceToFaceScores: true,
        session: true
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidat non trouvé' }, { status: 404 })
    }

    console.log('✅ Candidat trouvé:', candidate.nom, candidate.prenom, '- Métier:', candidate.metier)

    const metier = candidate.metier
    const isAgences = metier === 'AGENCES'
    const isTelelvente = metier === 'TELEVENTE'
    const isReseauxSociaux = metier === 'RESEAUX_SOCIAUX'
    const needsSimulation = isAgences || isTelelvente

    // ✅ RÉCUPÉRER LA CONFIG DU MÉTIER
    const config = getMetierConfig(metier as any)
    console.log('⚙️ Configuration métier chargée:', metier, config.criteria)

    // ✅ CORRECTION CRITIQUE: Si le candidat est absent, TOUT METTRE À NULL
    if (body.statut === 'ABSENT') {
      console.log('📊 Candidat absent -> toutes les notes null, toutes les décisions null')
      
      const absentData: any = {
        candidateId: body.candidateId,
        statut: 'ABSENT',
        statutCommentaire: body.statut_commentaire || 'Candidat absent',
        comments: body.comments || null,
        
        // ✅ TOUTES LES NOTES À NULL
        voiceQuality: null,
        verbalCommunication: null,
        presentationVisuelle: null,
        appetenceDigitale: null,
        simulationSensNegociation: null,
        simulationCapacitePersuasion: null,
        simulationSensCombativite: null,
        typingSpeed: null,
        typingAccuracy: null,
        excelTest: null,
        dictation: null,
        psychoRaisonnementLogique: null,
        psychoAttentionConcentration: null,
        analysisExercise: null,
        
        // ✅ TOUTES LES DÉCISIONS À NULL
        phase1FfDecision: null,
        decisionTest: null,
        finalDecision: null, // ⭐ NULL comme demandé
        
        evaluatedBy: existingScore?.evaluatedBy || null,
      }

      console.log('📤 Envoi données ABSENT:', absentData)

      const score = await prisma.score.upsert({
        where: { candidateId: body.candidateId },
        update: {
          ...absentData,
          updatedAt: new Date()
        },
        create: absentData,
        include: {
          candidate: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              metier: true
            }
          }
        }
      })

      console.log('✅ Score absent enregistré')
      console.log('  - Statut:', score.statut)
      console.log('  - Phase 1:', score.phase1FfDecision)
      console.log('  - Tests techniques:', score.decisionTest)
      console.log('  - Décision finale:', score.finalDecision)

      await AuditService.log({
        userId: session.user.id,
        userName: session.user.name || 'Utilisateur WFM',
        userEmail: session.user.email,
        action: 'UPDATE',
        entity: 'SCORE',
        entityId: score.candidate.id.toString(),
        description: `Candidat ${score.candidate.nom} ${score.candidate.prenom} marqué absent - toutes les notes N/A`,
        metadata: {
          candidateId: score.candidate.id,
          candidateName: `${score.candidate.nom} ${score.candidate.prenom}`,
          metier: score.candidate.metier,
          evaluatedBy: score.evaluatedBy,
          statut: score.statut,
          phase1FfDecision: score.phase1FfDecision,
          decisionTest: score.decisionTest,
          finalDecision: score.finalDecision,
        },
        ...requestInfo
      })

      return NextResponse.json({
        success: true,
        score: {
          ...score,
          voiceQuality: score.voiceQuality?.toString(),
          verbalCommunication: score.verbalCommunication?.toString(),
          presentationVisuelle: score.presentationVisuelle?.toString(),
          appetenceDigitale: score.appetenceDigitale?.toString(),
        },
        evaluatedBy: score.evaluatedBy,
        decisions: {
          phase1FfDecision: score.phase1FfDecision,
          decisionTest: score.decisionTest,
          finalDecision: score.finalDecision
        }
      })
    }

    // ── CANDIDAT PRÉSENT : Logique normale ──
    let phase1FfDecision: 'FAVORABLE' | 'DEFAVORABLE' | null = null
    let decisionTest: 'FAVORABLE' | 'DEFAVORABLE' | null = null
    let finalDecision: 'RECRUTE' | 'NON_RECRUTE' | null = null

    if (candidate.availability === 'NON') {
      // Candidat non disponible = NON_RECRUTE
      phase1FfDecision = 'DEFAVORABLE'
      decisionTest = 'DEFAVORABLE'
      finalDecision = 'NON_RECRUTE'
      console.log('📊 Décision Finale: NON_RECRUTE (candidat non disponible)')
    } else {
      // Calcul de la phase 1
      const voiceQuality = parseFloat(body.voice_quality) || 0
      const verbalCommunication = parseFloat(body.verbal_communication) || 0
      const presentationVisuelle = body.presentation_visuelle ? parseFloat(body.presentation_visuelle) : null
      const appetenceDigitale = body.appetence_digitale ? parseFloat(body.appetence_digitale) : null

      if (isAgences) {
        phase1FfDecision = (
          voiceQuality >= 3 &&
          verbalCommunication >= 3 &&
          (presentationVisuelle || 0) >= 3
        ) ? 'FAVORABLE' : 'DEFAVORABLE'
      } else if (isReseauxSociaux) {
        phase1FfDecision = (
          voiceQuality >= 3 &&
          verbalCommunication >= 3 &&
          (appetenceDigitale || 0) >= 3
        ) ? 'FAVORABLE' : 'DEFAVORABLE'
        
        console.log('📊 Validation Phase 1 RESEAUX_SOCIAUX:', {
          voiceQuality,
          verbalCommunication,
          appetenceDigitale,
          decision: phase1FfDecision
        })
      } else {
        phase1FfDecision = (
          voiceQuality >= 3 &&
          verbalCommunication >= 3
        ) ? 'FAVORABLE' : 'DEFAVORABLE'
      }

      console.log('📊 Décision Phase 1 (Face-à-Face):', phase1FfDecision)

      // ✅ CALCUL DE LA DÉCISION DES TESTS TECHNIQUES
      if (phase1FfDecision === 'FAVORABLE') {
        const failures: string[] = []

        // ✅ Tests de typing
        if (config.criteria.typing?.required) {
          const hasTypingSpeed = body.typing_speed !== null && body.typing_speed !== undefined && body.typing_speed !== ''
          const hasTypingAccuracy = body.typing_accuracy !== null && body.typing_accuracy !== undefined && body.typing_accuracy !== ''
          
          if (hasTypingSpeed && hasTypingAccuracy) {
            const typingSpeed = parseInt(body.typing_speed)
            const typingAccuracy = parseFloat(body.typing_accuracy)
            
            const minSpeed = config.criteria.typing.minSpeed
            const minAccuracy = config.criteria.typing.minAccuracy

            if (typingSpeed < minSpeed || typingAccuracy < minAccuracy) {
              failures.push('typing')
              console.log(`❌ Test typing échoué - Speed: ${typingSpeed}/${minSpeed}, Accuracy: ${typingAccuracy}%/${minAccuracy}%`)
            } else {
              console.log(`✅ Test typing réussi - Speed: ${typingSpeed}/${minSpeed}, Accuracy: ${typingAccuracy}%/${minAccuracy}%`)
            }
          } else {
            failures.push('typing manquant')
            console.log('❌ Tests typing non remplis')
          }
        }

        // ✅ Test Excel
        if (config.criteria.excel?.required) {
          const hasExcel = body.excel_test !== null && body.excel_test !== undefined && body.excel_test !== ''
          
          if (hasExcel) {
            const excelTest = parseFloat(body.excel_test)
            const minScore = config.criteria.excel.minScore
            
            if (excelTest < minScore) {
              failures.push('excel')
              console.log(`❌ Test Excel échoué - Score: ${excelTest}/${minScore}`)
            } else {
              console.log(`✅ Test Excel réussi - Score: ${excelTest}/${minScore}`)
            }
          } else {
            failures.push('excel manquant')
            console.log('❌ Test Excel non rempli')
          }
        }

        // ✅ Dictée
        if (config.criteria.dictation?.required) {
          const hasDictation = body.dictation !== null && body.dictation !== undefined && body.dictation !== ''
          
          if (hasDictation) {
            const dictation = parseFloat(body.dictation)
            const minScore = config.criteria.dictation.minScore
            
            if (dictation < minScore) {
              failures.push('dictation')
              console.log(`❌ Dictée échouée - Score: ${dictation}/${minScore}`)
            } else {
              console.log(`✅ Dictée réussie - Score: ${dictation}/${minScore}`)
            }
          } else {
            failures.push('dictation manquante')
            console.log('❌ Dictée non remplie')
          }
        }

        // ✅ Tests psychotechniques
        if (config.criteria.psycho?.required) {
          const hasPsychoRaisonnement = body.psycho_raisonnement_logique !== null && body.psycho_raisonnement_logique !== undefined && body.psycho_raisonnement_logique !== ''
          const hasPsychoAttention = body.psycho_attention_concentration !== null && body.psycho_attention_concentration !== undefined && body.psycho_attention_concentration !== ''
          
          if (hasPsychoRaisonnement && hasPsychoAttention) {
            const raisonnement = parseFloat(body.psycho_raisonnement_logique)
            const attention = parseFloat(body.psycho_attention_concentration)
            const minRaisonnement = config.criteria.psycho.minRaisonnementLogique
            const minAttention = config.criteria.psycho.minAttentionConcentration
            
            if (raisonnement < minRaisonnement || attention < minAttention) {
              failures.push('psycho')
              console.log(`❌ Tests psycho échoués - Raisonnement: ${raisonnement}/${minRaisonnement}, Attention: ${attention}/${minAttention}`)
            } else {
              console.log(`✅ Tests psycho réussis - Raisonnement: ${raisonnement}/${minRaisonnement}, Attention: ${attention}/${minAttention}`)
            }
          } else {
            failures.push('psycho manquant')
            console.log('❌ Tests psycho non remplis')
          }
        }

        // ✅ Capacité d'analyse
        if (config.criteria.analysis?.required) {
          const hasAnalysis = body.analysis_exercise !== null && body.analysis_exercise !== undefined && body.analysis_exercise !== ''
          
          if (hasAnalysis) {
            const analysis = parseFloat(body.analysis_exercise)
            const minScore = config.criteria.analysis.minScore
            
            if (analysis < minScore) {
              failures.push('analysis')
              console.log(`❌ Analyse échouée - Score: ${analysis}/${minScore}`)
            } else {
              console.log(`✅ Analyse réussie - Score: ${analysis}/${minScore}`)
            }
          } else {
            failures.push('analysis manquante')
            console.log('❌ Analyse non remplie')
          }
        }

        decisionTest = failures.length === 0 ? 'FAVORABLE' : 'DEFAVORABLE'
        console.log('📊 Décision Tests Techniques:', decisionTest, '- Échecs:', failures)
      } else {
        decisionTest = 'DEFAVORABLE'
        console.log('📊 Décision Tests Techniques: DEFAVORABLE (phase 1 échouée)')
      }

      // ✅ CALCUL DE LA DÉCISION FINALE
      if (phase1FfDecision === 'DEFAVORABLE') {
        finalDecision = 'NON_RECRUTE'
        console.log('📊 Décision Finale: NON_RECRUTE (phase 1 échouée)')
      } else if (needsSimulation) {
        const sensNegociation = parseFloat(body.simulation_sens_negociation) || 0
        const capacitePersuasion = parseFloat(body.simulation_capacite_persuasion) || 0
        const sensCombativite = parseFloat(body.simulation_sens_combativite) || 0

        const phase2Valid = sensNegociation >= 3 && capacitePersuasion >= 3 && sensCombativite >= 3

        if (!phase2Valid) {
          finalDecision = 'NON_RECRUTE'
          console.log('📊 Décision Finale: NON_RECRUTE (phase 2 simulation échouée)')
        } else if (decisionTest === 'DEFAVORABLE') {
          finalDecision = 'NON_RECRUTE'
          console.log('📊 Décision Finale: NON_RECRUTE (tests techniques échoués)')
        } else {
          finalDecision = 'RECRUTE'
          console.log('📊 Décision Finale: RECRUTE (toutes les phases validées)')
        }
      } else {
        if (decisionTest === 'FAVORABLE') {
          finalDecision = 'RECRUTE'
          console.log('📊 Décision Finale: RECRUTE (phase 1 et tests techniques validés)')
        } else {
          finalDecision = 'NON_RECRUTE'
          console.log('📊 Décision Finale: NON_RECRUTE (tests techniques échoués)')
        }
      }
    }

    // Préparer les données de base pour un candidat présent
    const scoreData: any = {
      candidateId: body.candidateId,
      
      // Notes
      voiceQuality: body.voice_quality ? new Prisma.Decimal(body.voice_quality) : null,
      verbalCommunication: body.verbal_communication ? new Prisma.Decimal(body.verbal_communication) : null,
      presentationVisuelle: body.presentation_visuelle ? new Prisma.Decimal(body.presentation_visuelle) : null,
      appetenceDigitale: body.appetence_digitale ? new Prisma.Decimal(body.appetence_digitale) : null,
      
      phase1FfDecision: phase1FfDecision,
      
      simulationSensNegociation: body.simulation_sens_negociation ? new Prisma.Decimal(body.simulation_sens_negociation) : null,
      simulationCapacitePersuasion: body.simulation_capacite_persuasion ? new Prisma.Decimal(body.simulation_capacite_persuasion) : null,
      simulationSensCombativite: body.simulation_sens_combativite ? new Prisma.Decimal(body.simulation_sens_combativite) : null,
      
      typingSpeed: body.typing_speed ? parseInt(body.typing_speed) : null,
      typingAccuracy: body.typing_accuracy ? new Prisma.Decimal(body.typing_accuracy) : null,
      excelTest: body.excel_test ? new Prisma.Decimal(body.excel_test) : null,
      dictation: body.dictation ? new Prisma.Decimal(body.dictation) : null,
      psychoRaisonnementLogique: body.psycho_raisonnement_logique ? new Prisma.Decimal(body.psycho_raisonnement_logique) : null,
      psychoAttentionConcentration: body.psycho_attention_concentration ? new Prisma.Decimal(body.psycho_attention_concentration) : null,
      analysisExercise: body.analysis_exercise ? new Prisma.Decimal(body.analysis_exercise) : null,
      
      decisionTest: decisionTest,
      finalDecision: finalDecision,
      
      statut: 'PRESENT',
      statutCommentaire: body.statut_commentaire || null,
      comments: body.comments || null,
      
      evaluatedBy: existingScore?.evaluatedBy || null,
    }

    console.log('📊 Données score préparées (présent):', {
      candidateId: scoreData.candidateId,
      evaluatedBy: scoreData.evaluatedBy,
      statut: scoreData.statut,
      phase1FfDecision: scoreData.phase1FfDecision,
      decisionTest: scoreData.decisionTest,
      finalDecision: scoreData.finalDecision
    })

    const score = await prisma.score.upsert({
      where: { candidateId: body.candidateId },
      update: {
        ...scoreData,
        evaluatedBy: existingScore?.evaluatedBy || scoreData.evaluatedBy,
        updatedAt: new Date()
      },
      create: {
        ...scoreData,
      },
      include: {
        candidate: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            metier: true
          }
        }
      }
    })

    console.log('✅ Score final enregistré (présent)')
    console.log('  - Statut:', score.statut)
    console.log('  - Phase 1:', score.phase1FfDecision)
    console.log('  - Tests techniques:', score.decisionTest)
    console.log('  - Décision finale:', score.finalDecision)

    await AuditService.log({
      userId: session.user.id,
      userName: session.user.name || 'Utilisateur WFM',
      userEmail: session.user.email,
      action: 'UPDATE',
      entity: 'SCORE',
      entityId: score.candidate.id.toString(),
      description: `Évaluation finale du candidat ${score.candidate.nom} ${score.candidate.prenom} (${score.candidate.metier})`,
      metadata: {
        candidateId: score.candidate.id,
        candidateName: `${score.candidate.nom} ${score.candidate.prenom}`,
        metier: score.candidate.metier,
        evaluatedBy: score.evaluatedBy,
        phase1FfDecision: score.phase1FfDecision,
        decisionTest: score.decisionTest,
        finalDecision: score.finalDecision,
        statut: score.statut,
        scores: {
          voiceQuality: score.voiceQuality?.toString(),
          verbalCommunication: score.verbalCommunication?.toString(),
          presentationVisuelle: score.presentationVisuelle?.toString(),
          appetenceDigitale: score.appetenceDigitale?.toString(),
        }
      },
      ...requestInfo
    })

    return NextResponse.json({
      success: true,
      score: {
        ...score,
        voiceQuality: score.voiceQuality?.toString(),
        verbalCommunication: score.verbalCommunication?.toString(),
        presentationVisuelle: score.presentationVisuelle?.toString(),
        appetenceDigitale: score.appetenceDigitale?.toString(),
      },
      evaluatedBy: score.evaluatedBy,
      decisions: {
        phase1FfDecision: score.phase1FfDecision,
        decisionTest: score.decisionTest,
        finalDecision: score.finalDecision
      }
    })

  } catch (error) {
    console.error('❌ Error saving score:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur interne',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== 'WFM') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json({ error: 'ID candidat manquant' }, { status: 400 })
    }

    const score = await prisma.score.findUnique({
      where: { candidateId: parseInt(candidateId) },
      include: {
        candidate: {
          select: {
            nom: true,
            prenom: true,
            metier: true
          }
        }
      }
    })

    if (!score) {
      return NextResponse.json({ error: 'Score non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      ...score,
      voiceQuality: score.voiceQuality?.toString(),
      verbalCommunication: score.verbalCommunication?.toString(),
      presentationVisuelle: score.presentationVisuelle?.toString(),
      appetenceDigitale: score.appetenceDigitale?.toString(),
      evaluatedBy: score.evaluatedBy
    })

  } catch (error) {
    console.error('❌ Error fetching score:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}