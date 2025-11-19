//api/sessions/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, SessionStatus } from "@prisma/client"

// GET - Récupérer toutes les sessions
export async function GET(request: Request) {
  try {
    console.log("🔍 GET /api/sessions - Début")
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      console.log("❌ Non autorisé - Pas de session")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    console.log("👤 Utilisateur:", session.user?.email)

    const recruitmentSessions = await prisma.recruitmentSession.findMany({
      include: {
        candidates: {
          include: {
            scores: {
              select: {
                finalDecision: true,
                callStatus: true,
              }
            },
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
          }
        },
        juryPresences: {
          include: {
            juryMember: {
              select: {
                fullName: true,
                roleType: true
              }
            }
          }
        },
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

    console.log(`✅ ${recruitmentSessions.length} sessions trouvées`)
    return NextResponse.json(recruitmentSessions)
    
  } catch (error) {
    console.error("❌ Error fetching sessions:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des sessions" 
    }, { status: 500 })
  }
}

// POST - Créer une nouvelle session
export async function POST(request: Request) {
  try {
    console.log("🎯 POST /api/sessions - Début")
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      console.log("❌ Non autorisé - Pas de session")
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    console.log("👤 Utilisateur:", session.user?.email, "- Role:", userRole)

    if (userRole !== "WFM") {
      console.log("❌ Non autorisé - Role insuffisant")
      return NextResponse.json({ 
        error: "Seuls les utilisateurs WFM peuvent créer des sessions" 
      }, { status: 403 })
    }

    const data = await request.json()
    console.log("📦 Données reçues:", data)

    // Validation des champs requis
    if (!data.metier) {
      console.log("❌ Champ métier manquant")
      return NextResponse.json({ 
        error: "Le champ métier est obligatoire" 
      }, { status: 400 })
    }

    if (!data.date) {
      console.log("❌ Champ date manquant")
      return NextResponse.json({ 
        error: "Le champ date est obligatoire" 
      }, { status: 400 })
    }

    // Validation du métier
    const validMetiers = Object.values(Metier)
    if (!validMetiers.includes(data.metier as Metier)) {
      console.log("❌ Métier invalide:", data.metier)
      return NextResponse.json({ 
        error: `Métier invalide. Valeurs acceptées: ${validMetiers.join(', ')}` 
      }, { status: 400 })
    }

    // Calcul du jour de la semaine
    const selectedDate = new Date(data.date + 'T00:00:00')
    const dayIndex = selectedDate.getDay()
    const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const jour = frenchDays[dayIndex]

    console.log("📅 Date:", selectedDate.toISOString(), "- Jour:", jour)

    // Validation du statut si fourni
    let status: SessionStatus = 'PLANIFIED'
    if (data.status) {
      const validStatus = Object.values(SessionStatus)
      if (validStatus.includes(data.status as SessionStatus)) {
        status = data.status as SessionStatus
      } else {
        console.log("⚠️ Statut invalide, utilisation de PLANIFIED par défaut")
      }
    }

    // Créer la session
    const newSession = await prisma.recruitmentSession.create({
      data: {
        metier: data.metier as Metier,
        date: selectedDate,
        jour: jour,
        status: status,
        description: data.description?.trim() || null,
        location: data.location?.trim() || null,
      },
      include: {
        candidates: true,
        juryPresences: true,
        _count: {
          select: {
            candidates: true,
            juryPresences: true
          }
        }
      }
    })

    console.log("✅ Session créée avec succès:", newSession.id)
    return NextResponse.json(newSession, { status: 201 })
    
  } catch (error) {
    console.error("❌ Erreur création session:", error)
    
    // Gestion des erreurs Prisma spécifiques
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: "Une session similaire existe déjà" 
        }, { status: 409 })
      }
    }
    
    return NextResponse.json({ 
      error: "Erreur lors de la création de la session" 
    }, { status: 500 })
  }
}