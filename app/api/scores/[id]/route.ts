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

    const score = await prisma.score.upsert({
      where: { candidateId: Number.parseInt(id) },
      update: {
        voiceQuality: data.voice_quality ? new Decimal(data.voice_quality) : null,
        verbalCommunication: data.verbal_communication ? new Decimal(data.verbal_communication) : null,
        phase1FfDecision: data.phase1_ff_decision || null,
        psychotechnicalTest: data.psychotechnical_test ? new Decimal(data.psychotechnical_test) : null,
        phase1Decision: data.phase1_decision || null,
        typingSpeed: data.typing_speed || null,
        typingAccuracy: data.typing_accuracy ? new Decimal(data.typing_accuracy) : null,
        excelTest: data.excel_test ? new Decimal(data.excel_test) : null,
        dictation: data.dictation ? new Decimal(data.dictation) : null,
        salesSimulation: data.sales_simulation ? new Decimal(data.sales_simulation) : null,
        analysisExercise: data.analysis_exercise ? new Decimal(data.analysis_exercise) : null,
        phase2Date: data.phase2_date ? new Date(data.phase2_date) : null,
        phase2FfDecision: data.phase2_ff_decision || null,
        finalDecision: data.final_decision || null,
        comments: data.comments || null,
      },
      create: {
        candidateId: Number.parseInt(id),
        voiceQuality: data.voice_quality ? new Decimal(data.voice_quality) : null,
        verbalCommunication: data.verbal_communication ? new Decimal(data.verbal_communication) : null,
        phase1FfDecision: data.phase1_ff_decision || null,
        psychotechnicalTest: data.psychotechnical_test ? new Decimal(data.psychotechnical_test) : null,
        phase1Decision: data.phase1_decision || null,
        typingSpeed: data.typing_speed || null,
        typingAccuracy: data.typing_accuracy ? new Decimal(data.typing_accuracy) : null,
        excelTest: data.excel_test ? new Decimal(data.excel_test) : null,
        dictation: data.dictation ? new Decimal(data.dictation) : null,
        salesSimulation: data.sales_simulation ? new Decimal(data.sales_simulation) : null,
        analysisExercise: data.analysis_exercise ? new Decimal(data.analysis_exercise) : null,
        phase2Date: data.phase2_date ? new Date(data.phase2_date) : null,
        phase2FfDecision: data.phase2_ff_decision || null,
        finalDecision: data.final_decision || null,
        comments: data.comments || null,
      },
    })

    return NextResponse.json(score)
  } catch (error) {
    console.error("[v0] Error saving scores:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
