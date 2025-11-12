// app/api/export/global/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Metier } from "@prisma/client"
import JSZip from "jszip"
import { generateSessionExport, generateConsolidatedExport } from "@/lib/export-utils"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const metier = searchParams.get('metier') as Metier | null
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Construire les filtres
    const where: any = {}
    
    if (metier) {
      where.metier = metier
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }

    // Récupérer les sessions avec filtres
    const recruitmentSessions = await prisma.recruitmentSession.findMany({
      where,
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

    if (recruitmentSessions.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à exporter" }, { status: 404 })
    }

    // Créer un ZIP avec tous les fichiers
    const zip = new JSZip()

    // Fichier par session
    for (const recruitmentSession of recruitmentSessions) {
      const exportResult = generateSessionExport(recruitmentSession)
      // zip.file() attend (filename: string, data: string)
      zip.file(exportResult.filename, exportResult.csv)
    }

    // Fichier consolidé global
    const globalResult = generateConsolidatedExport(recruitmentSessions)
    zip.file(globalResult.filename, globalResult.csv)

    // Générer le ZIP en Blob
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    
    // Convertir Blob en ArrayBuffer pour NextResponse
    const zipBuffer = await zipBlob.arrayBuffer()

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="export_global_${new Date().toISOString().split('T')[0]}.zip"`,
      },
    })
  } catch (error) {
    console.error("Global export error:", error)
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 })
  }
}