import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || session.user.role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const candidates = await prisma.candidate.findMany({
      include: {
        scores: true,
        faceToFaceScores: {
          select: {
            score: true,
            phase: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (candidates.length === 0) {
      return new NextResponse("Aucune donnée à exporter", { status: 404 })
    }

    const results = candidates.map((c, index) => {
      const phase1Scores = c.faceToFaceScores.filter((s) => s.phase === 1)
      const phase2Scores = c.faceToFaceScores.filter((s) => s.phase === 2)

      const avgPhase1 =
        phase1Scores.length > 0 ? phase1Scores.reduce((sum, s) => sum + Number(s.score), 0) / phase1Scores.length : null

      const avgPhase2 =
        phase2Scores.length > 0 ? phase2Scores.reduce((sum, s) => sum + Number(s.score), 0) / phase2Scores.length : null

      return {
        // Colonnes A-L: Informations candidat
        "A - Numéro": index + 1,
        "B - Noms et Prénoms": c.fullName,
        "C - Numéro de Tél": c.phone,
        "D - Date de naissance": c.birthDate.toISOString().split("T")[0],
        "E - Âge": c.age,
        "F - Diplôme": c.diploma,
        "G - Établissement fréquenté": c.institution,
        "H - Mail": c.email,
        "I - Lieu d'habitation": c.location,
        "J - Date envoi SMS": c.smsSentDate ? c.smsSentDate.toISOString().split("T")[0] : "",
        "K - Disponibilité candidat": c.availability,
        "L - Date présence entretien": c.interviewDate ? c.interviewDate.toISOString().split("T")[0] : "",

        // Colonnes M-Q: Phase 1 - Entretien Initial
        "M - Qualité de la voix (/5)": c.scores?.voiceQuality ? Number(c.scores.voiceQuality) : "",
        "N - Communication verbale (/5)": c.scores?.verbalCommunication ? Number(c.scores.verbalCommunication) : "",
        "O - Décision FF Phase 1": c.scores?.phase1FfDecision || "",
        "P - Test Psychotechnique (/10)": c.scores?.psychotechnicalTest ? Number(c.scores.psychotechnicalTest) : "",
        "Q - Décision Phase 1": c.scores?.phase1Decision || "",

        // Colonnes R-Y: Phase 2 - Épreuves Techniques
        "R - Rapidité de saisie (MPM)": c.scores?.typingSpeed || "",
        "S - Précision de saisie (%)": c.scores?.typingAccuracy ? Number(c.scores.typingAccuracy) : "",
        "T - Test Excel (/5)": c.scores?.excelTest ? Number(c.scores.excelTest) : "",
        "U - Dictée (/20)": c.scores?.dictation ? Number(c.scores.dictation) : "",
        "V - Date présence Phase 2": c.scores?.phase2Date ? c.scores.phase2Date.toISOString().split("T")[0] : "",
        "W - Décision FF Phase 2": c.scores?.phase2FfDecision || "",
        "X - Décision Finale": c.scores?.finalDecision || "",
        "Y - Commentaire": c.scores?.comments || "",

        // Colonnes supplémentaires
        Métier: c.metier,
        "Simulation Vente (/5)": c.scores?.salesSimulation ? Number(c.scores.salesSimulation) : "",
        "Exercice Analyse (/10)": c.scores?.analysisExercise ? Number(c.scores.analysisExercise) : "",
        "Moyenne FF Phase 1": avgPhase1 !== null ? avgPhase1.toFixed(2) : "",
        "Moyenne FF Phase 2": avgPhase2 !== null ? avgPhase2.toFixed(2) : "",
      }
    })

    // Convert to CSV format
    const headers_row = Object.keys(results[0]).join(",")
    const data_rows = results.map((row: any) => {
      return Object.values(row)
        .map((value) => {
          if (value === null || value === undefined || value === "") return ""
          const stringValue = String(value)
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(",")
    })

    const csv = [headers_row, ...data_rows].join("\n")

    // Add BOM for Excel UTF-8 support
    const bom = "\uFEFF"
    const csvWithBom = bom + csv

    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="consolidation_notes_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error exporting to Excel:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
