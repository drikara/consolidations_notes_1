// app/api/sessions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { AuditService, getRequestInfo } from '@/lib/audit-service'

// GET - Récupérer toutes les sessions avec compteurs
export async function GET(request: NextRequest) {
  try {
    console.log('🎯 GET /api/sessions')

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer les sessions avec les compteurs
    const sessions = await prisma.recruitmentSession.findMany({
      include: {
        _count: {
          select: {
            candidates: true,
            juryPresences: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Transformer pour ajouter les compteurs au niveau racine
    const sessionsWithCounts = sessions.map(session => ({
      id: session.id,
      metier: session.metier,
      date: session.date,
      jour: session.jour,
      status: session.status,
      description: session.description,
      location: session.location,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      createdById: session.createdById,
      createdBy: session.createdBy,
      candidatesCount: session._count.candidates,
      juryPresencesCount: session._count.juryPresences
    }))

    console.log(`✅ ${sessionsWithCounts.length} sessions récupérées avec compteurs`)
    return NextResponse.json(sessionsWithCounts)

  } catch (error) {
    console.error("❌ Erreur GET sessions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer une nouvelle session
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 POST /api/sessions')

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    console.log("📦 Données reçues:", data)

    // Validation
    if (!data.metier || !data.date) {
      return NextResponse.json({ 
        error: "Champs manquants (metier et date requis)" 
      }, { status: 400 })
    }

    // Calcul du jour si absent
    let jour = data.jour
    if (!jour && data.date) {
      const date = new Date(data.date + 'T00:00:00')
      const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      jour = frenchDays[date.getDay()]
    }

    const recruitmentSession = await prisma.recruitmentSession.create({
      data: {
        metier: data.metier,
        date: new Date(data.date + 'T00:00:00'),
        jour: jour,
        status: data.status || 'IN_PROGRESS',
        description: data.description || null,
        location: data.location || null,
        createdById: session.user.id
      },
      include: {
        _count: {
          select: {
            candidates: true,
            juryPresences: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Audit de création
    const requestInfo = getRequestInfo(request)
    await AuditService.log({
      userId: session.user.id,
      userName: session.user.name || 'Utilisateur',
      userEmail: session.user.email,
      action: 'CREATE',
      entity: 'SESSION',
      entityId: recruitmentSession.id,
      description: `Création de la session ${recruitmentSession.metier} du ${new Date(recruitmentSession.date).toLocaleDateString('fr-FR')}`,
      metadata: {
        sessionDate: recruitmentSession.date,
        sessionMetier: recruitmentSession.metier,
        sessionStatus: recruitmentSession.status,
        sessionLocation: recruitmentSession.location,
        sessionDescription: recruitmentSession.description
      },
      ...requestInfo
    })

    console.log("✅ Session créée:", recruitmentSession.id)

    // Retourner avec les compteurs
    const response = {
      ...recruitmentSession,
      candidatesCount: recruitmentSession._count.candidates,
      juryPresencesCount: recruitmentSession._count.juryPresences
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error("❌ Erreur POST:", error)
    return NextResponse.json({ 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}