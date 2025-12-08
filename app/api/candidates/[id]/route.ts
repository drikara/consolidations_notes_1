// app/api/candidates/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, Availability, EducationLevel } from "@prisma/client"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Validation du métier
    const metierValue = data.metier as keyof typeof Metier
    if (!Metier[metierValue]) {
      return NextResponse.json({ error: "Métier invalide" }, { status: 400 })
    }

    // ✅ Validation de la disponibilité
    if (data.availability && !Object.values(Availability).includes(data.availability)) {
      return NextResponse.json({ error: "Disponibilité invalide" }, { status: 400 })
    }

    // ✅ Validation du niveau d'études
    if (data.education_level && !Object.values(EducationLevel).includes(data.education_level)) {
      return NextResponse.json({ error: "Niveau d'études invalide" }, { status: 400 })
    }

    // ✅ Formatage du nom et prénom
    let formattedName = data.full_name
    if (data.full_name) {
      const nameParts = data.full_name.trim().split(/\s+/)
      if (nameParts.length === 1) {
        formattedName = nameParts[0].toUpperCase()
      } else {
        const firstName = nameParts.slice(0, -1)
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
        const lastName = nameParts[nameParts.length - 1].toUpperCase()
        formattedName = `${firstName} ${lastName}`
      }
    }

    const candidateId = parseInt(id)

    // Récupérer l'ancienne disponibilité
    const oldCandidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    })

    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        fullName: formattedName,
        phone: data.phone,
        birthDate: new Date(data.birth_date),
        age: data.age,
        diploma: data.diploma,
        institution: data.institution,
        email: data.email || null,
        location: data.location,
        smsSentDate: data.sms_sent_date ? new Date(data.sms_sent_date) : undefined,
        availability: data.availability as Availability,
        interviewDate: data.interview_date ? new Date(data.interview_date) : undefined,
        metier: Metier[metierValue],
        sessionId: data.session_id || null,
        educationLevel: data.education_level as EducationLevel
      },
    })

    // ✅ RÈGLE MÉTIER : Si la disponibilité passe à NON, mettre finalDecision à NON_RECRUTE
    if (data.availability === 'NON' && oldCandidate?.availability !== 'NON') {
      await prisma.score.upsert({
        where: { candidateId },
        update: {
          finalDecision: 'NON_RECRUTE'
        },
        create: {
          candidateId,
          finalDecision: 'NON_RECRUTE'
        }
      })
    }

    return NextResponse.json(candidate)
  } catch (error) {
    console.error("Error updating candidate:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    await prisma.candidate.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting candidate:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(id) },
      include: {
        session: true,
        scores: true,
        faceToFaceScores: {
          include: {
            juryMember: true
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidat non trouvé" }, { status: 404 })
    }

    return NextResponse.json(candidate)
  } catch (error) {
    console.error("Error fetching candidate:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}