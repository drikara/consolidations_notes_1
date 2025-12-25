// api/sessions/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { AuditService, getRequestInfo } from '@/lib/audit-service'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🎯 GET /api/sessions/${id}`)

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const recruitmentSession = await prisma.recruitmentSession.findUnique({
      where: { id },
      include: {
        candidates: {
          include: {
            scores: true
          }
        },
        juryPresences: true
      }
    })

    if (!recruitmentSession) {
      return NextResponse.json({ error: "Session non trouvée" }, { status: 404 })
    }

    // Audit de consultation
    const requestInfo = getRequestInfo(request)
    await AuditService.log({
      userId: session.user.id,
      userName: session.user.name || 'Utilisateur',
      userEmail: session.user.email,
      action: 'READ',
      entity: 'SESSION',
      entityId: id,
      description: `Consultation de la session ${recruitmentSession.metier} du ${new Date(recruitmentSession.date).toLocaleDateString('fr-FR')}`,
      metadata: {
        sessionDate: recruitmentSession.date,
        sessionMetier: recruitmentSession.metier,
        sessionStatus: recruitmentSession.status,
        candidatesCount: recruitmentSession.candidates.length,
        juryPresencesCount: recruitmentSession.juryPresences.length
      },
      ...requestInfo
    })

    return NextResponse.json(recruitmentSession)
    
  } catch (error) {
    console.error("❌ Erreur GET session:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

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

    // Récupérer l'ancienne version pour l'audit
    const oldSession = await prisma.recruitmentSession.findUnique({
      where: { id }
    })

    if (!oldSession) {
      return NextResponse.json({ 
        error: "Session non trouvée" 
      }, { status: 404 })
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
        metier: data.metier,
        date: new Date(data.date + 'T00:00:00'),
        jour: jour,
        status: data.status || 'PLANIFIED',
        description: data.description || null,
        location: data.location || null,
      },
    })

    // Audit de modification
    const requestInfo = getRequestInfo(request)
    const changes: any = {}
    
    if (oldSession.metier !== data.metier) {
      changes.metier = { old: oldSession.metier, new: data.metier }
    }
    if (oldSession.date.toISOString() !== new Date(data.date + 'T00:00:00').toISOString()) {
      changes.date = { 
        old: new Date(oldSession.date).toLocaleDateString('fr-FR'), 
        new: new Date(data.date).toLocaleDateString('fr-FR') 
      }
    }
    if (oldSession.status !== (data.status || 'PLANIFIED')) {
      changes.status = { old: oldSession.status, new: data.status || 'PLANIFIED' }
    }
    if (oldSession.description !== (data.description || null)) {
      changes.description = { old: oldSession.description, new: data.description || null }
    }
    if (oldSession.location !== (data.location || null)) {
      changes.location = { old: oldSession.location, new: data.location || null }
    }

    await AuditService.log({
      userId: session.user.id,
      userName: session.user.name || 'Utilisateur',
      userEmail: session.user.email,
      action: 'UPDATE',
      entity: 'SESSION',
      entityId: id,
      description: `Modification de la session ${recruitmentSession.metier}`,
      metadata: {
        changes,
        sessionDate: recruitmentSession.date,
        sessionStatus: recruitmentSession.status
      },
      ...requestInfo
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
    console.log(`🎯 DELETE /api/sessions/${id} - Début`)
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    console.log("👤 Session utilisateur:", session?.user)

    if (!session || (session.user as any).role !== "WFM") {
      console.log("❌ Non autorisé - Role:", (session?.user as any)?.role)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    console.log("🔍 Vérification de l'existence de la session:", id)
    
    // Vérifier d'abord si la session existe
    const existingSession = await prisma.recruitmentSession.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            candidates: true,
            juryPresences: true,
            exportLogs: true
          }
        }
      }
    })

    console.log("📊 Session trouvée:", existingSession)

    if (!existingSession) {
      console.log("❌ Session non trouvée")
      return NextResponse.json({ 
        error: "Session non trouvée" 
      }, { status: 404 })
    }

    console.log("📈 Statistiques session:", {
      candidates: existingSession._count.candidates,
      juryPresences: existingSession._count.juryPresences,
      exportLogs: existingSession._count.exportLogs
    })

    // SUPPRESSION EN CASCADE MANUELLE POUR PLUS DE SÉCURITÉ
    console.log("🗑️ Début de la suppression en cascade...")
    
    try {
      // Utiliser une transaction pour plus de sécurité
      const result = await prisma.$transaction(async (tx) => {
        console.log("1. Suppression des scores face à face...")
        // 1. Supprimer les scores face à face liés aux candidats de cette session
        await tx.faceToFaceScore.deleteMany({
          where: {
            candidate: {
              sessionId: id
            }
          }
        })

        console.log("2. Suppression des scores...")
        // 2. Supprimer les scores liés aux candidats de cette session
        await tx.score.deleteMany({
          where: {
            candidate: {
              sessionId: id
            }
          }
        })

        console.log("3. Suppression des candidats...")
        // 3. Supprimer les candidats de cette session
        await tx.candidate.deleteMany({
          where: {
            sessionId: id
          }
        })

        console.log("4. Suppression des présences du jury...")
        // 4. Supprimer les présences du jury
        await tx.juryPresence.deleteMany({
          where: {
            sessionId: id
          }
        })

        console.log("5. Suppression des logs d'export...")
        // 5. Supprimer les logs d'export
        await tx.exportLog.deleteMany({
          where: {
            sessionId: id
          }
        })

        console.log("6. Suppression de la session...")
        // 6. Finalement supprimer la session
        const deletedSession = await tx.recruitmentSession.delete({
          where: { id }
        })

        return deletedSession
      })

      // Audit de suppression (après succès de la transaction)
      const requestInfo = getRequestInfo(request)
      await AuditService.log({
        userId: session.user.id,
        userName: session.user.name || 'Utilisateur',
        userEmail: session.user.email,
        action: 'DELETE',
        entity: 'SESSION',
        entityId: id,
        description: `Suppression de la session ${existingSession.metier} du ${new Date(existingSession.date).toLocaleDateString('fr-FR')}`,
        metadata: {
          sessionMetier: existingSession.metier,
          sessionDate: existingSession.date,
          sessionStatus: existingSession.status,
          deletedData: {
            candidates: existingSession._count.candidates,
            juryPresences: existingSession._count.juryPresences,
            exportLogs: existingSession._count.exportLogs
          }
        },
        ...requestInfo
      })

      console.log("✅ Session et données associées supprimées avec succès:", id)
      
      return NextResponse.json({ 
        success: true,
        message: "Session et toutes les données associées supprimées avec succès",
        deletedId: id,
        deletedData: {
          candidates: existingSession._count.candidates,
          juryPresences: existingSession._count.juryPresences,
          exportLogs: existingSession._count.exportLogs
        }
      })

    } catch (transactionError) {
      console.error("❌ Erreur pendant la transaction:", transactionError)
      
      // Si la transaction échoue, essayer la suppression simple avec cascade
      console.log("🔄 Tentative de suppression simple avec cascade...")
      
      const deletedSession = await prisma.recruitmentSession.delete({
        where: { id }
      })

      // Audit même en cas de fallback
      const requestInfo = getRequestInfo(request)
      await AuditService.log({
        userId: session.user.id,
        userName: session.user.name || 'Utilisateur',
        userEmail: session.user.email,
        action: 'DELETE',
        entity: 'SESSION',
        entityId: id,
        description: `Suppression de la session ${existingSession.metier} (cascade automatique)`,
        metadata: {
          sessionMetier: existingSession.metier,
          sessionDate: existingSession.date,
          fallbackMode: true
        },
        ...requestInfo
      })

      console.log("✅ Session supprimée avec cascade:", id)
      
      return NextResponse.json({ 
        success: true,
        message: "Session supprimée avec succès (cascade automatique)",
        deletedId: id
      })
    }
    
  } catch (error) {
    console.error("❌ Erreur DELETE détaillée:", error)
    
    if (error instanceof Error) {
      // Gérer les contraintes de clé étrangère
      if (error.message.includes('Foreign key constraint') || error.message.includes('foreign key constraint')) {
        return NextResponse.json({ 
          error: "Impossible de supprimer cette session à cause de contraintes de base de données. Le schéma Prisma doit être mis à jour avec onDelete: Cascade." 
        }, { status: 400 })
      }
      
      if (error.message.includes('Record à supprimer non trouvé') || error.message.includes('Record to delete not found')) {
        return NextResponse.json({ 
          error: "Session non trouvée" 
        }, { status: 404 })
      }
    }
    
    return NextResponse.json({ 
      error: "Erreur serveur interne lors de la suppression" 
    }, { status: 500 })
  }
}