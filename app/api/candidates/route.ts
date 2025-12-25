//app/api/candidates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Disponibilite, FinalDecision, FFDecision, Decision } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// Helper pour formater le nom en MAJUSCULES
function formatNom(nom: string): string {
  return nom.toUpperCase().trim()
}

// Helper pour formater le prénom (1ère lettre en maj, reste en minuscule)
function formatPrenom(prenom: string): string {
  const trimmed = prenom.trim()
  if (!trimmed) return ''
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    
    const {
      nom,
      prenom,
      phone,
      birthDate,
      email,
      diploma,
      niveauEtudes,
      institution,
      location,
      smsSentDate,
      availability,
      interviewDate,
      metier,
      sessionId,
      notes
    } = body

    // Validation des champs OBLIGATOIRES
    if (!nom || !prenom || !phone || !birthDate || !diploma || !niveauEtudes || 
        !institution || !location || !metier || !availability || !smsSentDate || !interviewDate) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Formater nom et prénom
    const formattedNom = formatNom(nom)
    const formattedPrenom = formatPrenom(prenom)

    // Vérifier si un candidat avec le même nom/prénom/téléphone existe déjà
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        nom: formattedNom,
        prenom: formattedPrenom,
        phone: phone
      }
    })

    if (existingCandidate) {
      return NextResponse.json(
        { error: 'Un candidat avec ce nom, prénom et téléphone existe déjà' },
        { status: 400 }
      )
    }

    // Calcul de l'âge
    const birthDateObj = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--
    }

    // Créer le candidat avec le nouveau schéma
    const candidate = await prisma.candidate.create({
      data: {
        nom: formattedNom,
        prenom: formattedPrenom,
        phone,
        birthDate: new Date(birthDate),
        age,
        email: email || null,
        diploma,
        niveauEtudes,
        institution,
        location,
        smsSentDate: new Date(smsSentDate),
        availability,
        interviewDate: new Date(interviewDate),
        metier,
        sessionId: sessionId || null,
        notes: notes || ''
      },
      include: {
        scores: true,
        session: true
      }
    })

    console.log(`✅ Candidat créé: ${candidate.id} - ${candidate.nom} ${candidate.prenom}`)

    // ⭐⭐ CRÉATION AUTOMATIQUE DU SCORE POUR LES CANDIDATS "NON DISPONIBLES"
    if (availability === Disponibilite.NON) {
      console.log(`📊 Création score automatique pour candidat non disponible: ${candidate.id}`)
      
      // Déterminer si le métier a besoin de simulation
      const needsSimulation = metier === 'AGENCES' || metier === 'TELEVENTE'
      
      await prisma.score.create({
        data: {
          candidateId: candidate.id,
          
          // ⭐ NOTES DE FACE-À-FACE à 0
          voiceQuality: new Decimal(0),
          verbalCommunication: new Decimal(0),
          presentationVisuelle: metier === 'AGENCES' ? new Decimal(0) : null,
          
          // ⭐ DÉCISIONS PHASE 1 à DEFAVORABLE/ELIMINE
          phase1FfDecision: FFDecision.DEFAVORABLE,
          phase1Decision: Decision.ELIMINE,
          
          // ⭐ NOTES DE SIMULATION à 0 (si nécessaire)
          simulationSensNegociation: needsSimulation ? new Decimal(0) : null,
          simulationCapacitePersuasion: needsSimulation ? new Decimal(0) : null,
          simulationSensCombativite: needsSimulation ? new Decimal(0) : null,
          salesSimulation: needsSimulation ? new Decimal(0) : null,
          decisionTest: needsSimulation ? FFDecision.DEFAVORABLE : null,
          
          // ⭐ TESTS PSYCHOTECHNIQUES à 0
          psychoRaisonnementLogique: new Decimal(0),
          psychoAttentionConcentration: new Decimal(0),
          psychotechnicalTest: new Decimal(0),
          
          // ⭐ TESTS TECHNIQUES à 0
          typingSpeed: 0,
          typingAccuracy: new Decimal(0),
          excelTest: new Decimal(0),
          dictation: new Decimal(0),
          analysisExercise: new Decimal(0),
          
          // ⭐ DÉCISION FINALE
          finalDecision: FinalDecision.NON_RECRUTE,
          
          // ⭐ STATUT
          statut: 'ABSENT',
          statutCommentaire: 'Candidat non disponible - évaluation automatique',
          
          // ⭐ MOYENNES CALCULÉES
          faceToFacePhase1Average: new Decimal(0),
          faceToFacePhase2Average: needsSimulation ? new Decimal(0) : null,
          
          // ⭐ MÉTADONNÉES
          comments: 'Candidat déclaré non disponible. Évaluation automatique avec toutes les notes à 0.',
          evaluatedBy: session.user.id
        }
      })
      
      console.log(`✅ Score automatique créé pour candidat non disponible: ${candidate.id}`)
    }

    return NextResponse.json(
      { candidate, message: 'Candidat créé avec succès' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating candidate:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du candidat' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const metier = searchParams.get('metier')
    const search = searchParams.get('search')

    const where: any = {}

    if (metier && metier !== 'all') {
      where.metier = metier
    }

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        scores: true,
        session: true,
        faceToFaceScores: {
          include: {
            juryMember: {
              select: {
                fullName: true,
                roleType: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!candidates || !Array.isArray(candidates)) {
      console.warn('GET /api/candidates: Invalid candidates data')
      return NextResponse.json([])
    }

    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json([])
  }
}