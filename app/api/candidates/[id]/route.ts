
// api/candidates/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier } from "@prisma/client"

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

    // Formater nom et prénom
    const formattedNom = data.nom ? formatNom(data.nom) : undefined
    const formattedPrenom = data.prenom ? formatPrenom(data.prenom) : undefined

    const candidate = await prisma.candidate.update({
      where: { id: parseInt(id) },
      data: {
        nom: formattedNom,
        prenom: formattedPrenom,
        phone: data.phone,
        birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
        age: data.age,
        diploma: data.diploma,
        niveauEtudes: data.niveau_etudes,
        institution: data.institution,
        email: data.email || null,
        location: data.location,
        smsSentDate: data.sms_sent_date ? new Date(data.sms_sent_date) : undefined,
        availability: data.availability,
        interviewDate: data.interview_date ? new Date(data.interview_date) : undefined,
        metier: Metier[metierValue],
        sessionId: data.session_id || null,
      },
    })

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