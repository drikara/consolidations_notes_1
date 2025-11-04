// app/api/session/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, SessionStatus } from "@prisma/client"

// IMPORTANT: Cette fonction doit être exportée avec "export async function POST"
export async function POST(request: Request) {
  try {
    console.log("🎯 POST /api/sessions - Début")
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    console.log("👤 User:", session?.user)

    if (!session || (session.user as any).role !== "WFM") {
      console.log("❌ Non autorisé")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    console.log("📦 Données reçues:", data)

    // Validation
    if (!data.metier || !data.date) {
      return NextResponse.json({ 
        error: "Champs manquants: métier et date requis" 
      }, { status: 400 })
    }

    // Vérifier que le métier existe dans l'enum
    if (!Object.values(Metier).includes(data.metier)) {
      return NextResponse.json({ 
        error: `Métier invalide: ${data.metier}`,
        validMetiers: Object.values(Metier)
      }, { status: 400 })
    }

    // Calcul du jour si absent
    let jour = data.jour
    if (!jour && data.date) {
      const date = new Date(data.date + 'T00:00:00')
      const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      jour = frenchDays[date.getDay()]
    }

    console.log("💾 Création en base...")
    const recruitmentSession = await prisma.recruitmentSession.create({
      data: {
        metier: data.metier as Metier,
        date: new Date(data.date + 'T00:00:00'),
        jour: jour,
        status: (data.status as SessionStatus) || 'PLANIFIED',
        description: data.description || null,
        location: data.location || null,
      },
    })

    console.log("✅ Session créée:", recruitmentSession.id)
    return NextResponse.json(recruitmentSession, { status: 201 })
    
  } catch (error) {
    console.error("❌ Erreur POST /api/sessions:", error)
    
    // Erreur détaillée en développement
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: "Erreur serveur interne" 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log("🎯 GET /api/sessions")
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const recruitmentSessions = await prisma.recruitmentSession.findMany({
      include: {
        _count: {
          select: {
            candidates: true,
            juryPresences: true
          }
        },
        candidates: {
          select: {
            id: true,
            fullName: true,
            metier: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    console.log(`✅ ${recruitmentSessions.length} sessions trouvées`)
    return NextResponse.json(recruitmentSessions)
    
  } catch (error) {
    console.error("❌ Erreur GET /api/sessions:", error)
    return NextResponse.json({ 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}