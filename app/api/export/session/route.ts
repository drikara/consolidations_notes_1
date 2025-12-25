//api/sessions/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, SessionStatus } from "@prisma/client"

// GET - Récupérer toutes les sessions
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const recruitmentSessions = await prisma.recruitmentSession.findMany({
      include: {
        candidates: {
          include: {
            scores: {
              select: {
                finalDecision: true,
                statut: true,
              }
            }
          }
        },
        juryPresences: true,
        _count: {
          select: {
            candidates: true,
            juryPresences: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(recruitmentSessions)
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer une nouvelle session
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    console.log("📦 Données reçues pour création:", data)

    // Validation des champs requis
    if (!data.metier || !data.date) {
      return NextResponse.json({ 
        error: "Les champs métier et date sont obligatoires" 
      }, { status: 400 })
    }

    // Calcul du jour de la semaine
    const selectedDate = new Date(data.date + 'T00:00:00')
    const dayIndex = selectedDate.getDay()
    const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const jour = frenchDays[dayIndex]

    // Créer la session
    const newSession = await prisma.recruitmentSession.create({
      data: {
        metier: data.metier as Metier,
        date: selectedDate,
        jour: jour,
        status: (data.status as SessionStatus) || 'PLANIFIED',
        description: data.description || null,
        location: data.location || null,
      },
      include: {
        _count: {
          select: {
            candidates: true,
            juryPresences: true
          }
        }
      }
    })

    console.log("✅ Session créée:", newSession.id)
    return NextResponse.json(newSession, { status: 201 })
    
  } catch (error) {
    console.error("❌ Erreur création session:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la création de la session" 
    }, { status: 500 })
  }
}