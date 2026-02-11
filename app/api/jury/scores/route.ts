import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les scores d'un candidat pour le jury connecté
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json({ error: 'ID candidat manquant' }, { status: 400 })
    }

    console.log('📖 GET /api/jury/scores - candidateId:', candidateId)

    // Récupérer le jury member
    const juryMember = await prisma.juryMember.findFirst({
      where: { userId: session.user.id }
    })

    if (!juryMember) {
      return NextResponse.json({ error: 'Membre du jury non trouvé' }, { status: 403 })
    }

    console.log('✅ Jury member trouvé:', juryMember.id)

    // Récupérer le candidat avec son score pour vérifier le statut
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(candidateId) },
      include: {
        scores: {
          select: {
            statut: true,
            finalDecision: true
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidat non trouvé' }, { status: 404 })
    }

    // ⭐ CORRECTION CRITIQUE: Vérifier si le candidat est absent (via scores.statut)
    if (candidate.scores?.statut === 'ABSENT') {
      console.log(`🚫 Jury ${juryMember.id} - Tentative d'accès à candidat ${candidateId} absent`)
      return NextResponse.json({ 
        error: 'Ce candidat est absent et ne peut pas être évalué' 
      }, { status: 403 })
    }

    // Bloquer l'accès aux candidats non disponibles
    if (candidate.availability === 'NON') {
      console.log(`🚫 Jury ${juryMember.id} - Tentative d'accès à candidat ${candidateId} non disponible`)
      return NextResponse.json({ 
        error: 'Ce candidat n\'est pas disponible et ne peut pas être évalué' 
      }, { status: 403 })
    }

    // Vérifier que le juré est assigné à la session du candidat
    if (candidate.sessionId) {
      const juryAssignedToSession = await prisma.juryPresence.findUnique({
        where: {
          juryMemberId_sessionId: {
            juryMemberId: juryMember.id,
            sessionId: candidate.sessionId
          },
          wasPresent: true
        }
      })

      if (!juryAssignedToSession) {
        console.log(`🚫 Jury ${juryMember.id} n'est pas assigné à la session ${candidate.sessionId}`)
        return NextResponse.json({ 
          error: 'Vous n\'êtes pas assigné à cette session de recrutement' 
        }, { status: 403 })
      }
      console.log('✅ Jury assigné à la session vérifié')
    } else {
      console.log(`⚠️ Candidat ${candidate.id} n'a pas de session`)
      return NextResponse.json({ 
        error: 'Le candidat n\'est pas assigné à une session' 
      }, { status: 400 })
    }

    // Récupérer tous les scores du candidat pour ce jury member
    const scores = await prisma.faceToFaceScore.findMany({
      where: {
        candidateId: parseInt(candidateId),
        juryMemberId: juryMember.id
      },
      orderBy: { phase: 'asc' }
    })

    console.log('✅ Scores trouvés:', scores.length)

    return NextResponse.json(scores)
  } catch (error) {
    console.error('❌ Error fetching scores:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer ou mettre à jour un score (Phase face à face ou Phase simulation)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      candidate_id,
      phase,
      // Phase 1: Face-à-Face
      presentation_visuelle,
      verbal_communication,
      voice_quality,
      appetence_digitale,
      // Phase 2: Simulation
      simulation_sens_negociation,
      simulation_capacite_persuasion,
      simulation_sens_combativite,
      // Commun
      decision,
      comments
    } = body

    console.log('📝 POST /api/jury/scores - Phase', phase, '- Données reçues:', {
      candidate_id,
      phase,
      decision,
      verbal_communication,
      voice_quality,
      presentation_visuelle,
      appetence_digitale,
      comments: comments ? 'Présent' : 'Absent'
    })

    // Validation des données
    if (!candidate_id || !phase) {
      return NextResponse.json({ error: 'ID candidat et phase requis' }, { status: 400 })
    }

    if (phase !== 1 && phase !== 2) {
      return NextResponse.json({ error: 'Phase doit être 1 ou 2' }, { status: 400 })
    }

    // Vérifier que le jury membre existe
    const juryMember = await prisma.juryMember.findFirst({
      where: { userId: session.user.id }
    })

    if (!juryMember) {
      return NextResponse.json({ error: 'Membre du jury non trouvé' }, { status: 403 })
    }

    console.log('✅ Jury member trouvé:', juryMember.id, juryMember.fullName, '- Role:', juryMember.roleType)

    // Vérifier les permissions d'accès au candidat
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidate_id },
      include: { 
        session: true,
        scores: {
          select: {
            statut: true,
            finalDecision: true
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidat non trouvé' }, { status: 404 })
    }

    console.log('✅ Candidat trouvé:', candidate.nom, candidate.prenom, 'Métier:', candidate.metier)

    // ⭐ CORRECTION CRITIQUE: Vérifier si le candidat est absent (via scores.statut)
    if (candidate.scores?.statut === 'ABSENT') {
      console.log(`🚫 Jury ${juryMember.id} - Tentative d'évaluer candidat ${candidate_id} absent`)
      return NextResponse.json({ 
        error: 'Ce candidat est absent et ne peut pas être évalué' 
      }, { status: 403 })
    }

    // Le candidat doit être disponible
    if (candidate.availability === 'NON') {
      console.log(`🚫 Jury ${juryMember.id} - Tentative d'évaluer candidat ${candidate_id} non disponible`)
      return NextResponse.json({ 
        error: 'Ce candidat n\'est pas disponible et ne peut pas être évalué' 
      }, { status: 403 })
    }

    // Le juré doit être assigné à la session du candidat
    if (candidate.sessionId) {
      const juryAssignedToSession = await prisma.juryPresence.findUnique({
        where: {
          juryMemberId_sessionId: {
            juryMemberId: juryMember.id,
            sessionId: candidate.sessionId
          },
          wasPresent: true
        }
      })

      if (!juryAssignedToSession) {
        console.log(`🚫 Jury ${juryMember.id} n'est pas assigné à la session ${candidate.sessionId}`)
        return NextResponse.json({ 
          error: 'Vous n\'êtes pas assigné à cette session de recrutement' 
        }, { status: 403 })
      }
      console.log('✅ Jury assigné à la session vérifié')
    } else {
      console.log(`⚠️ Candidat ${candidate.id} n'a pas de session`)
      return NextResponse.json({ 
        error: 'Le candidat n\'est pas assigné à une session' 
      }, { status: 400 })
    }

    // Vérifier si la session est active
    if (!candidate.session) {
      return NextResponse.json({ error: 'Le candidat n\'est pas assigné à une session' }, { status: 400 })
    }

    if (!['PLANIFIED', 'IN_PROGRESS'].includes(candidate.session.status)) {
      return NextResponse.json({ 
        error: `La session est ${candidate.session.status}. Vous ne pouvez plus évaluer ce candidat.` 
      }, { status: 400 })
    }

    console.log('✅ Session active vérifiée:', candidate.session.status)

    // Vérifier si le jury peut évaluer ce candidat
    if (juryMember.roleType === 'REPRESENTANT_METIER' && juryMember.specialite !== candidate.metier) {
      return NextResponse.json({ 
        error: `Vous ne pouvez évaluer que les candidats du métier ${juryMember.specialite}` 
      }, { status: 403 })
    }

    console.log('✅ Permissions vérifiées')

    // VALIDATION SELON LA PHASE
    let dataToSave: any = {
      candidateId: candidate_id,
      juryMemberId: juryMember.id,
      phase: phase,
      decision: decision,
      comments: comments || null
    }

    if (phase === 1) {
      // PHASE 1: Face-à-Face
      console.log('📊 Phase 1 - Validation Face-à-Face')
      
      if (verbal_communication === undefined || voice_quality === undefined) {
        return NextResponse.json({ 
          error: 'Communication verbale et qualité de la voix requis' 
        }, { status: 400 })
      }

      const verb = parseFloat(verbal_communication)
      const voic = parseFloat(voice_quality)

      if (isNaN(verb) || verb < 0 || verb > 5) {
        return NextResponse.json({ 
          error: 'Communication verbale doit être entre 0 et 5' 
        }, { status: 400 })
      }
      if (isNaN(voic) || voic < 0 || voic > 5) {
        return NextResponse.json({ 
          error: 'Qualité de la voix doit être entre 0 et 5' 
        }, { status: 400 })
      }

      dataToSave.verbalCommunication = verb
      dataToSave.voiceQuality = voic

      // Présentation visuelle uniquement pour AGENCES
      if (candidate.metier === 'AGENCES') {
        if (presentation_visuelle === undefined) {
          return NextResponse.json({ 
            error: 'Présentation visuelle requise pour AGENCES' 
          }, { status: 400 })
        }

        const pres = parseFloat(presentation_visuelle)
        if (isNaN(pres) || pres < 0 || pres > 5) {
          return NextResponse.json({ 
            error: 'Présentation visuelle doit être entre 0 et 5' 
          }, { status: 400 })
        }

        dataToSave.presentationVisuelle = pres
      }

      // Appétence digitale pour RESEAUX_SOCIAUX
      if (candidate.metier === 'RESEAUX_SOCIAUX') {
        if (appetence_digitale === undefined) {
          return NextResponse.json({ 
            error: 'Appétence digitale requise pour RESEAUX_SOCIAUX' 
          }, { status: 400 })
        }

        const app = parseFloat(appetence_digitale)
        if (isNaN(app) || app < 0 || app > 5) {
          return NextResponse.json({ 
            error: 'Appétence digitale doit être entre 0 et 5' 
          }, { status: 400 })
        }

        dataToSave.appetenceDigitale = app
        console.log('✅ Appétence digitale ajoutée:', app)
      }

      console.log('✅ Phase 1 - Données validées:', dataToSave)

    } else if (phase === 2) {
      // PHASE 2: Simulation (AGENCES ou TÉLÉVENTE uniquement)
      console.log('🎭 Phase 2 - Validation Simulation')

      if (candidate.metier !== 'AGENCES' && candidate.metier !== 'TELEVENTE') {
        return NextResponse.json({ 
          error: `La simulation n'est pas disponible pour le métier ${candidate.metier}` 
        }, { status: 400 })
      }

      // Vérifier que la simulation est débloquée
      console.log('🎭 Phase 2 - Vérification déblocage simulation')

      const { checkSimulationUnlockStatus } = await import('@/lib/simulation-unlock')
      const unlockStatus = await checkSimulationUnlockStatus(candidate_id, candidate.metier)

      if (!unlockStatus.unlocked) {
        console.log(`🚫 Simulation verrouillée pour candidat ${candidate_id}`)
        console.log('Conditions manquantes:', unlockStatus.missingConditions)
        
        return NextResponse.json({ 
          error: 'La simulation n\'est pas encore débloquée',
          details: unlockStatus.missingConditions,
          unlockStatus
        }, { status: 403 })
      }

      console.log('✅ Simulation débloquée - Autorisation accordée')

      if (simulation_sens_negociation === undefined || 
          simulation_capacite_persuasion === undefined || 
          simulation_sens_combativite === undefined) {
        return NextResponse.json({ 
          error: 'Tous les critères de simulation sont requis' 
        }, { status: 400 })
      }

      const neg = parseFloat(simulation_sens_negociation)
      const pers = parseFloat(simulation_capacite_persuasion)
      const comb = parseFloat(simulation_sens_combativite)

      if (isNaN(neg) || neg < 0 || neg > 5 ||
          isNaN(pers) || pers < 0 || pers > 5 ||
          isNaN(comb) || comb < 0 || comb > 5) {
        return NextResponse.json({ 
          error: 'Les scores de simulation doivent être entre 0 et 5' 
        }, { status: 400 })
      }

      dataToSave.simulationSensNegociation = neg
      dataToSave.simulationCapacitePersuasion = pers
      dataToSave.simulationSensCombativite = comb

      console.log('✅ Phase 2 - Données validées')
    }

    // ✅ Si c'est un WFM_JURY qui évalue, enregistrer son nom dans la table scores
    if (juryMember.roleType === 'WFM_JURY') {
      console.log('🎯 WFM_JURY détecté:', juryMember.fullName)
      
      try {
        await prisma.score.upsert({
          where: { candidateId: candidate_id },
          update: {
            evaluatedBy: juryMember.fullName,
            updatedAt: new Date()
          },
          create: {
            candidateId: candidate_id,
            evaluatedBy: juryMember.fullName,
          }
        })

        console.log('✅ Évaluateur WFM_JURY enregistré dans la table scores:', juryMember.fullName)
      } catch (error) {
        console.error('⚠️ Erreur lors de l\'enregistrement de l\'évaluateur:', error)
      }
    }

    // Vérifier si un score existe déjà
    const existingScore = await prisma.faceToFaceScore.findFirst({
      where: {
        candidateId: candidate_id,
        juryMemberId: juryMember.id,
        phase: phase
      }
    })

    console.log('🔍 Score existant:', existingScore ? `trouvé (ID: ${existingScore.id})` : 'non trouvé')

    let result
    if (existingScore) {
      console.log('🔄 Mise à jour du score existant...')
      result = await prisma.faceToFaceScore.update({
        where: { id: existingScore.id },
        data: {
          ...dataToSave,
          evaluatedAt: new Date()
        }
      })
      console.log('✅ Score mis à jour avec succès:', result.id)
      
      return NextResponse.json({ 
        action: 'updated',
        message: `Phase ${phase} mise à jour avec succès`,
        score: result,
        evaluatedBy: juryMember.roleType === 'WFM_JURY' ? juryMember.fullName : null
      })
    } else {
      console.log("Création d'un nouveau score...")
      result = await prisma.faceToFaceScore.create({
        data: dataToSave
      })
      console.log('✅ Nouveau score créé avec succès:', result.id)
      
      return NextResponse.json({ 
        action: 'created',
        message: `Phase ${phase} enregistrée avec succès`,
        score: result,
        evaluatedBy: juryMember.roleType === 'WFM_JURY' ? juryMember.fullName : null
      }, { status: 201 })
    }

  } catch (error) {
    console.error('❌ Error saving jury score:', error)
    
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message)
      
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Un score existe déjà pour cette phase' },
          { status: 409 }
        )
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Référence invalide (candidat ou jury member introuvable)' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}