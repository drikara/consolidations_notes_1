// app/api/export/excel/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, SessionStatus } from "@prisma/client"
import { generateConsolidatedExport } from "@/lib/export-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Récupérer les paramètres de filtrage
    const sessionId = searchParams.get('sessionId')
    const metierParam = searchParams.get('metier')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const month = searchParams.get('month')
    const statusParam = searchParams.get('status')

    // Convertir les paramètres avec vérification
    const metier = metierParam && metierParam !== 'all' ? metierParam as Metier : null
    const status = statusParam && statusParam !== 'all' ? statusParam as SessionStatus : null

    console.log('🔍 Paramètres export Excel:', { sessionId, metier, dateFrom, dateTo, month, status })

    // Construire les conditions de filtrage
    const whereConditions: any = {}

    if (sessionId) {
      whereConditions.sessionId = sessionId
    }

    if (metier) {
      whereConditions.metier = metier
    }

    // Gestion des conditions sur la session
    const sessionConditions: any = {}

    if (dateFrom || dateTo) {
      sessionConditions.date = {}
      if (dateFrom) sessionConditions.date.gte = new Date(dateFrom)
      if (dateTo) sessionConditions.date.lte = new Date(dateTo)
    }

    if (month) {
      const [year, monthNum] = month.split('-')
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59)
      
      sessionConditions.date = {
        gte: startDate,
        lte: endDate
      }
    }

    if (status) {
      sessionConditions.status = status
    }

    // Si on a des conditions sur la session, on les ajoute
    if (Object.keys(sessionConditions).length > 0) {
      whereConditions.session = sessionConditions
    }

    console.log('🔍 Conditions de filtrage Excel:', JSON.stringify(whereConditions, null, 2))

    // Récupérer les sessions avec les candidats
    const recruitmentSessions = await prisma.recruitmentSession.findMany({
      where: sessionConditions,
      include: {
        candidates: {
          where: metier ? { metier } : {},
          include: {
            scores: true,
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
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    console.log(`📊 Sessions trouvées pour Excel: ${recruitmentSessions.length}`)
    console.log(`📊 Candidats totaux: ${recruitmentSessions.reduce((sum, session) => sum + session.candidates.length, 0)}`)

    if (recruitmentSessions.length === 0 || recruitmentSessions.reduce((sum, session) => sum + session.candidates.length, 0) === 0) {
      return new NextResponse("Aucune donnée à exporter pour les critères sélectionnés", { 
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      })
    }

    // Générer l'export consolidé - retourne un objet { csv: string, filename: string }
    const exportResult = generateConsolidatedExport(recruitmentSessions)
    let csvData = exportResult.csv
    
    // Génération du nom de fichier (on peut override celui généré)
    let filename = "export_consolide"
    
    if (sessionId && recruitmentSessions[0]) {
      const session = recruitmentSessions[0]
      filename = `session_${session.metier}_${session.jour}_${session.date.toISOString().split('T')[0]}`
    } else if (metier) {
      filename = `metier_${metier}_${new Date().toISOString().split('T')[0]}`
    } else if (month) {
      filename = `mois_${month}`
    } else if (dateFrom || dateTo) {
      const datePart = dateFrom && dateTo 
        ? `${dateFrom}_to_${dateTo}`
        : dateFrom ? `from_${dateFrom}` : `to_${dateTo}`
      filename = `periode_${datePart}`
    } else {
      filename = `export_complet_${new Date().toISOString().split('T')[0]}`
    }

    if (status) {
      filename += `_${status.toLowerCase()}`
    }

    filename += '_consolide'

    console.log(`✅ Export Excel réussi: ${recruitmentSessions.reduce((sum, session) => sum + session.candidates.length, 0)} candidats`)

    // Retourner directement la STRING CSV
    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    })
  } catch (error) {
    console.error("❌ Error exporting to Excel:", error)
    return NextResponse.json({ error: "Erreur lors de l'export Excel" }, { status: 500 })
  }
}