// app/api/export/excel/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier, SessionStatus } from "@prisma/client"
import { generateConsolidatedExportXLSX, generateSessionExportXLSX } from "@/lib/export-utils"

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

    // Si une session est spécifiée, exporter uniquement cette session
    if (sessionId) {
      // Récupérer la session spécifique
      const recruitmentSession = await prisma.recruitmentSession.findUnique({
        where: { id: sessionId },
        include: {
          candidates: {
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
        }
      })

      if (!recruitmentSession) {
        return new NextResponse("Session non trouvée", { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8'
          }
        })
      }

      if (recruitmentSession.candidates.length === 0) {
        return new NextResponse("Aucun candidat dans cette session", { 
          status: 404,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8'
          }
        })
      }

      // Générer l'export pour cette session uniquement
      const exportResult = await generateSessionExportXLSX(recruitmentSession)

      console.log(`✅ Export Excel session ${recruitmentSession.metier}: ${recruitmentSession.candidates.length} candidats`)

      // Retourner le buffer Excel
      return new NextResponse(exportResult.buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
        },
      })
    }

    // Sinon, exporter consolidé avec filtres
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

    if (metier) {
      sessionConditions.metier = metier
    }

    console.log('🔍 Conditions de filtrage Excel:', JSON.stringify(sessionConditions, null, 2))

    // Récupérer les sessions avec les candidats
    const recruitmentSessions = await prisma.recruitmentSession.findMany({
      where: sessionConditions,
      include: {
        candidates: {
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

    // Générer l'export consolidé
    const exportResult = await generateConsolidatedExportXLSX(recruitmentSessions)

    console.log(`✅ Export Excel consolidé réussi: ${recruitmentSessions.reduce((sum, session) => sum + session.candidates.length, 0)} candidats`)

    // Retourner le buffer Excel
    return new NextResponse(exportResult.buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${exportResult.filename}"`,
      },
    })
  } catch (error) {
    console.error("❌ Error exporting to Excel:", error)
    return NextResponse.json({ error: "Erreur lors de l'export Excel" }, { status: 500 })
  }
}