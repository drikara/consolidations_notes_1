import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    const candidate = await prisma.candidate.create({
      data: {
        fullName: data.full_name,
        phone: data.phone,
        birthDate: new Date(data.birth_date),
        age: data.age,
        diploma: data.diploma,
        institution: data.institution,
        email: data.email,
        location: data.location,
        smsSentDate: data.sms_sent_date ? new Date(data.sms_sent_date) : null,
        availability: data.availability,
        interviewDate: data.interview_date ? new Date(data.interview_date) : null,
        metier: data.metier,
      },
    })

    return NextResponse.json(candidate)
  } catch (error) {
    console.error("[v0] Error creating candidate:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const candidates = await prisma.candidate.findMany({
      include: {
        scores: {
          select: {
            finalDecision: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(candidates)
  } catch (error) {
    console.error("[v0] Error fetching candidates:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
