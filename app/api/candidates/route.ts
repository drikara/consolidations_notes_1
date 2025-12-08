// app/api/candidates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Availability, EducationLevel } from '@prisma/client'

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
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Construction des filtres
    const where: any = {}

    if (metier && metier !== 'all') {
      where.metier = metier
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
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
      fullName,
      phone,
      birthDate,
      email,
      diploma,
      institution,
      location,
      smsSentDate,
      availability,
      interviewDate,
      metier,
      sessionId,
      notes,
      educationLevel
    } = body

    // ✅ Validation des champs requis (email n'est plus obligatoire)
    if (!fullName || !phone || !birthDate || !diploma || !institution || !location || !metier || !availability || !educationLevel || !smsSentDate || !interviewDate) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // ✅ Validation des enums
    if (!Object.values(Availability).includes(availability as Availability)) {
      return NextResponse.json(
        { error: 'Disponibilité invalide. Doit être OUI ou NON' },
        { status: 400 }
      )
    }

    if (!Object.values(EducationLevel).includes(educationLevel as EducationLevel)) {
      return NextResponse.json(
        { error: 'Niveau d\'études invalide' },
        { status: 400 }
      )
    }

    // ✅ Formatage du nom et prénom
    const nameParts = fullName.trim().split(/\s+/)
    let formattedName = ''
    
    if (nameParts.length === 1) {
      // Un seul mot : tout en majuscules
      formattedName = nameParts[0].toUpperCase()
    } else {
      // Plusieurs mots : dernier mot en MAJ (nom), premiers mots capitalisés (prénoms)
      const firstName = nameParts.slice(0, -1)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      const lastName = nameParts[nameParts.length - 1].toUpperCase()
      formattedName = `${firstName} ${lastName}`
    }

    // Vérifier si l'email existe déjà (seulement si fourni)
    if (email) {
      const existingCandidate = await prisma.candidate.findFirst({
        where: { email }
      })

      if (existingCandidate) {
        return NextResponse.json(
          { error: 'Un candidat avec cet email existe déjà' },
          { status: 400 }
        )
      }
    }

    // Calcul de l'âge
    const birthDateObj = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--
    }

    // Créer le candidat
    const candidate = await prisma.candidate.create({
      data: {
        fullName: formattedName,
        phone,
        birthDate: new Date(birthDate),
        age,
        email: email || null,
        diploma,
        institution,
        location,
        smsSentDate: new Date(smsSentDate),
        availability: availability as Availability,
        interviewDate: new Date(interviewDate),
        metier,
        sessionId: sessionId || null,
        notes: notes || '',
        educationLevel: educationLevel as EducationLevel
      },
      include: {
        scores: true,
        session: true
      }
    })

    // ✅ RÈGLE MÉTIER : Si disponibilité = NON, créer automatiquement le score avec finalDecision = NON_RECRUTE
    if (availability === 'NON') {
      await prisma.score.create({
        data: {
          candidateId: candidate.id,
          finalDecision: 'NON_RECRUTE'
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