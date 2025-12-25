// app/api/sessions/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, SessionStatus } from "@prisma/client"
import { AuditService, getRequestInfo } from "@/lib/audit-service"

export async function GET() {
  try {
    console.log("🎯 GET /api/sessions - Récupération de toutes les sessions")

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    console.log("👤 Session utilisateur:", session?.user)

    if (!session) {
      console.log("❌ Non autorisé - Pas de session")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier le rôle
    const userRole = (session.user as any).role
    console.log("🔐 Rôle utilisateur:", userRole)

    if (userRole !== "WFM") {
      console.log("❌ Non autorisé - Rôle insuffisant:", userRole)
      return NextResponse.json({ error: "Accès réservé aux WFM" }, { status: 403 })
    }

    // Récupérer toutes les sessions avec le nombre de candidats
    const sessions = await prisma.recruitmentSession.findMany({
      orderBy: { date: 'desc' },
      include: {
        candidates: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            candidates: true,
            juryPresences: true,
          }
        }
      },
    })

    console.log(`📊 ${sessions.length} sessions trouvées`)

    // Formater les données pour inclure le nombre de candidats
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      metier: session.metier,
      date: session.date,
      jour: session.jour,
      status: session.status,
      description: session.description,
      location: session.location,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      candidatesCount: session._count.candidates,
      juryPresencesCount: session._count.juryPresences,
    }))

    return NextResponse.json(formattedSessions)
    
  } catch (error) {
    console.error("❌ Erreur GET sessions:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des sessions" 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("🎯 POST /api/sessions - Création d'une nouvelle session")

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    console.log("👤 Session utilisateur:", session?.user)

    if (!session || (session.user as any).role !== "WFM") {
      console.log("❌ Non autorisé - Rôle:", (session?.user as any)?.role)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const requestInfo = getRequestInfo(request)
    const body = await request.json()
    console.log("📦 Données reçues:", body)

    const { metier, date, jour, status, description, location } = body

    // Validation
    if (!metier || !date) {
      console.log("❌ Champs manquants:", { metier, date })
      return NextResponse.json({ 
        error: "Le métier et la date sont obligatoires" 
      }, { status: 400 })
    }

    // Calcul du jour si absent
    let calculatedJour = jour
    if (!calculatedJour && date) {
      try {
        const selectedDate = new Date(date + 'T00:00:00')
        const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        calculatedJour = frenchDays[selectedDate.getDay()]
        console.log("📅 Jour calculé:", calculatedJour)
      } catch (error) {
        console.error("❌ Erreur calcul jour:", error)
        return NextResponse.json({ 
          error: "Format de date invalide" 
        }, { status: 400 })
      }
    }

    // Créer la session
    const newSession = await prisma.recruitmentSession.create({
      data: {
        metier,
        date: new Date(date + 'T00:00:00'),
        jour: calculatedJour,
        status: status || 'PLANIFIED',
        description: description || null,
        location: location || null,
      },
    })

    console.log("✅ Session créée:", newSession.id)

    // 🆕 ENREGISTRER L'AUDIT
    await AuditService.log({
      userId: session.user.id,
      userName: session.user.name || 'Utilisateur WFM',
      userEmail: session.user.email,
      action: 'CREATE',
      entity: 'SESSION',
      entityId: newSession.id,
      description: `Création de session ${newSession.metier} pour le ${new Date(newSession.date).toLocaleDateString('fr-FR')}`,
      metadata: {
        metier: newSession.metier,
        date: newSession.date,
        status: newSession.status,
        location: newSession.location
      },
      ...requestInfo
    })

    return NextResponse.json(newSession)
    
  } catch (error) {
    console.error("❌ Erreur POST sessions:", error)
    
    if (error instanceof Error) {
      // Gérer les erreurs de contrainte unique si nécessaire
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: "Une session avec ces caractéristiques existe déjà" 
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({ 
      error: "Erreur lors de la création de la session" 
    }, { status: 500 })
  }
}