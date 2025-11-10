import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { generateSessionExport } from "@/lib/export-utils"
import JSZip from "jszip"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionIds = searchParams.get('sessionIds')?.split(',')

    if (!sessionIds || sessionIds.length === 0) {
      return NextResponse.json({ error: "Aucune session sélectionnée" }, { status: 400 })
    }

    // Récupérer les sessions
    const recruitmentSessions = await prisma.recruitmentSession.findMany({
      where: {
        id: {
          in: sessionIds
        }
      },
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

    if (recruitmentSessions.length === 0) {
      return NextResponse.json({ error: "Aucune session trouvée" }, { status: 404 })
    }

    // Créer un ZIP avec tous les fichiers
    const zip = new JSZip()

    for (const session of recruitmentSessions) {
      const csvData = generateSessionExport(session)
      const fileName = `${session.metier}_Session_${session.jour}_${session.date.toISOString().split('T')[0]}.csv`
      zip.file(fileName, csvData)
    }

    // Générer le ZIP
    const zipContent = await zip.generateAsync({ type: 'blob' })

    return new NextResponse(zipContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="export_sessions_${new Date().toISOString().split('T')[0]}.zip"`,
      },
    })
  } catch (error) {
    console.error("Multiple export error:", error)
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 })
  }
}