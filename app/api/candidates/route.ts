// api/candidates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Disponibilite, FinalDecision } from '@prisma/client'

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
        email: email || null, // Email n'est plus obligatoire
        diploma,
        niveauEtudes,
        institution,
        location,
        smsSentDate: new Date(smsSentDate), // Obligatoire maintenant
        availability,
        interviewDate: new Date(interviewDate), // Obligatoire maintenant
        metier,
        sessionId: sessionId || null,
        notes: notes || ''
      },
      include: {
        scores: true,
        session: true
      }
    })

    // Si disponibilité = NON, créer automatiquement un score avec finalDecision = NON_RECRUTE
    if (availability === Disponibilite.NON) {
      await prisma.score.create({
        data: {
          candidateId: candidate.id,
          finalDecision: FinalDecision.NON_RECRUTE,
          comments: 'Candidat non disponible - Automatiquement non recruté',
          statut: 'ABSENT',
          statutCommentaire: 'Indisponibilité déclarée'
        }
      })
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