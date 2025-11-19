// app/api/candidates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

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

    // ✅ CORRECTION: Récupération sécurisée avec try-catch
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

    // ✅ CORRECTION: Toujours retourner un tableau valide
    if (!candidates || !Array.isArray(candidates)) {
      console.warn('GET /api/candidates: Invalid candidates data')
      return NextResponse.json([])
    }

    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Error fetching candidates:', error)
    // ✅ CRITIQUE: Retourner un tableau vide avec status 200 pour éviter les erreurs client
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
      notes
    } = body

    // Validation des champs requis
    if (!fullName || !phone || !birthDate || !email || !diploma || !institution || !location || !metier || !availability) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingCandidate = await prisma.candidate.findUnique({
      where: { email }
    })

    if (existingCandidate) {
      return NextResponse.json(
        { error: 'Un candidat avec cet email existe déjà' },
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

    // Créer le candidat
    const candidate = await prisma.candidate.create({
      data: {
        fullName,
        phone,
        birthDate: new Date(birthDate),
        age,
        email,
        diploma,
        institution,
        location,
        smsSentDate: smsSentDate ? new Date(smsSentDate) : null,
        availability,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        metier,
        sessionId: sessionId || null,
        notes: notes || ''
      },
      include: {
        scores: true,
        session: true
      }
    })

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