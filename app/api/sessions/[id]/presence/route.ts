// api/sessions/[id]/presence/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    // Vérifier si l'utilisateur est connecté
    if (!session) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 })
    }

    const userRole = (session.user as any).role;
    
    // Autoriser WFM ET Jury
    if (userRole !== "WFM" && userRole !== "JURY") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()

    // Si c'est un jury, on s'assure qu'il ne peut modifier que sa propre présence
    if (userRole === "JURY") {
      // Récupérer l'ID du jury associé à cet utilisateur
      const juryMember = await prisma.juryMember.findFirst({
        where: {
          userId: session.user.id
        }
      })

      if (!juryMember) {
        return NextResponse.json({ error: "Profil jury non trouvé" }, { status: 404 })
      }

      // Forcer l'utilisation de l'ID du jury de l'utilisateur connecté
      data.juryMemberId = juryMember.id
    }

    // Validation
    if (!data.juryMemberId) {
      return NextResponse.json({ error: "ID du jury manquant" }, { status: 400 })
    }

    const presence = await prisma.juryPresence.upsert({
      where: {
        juryMemberId_sessionId: {
          juryMemberId: data.juryMemberId,
          sessionId: id
        }
      },
      update: {
        wasPresent: data.wasPresent !== undefined ? data.wasPresent : true,
        absenceReason: data.absenceReason || null
      },
      create: {
        juryMemberId: data.juryMemberId,
        sessionId: id,
        wasPresent: data.wasPresent !== undefined ? data.wasPresent : true,
        absenceReason: data.absenceReason || null
      },
      include: {
        juryMember: {
          select: {
            fullName: true,
            roleType: true
          }
        }
      }
    })

    return NextResponse.json(presence)
  } catch (error) {
    console.error("Error managing jury presence:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}