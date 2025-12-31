// app/api/export/advanced/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers as getHeaders } from "next/headers"
import { prisma } from "@/lib/prisma"
import { Metier } from "@prisma/client"
import { AuditService, getRequestInfo } from "@/lib/audit-service"

export async function GET(request: NextRequest) {
  try {
    const headersList = await getHeaders()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const requestInfo = getRequestInfo(request)
    const searchParams = request.nextUrl.searchParams
    
    const year = searchParams.get("year")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const metiersParam = searchParams.get("metiers")
    const status = searchParams.get("status")
    const preview = searchParams.get("preview") === "true"

    console.log('🔍 Paramètres export avancé:', { year, startDate, endDate, metiersParam, status, preview })

    const where: any = {}

    if (year && year !== "all") {
      const yearNum = parseInt(year)
      where.createdAt = {
        gte: new Date(`${yearNum}-01-01T00:00:00.000Z`),
        lte: new Date(`${yearNum}-12-31T23:59:59.999Z`),
      }
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`)
      if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`)
    }

    if (metiersParam) {
      const metiers = metiersParam.split(",").map(m => m.trim()).filter(Boolean)
      if (metiers.length > 0) {
        where.metier = { in: metiers as Metier[] }
      }
    }

    if (status && status !== "all") {
      where.scores = { finalDecision: status }
    }

    console.log('🔍 Conditions de filtrage:', JSON.stringify(where, null, 2))

    if (preview) {
      const count = await prisma.candidate.count({ where })
      console.log(`📊 Prévisualisation: ${count} candidats`)
      return NextResponse.json({ count })
    }

    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        session: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
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
      },
      orderBy: { createdAt: "desc" },
    })

    console.log(`📊 Export avancé: ${candidates.length} candidats trouvés`)

    if (candidates.length === 0) {
      return new NextResponse("Aucun candidat trouvé avec ces critères", { 
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      })
    }

    const XLSX = await import('xlsx')
    const metiersPresent = Array.from(new Set(candidates.map(c => c.metier))) as Metier[]

    const metierTechnicalColumns: Record<Metier, string[]> = {
      [Metier.CALL_CENTER]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Test Excel (/5)', 'Dictée (/20)'],
      [Metier.AGENCES]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Dictée (/20)', 'Sens Négociation (/5)', 'Capacité Persuasion (/5)', 'Sens Combativité (/5)'],
      [Metier.BO_RECLAM]: ['Raisonnement Logique (/5)', 'Attention Concentration (/5)', 'Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Test Excel (/5)', 'Dictée (/20)'],
      [Metier.TELEVENTE]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Dictée (/20)', 'Sens Négociation (/5)', 'Capacité Persuasion (/5)', 'Sens Combativité (/5)'],
      [Metier.RESEAUX_SOCIAUX]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Dictée (/20)'],
      [Metier.SUPERVISION]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Test Excel (/5)', 'Dictée (/20)'],
      [Metier.BOT_COGNITIVE_TRAINER]: ['Test Excel (/5)', 'Dictée (/20)', 'Capacité d\'Analyse (/5)'],
      [Metier.SMC_FIXE]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Test Excel (/5)', 'Dictée (/20)'],
      [Metier.SMC_MOBILE]: ['Rapidité de Saisie (MPM)', 'Précision de Saisie (%)', 'Test Excel (/5)', 'Dictée (/20)']
    }

    const allTechnicalColumns = new Set<string>()
    metiersPresent.forEach(metier => {
      metierTechnicalColumns[metier]?.forEach(col => allTechnicalColumns.add(col))
    })

    function getTechnicalColumnValue(candidate: any, columnName: string): string {
      const scores = candidate.scores
      if (!scores) return ''
      
      const mapping: Record<string, any> = {
        'Raisonnement Logique (/5)': scores.psychoRaisonnementLogique,
        'Attention Concentration (/5)': scores.psychoAttentionConcentration,
        'Rapidité de Saisie (MPM)': scores.typingSpeed,
        'Précision de Saisie (%)': scores.typingAccuracy,
        'Test Excel (/5)': scores.excelTest,
        'Dictée (/20)': scores.dictation,
        'Capacité d\'Analyse (/5)': scores.analysisExercise,
        'Sens Négociation (/5)': scores.simulationSensNegociation,
        'Capacité Persuasion (/5)': scores.simulationCapacitePersuasion,
        'Sens Combativité (/5)': scores.simulationSensCombativite,
      }
      
      return mapping[columnName]?.toString() || ''
    }

    function calculatePhase1Average(faceToFaceScores: any[], criteria: string): string {
      const phase1Scores = faceToFaceScores.filter((s: any) => s.phase === 1)
      if (phase1Scores.length === 0) return ''
      
      const validScores = phase1Scores.filter((s: any) => s[criteria] !== null && s[criteria] !== undefined)
      if (validScores.length === 0) return ''
      
      const avg = validScores.reduce((sum: number, score: any) => sum + (Number(score[criteria]) || 0), 0) / validScores.length
      return avg.toFixed(2)
    }

    // En-têtes avec Disponibilité après "Créé par"
    const exportHeaders = [
      'N°', 'Nom', 'Prénoms', 'Email', 'Téléphone', 'Âge', 'Diplôme', 'Niveau d\'études', 
      'Université', 'Lieu d\'habitation', 'Date d\'entretien', 'Métier',
      'Créé par', 'Disponibilité', // Ajout Disponibilité
      'Présentation Visuelle (moyenne)', 'Communication Verbale (moyenne)', 'Qualité Vocale (moyenne)', 'Décision Face-à-Face',
      ...Array.from(allTechnicalColumns),
      'Décision Test', 'Décision Finale', 'Commentaires Généraux'
    ]
    
    const data = [exportHeaders]
    
    candidates.forEach((candidate: any, index: number) => {
      const candidateMetier = candidate.metier as Metier
      const sessionCreator = candidate.session?.createdBy?.name || 'Non renseigné'
      
      const row = [
        index + 1,
        candidate.nom || '',
        candidate.prenom || '',
        candidate.email || '',
        candidate.phone || '',
        candidate.age || '',
        candidate.diploma || '',
        candidate.niveauEtudes || '',
        candidate.institution || '',
        candidate.location || '',
        candidate.interviewDate ? new Date(candidate.interviewDate).toLocaleDateString('fr-FR') : '',
        candidate.metier || '',
        sessionCreator,
        candidate.availability || '', // Ajout disponibilité
        calculatePhase1Average(candidate.faceToFaceScores || [], 'presentationVisuelle'),
        calculatePhase1Average(candidate.faceToFaceScores || [], 'verbalCommunication'),
        calculatePhase1Average(candidate.faceToFaceScores || [], 'voiceQuality'),
        candidate.scores?.phase1FfDecision || '',
        ...Array.from(allTechnicalColumns).map(col => {
          const candidateMetierColumns = metierTechnicalColumns[candidateMetier] || []
          return candidateMetierColumns.includes(col) ? getTechnicalColumnValue(candidate, col) : ''
        }),
        candidate.scores?.decisionTest || '',
        candidate.scores?.finalDecision || '',
        candidate.scores?.comments || ''
      ]
      
      data.push(row)
    })
    
    const ws = XLSX.utils.aoa_to_sheet(data)
    
    const colWidths = [
      { wch: 5 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 6 }, 
      { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 18 },
      { wch: 20 }, { wch: 15 }, // Créé par + Disponibilité
      { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 18 }
    ]
    
    Array.from(allTechnicalColumns).forEach(() => colWidths.push({ wch: 18 }))
    colWidths.push({ wch: 15 }, { wch: 18 }, { wch: 40 })
    
    ws['!cols'] = colWidths
    ws['!freeze'] = { xSplit: 0, ySplit: 1 }
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Export Avancé')
    
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    
    let filename = 'export_avance'
    if (year && year !== 'all') filename += `_${year}`
    if (metiersParam && metiersParam.split(',').length === 1) {
      filename += `_${metiersParam.replace(/\s+/g, '_')}`
    }
    filename += `_${new Date().toISOString().split('T')[0]}.xlsx`

    const sessionCreators = Array.from(new Set(
      candidates.map(c => c.session?.createdBy?.name || 'Non renseigné')
    ))

    await AuditService.log({
      userId: session.user.id,
      userName: session.user.name || 'Utilisateur WFM',
      userEmail: session.user.email,
      action: 'EXPORT',
      entity: 'EXPORT',
      description: `Export avancé - ${filename}`,
      metadata: {
        exportType: 'XLSX_ADVANCED',
        fileName: filename,
        recordCount: candidates.length,
        sessionCreators: sessionCreators,
        filters: { year, startDate, endDate, metiers: metiersParam, status }
      },
      ...requestInfo
    })

    console.log(`✅ Export avancé réussi: ${candidates.length} candidats - ${filename}`)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("❌ Erreur lors de l'export avancé:", error)
    return NextResponse.json({ error: "Erreur lors de l'export avancé" }, { status: 500 })
  }
}