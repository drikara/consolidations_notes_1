// app/api/sessions/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, SessionStatus } from "@prisma/client"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🎯 PUT /api/sessions/${id}`)

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
        error: "Champs manquants" 
      }, { status: 400 })
    }

    // Vérifier que le métier existe
    if (!Object.values(Metier).includes(data.metier)) {
      return NextResponse.json({ 
        error: "Métier invalide" 
      }, { status: 400 })
    }

    // Calcul du jour si absent
    let jour = data.jour
    if (!jour && data.date) {
      const date = new Date(data.date + 'T00:00:00')
      const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
      jour = frenchDays[date.getDay()]
    }

    const recruitmentSession = await prisma.recruitmentSession.update({
      where: { id },
      data: {
        metier: data.metier as Metier,
        date: new Date(data.date + 'T00:00:00'),
        jour: jour,
        status: (data.status as SessionStatus) || 'PLANIFIED',
        description: data.description || null,
        location: data.location || null,
      },
    })

    console.log("✅ Session modifiée:", recruitmentSession.id)
    return NextResponse.json(recruitmentSession)
    
  } catch (error) {
    console.error("❌ Erreur PUT:", error)
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ 
        error: "Session non trouvée" 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🎯 DELETE /api/sessions/${id}`)
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    await prisma.recruitmentSession.delete({
      where: { id },
    })

    console.log("✅ Session supprimée")
    return NextResponse.json({ message: "Session supprimée" })
    
  } catch (error) {
    console.error("❌ Erreur DELETE:", error)
    return NextResponse.json({ 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}