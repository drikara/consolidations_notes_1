import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Decimal } from "@prisma/client/runtime/library"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const data = await request.json()
    console.log("📦 Données WFM reçues:", data)

    // Fonction helper pour convertir les valeurs
    const parseDecimal = (value: string) => {
      if (!value || value === '') return null
      const num = parseFloat(value)
      return isNaN(num) ? null : new Decimal(num)
    }

    const parseIntValue = (value: string) => {
      if (!value || value === '') return null
      const num = parseInt(value)
      return isNaN(num) ? null : num
    }

    const parseDate = (value: string) => {
      if (!value || value === '') return null
      return new Date(value)
    }

    // Conversion de typingSpeed de String à Int
    const typingSpeed = parseIntValue(data.typing_speed)

    const score = await prisma.score.upsert({
      where: { candidateId: Number.parseInt(id) },
      update: {
        voiceQuality: parseDecimal(data.voice_quality),
        verbalCommunication: parseDecimal(data.verbal_communication),
        presentationVisuelle: parseDecimal(data.visual_presentation), // ← AJOUT DE CE CHAMP
        phase1FfDecision: data.phase1_ff_decision || null,
        psychotechnicalTest: parseDecimal(data.psychotechnical_test),
        phase1Decision: data.phase1_decision || null,
        typingSpeed: typingSpeed,
        typingAccuracy: parseDecimal(data.typing_accuracy),
        excelTest: parseDecimal(data.excel_test),
        dictation: parseDecimal(data.dictation),
        salesSimulation: parseDecimal(data.sales_simulation),
        analysisExercise: parseDecimal(data.analysis_exercise),
        phase2Date: parseDate(data.phase2_date),
        phase2FfDecision: data.phase2_ff_decision || null,
        finalDecision: data.final_decision || null,
        comments: data.comments || null,
      },
      create: {
        candidateId: Number.parseInt(id),
        voiceQuality: parseDecimal(data.voice_quality),
        verbalCommunication: parseDecimal(data.verbal_communication),
        presentationVisuelle: parseDecimal(data.visual_presentation), // ← AJOUT DE CE CHAMP
        phase1FfDecision: data.phase1_ff_decision || null,
        psychotechnicalTest: parseDecimal(data.psychotechnical_test),
        phase1Decision: data.phase1_decision || null,
        typingSpeed: typingSpeed,
        typingAccuracy: parseDecimal(data.typing_accuracy),
        excelTest: parseDecimal(data.excel_test),
        dictation: parseDecimal(data.dictation),
        salesSimulation: parseDecimal(data.sales_simulation),
        analysisExercise: parseDecimal(data.analysis_exercise),
        phase2Date: parseDate(data.phase2_date),
        phase2FfDecision: data.phase2_ff_decision || null,
        finalDecision: data.final_decision || null,
        comments: data.comments || null,
      },
    })

    console.log("✅ Score WFM sauvegardé:", score.id)
    return NextResponse.json(score)
  } catch (error) {
    console.error("❌ Erreur de sauvegarde des scores WFM:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}