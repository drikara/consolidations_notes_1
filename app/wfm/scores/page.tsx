import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { ScoresList } from "@/components/scores-list"

// Type pour les candidats - aligné avec ScoresList
type CandidateWithScore = {
  id: number
  full_name: string
  metier: string
  email: string | null
  final_decision?: string  
  created_at: Date
  phone: string
  scores: {
    voice_quality?: number | null
    verbal_communication?: number | null
    psychotechnical_test?: number | null
    typing_speed?: number | null
    typing_accuracy?: number | null
    excel_test?: number | null
    dictation?: number | null
    sales_simulation?: number | null
    analysis_exercise?: number | null
    phase1_decision?: string | null
    phase2_ff_decision?: string | null
  } | null
}

export default async function ScoresPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  const userData = {
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role || undefined
  }

  // Récupération des candidats avec leurs scores
  const candidatesData = await prisma.candidate.findMany({
    include: {
      scores: {
        select: {
          voiceQuality: true,
          verbalCommunication: true,
          psychotechnicalTest: true,
          typingSpeed: true,
          typingAccuracy: true,
          excelTest: true,
          dictation: true,
          salesSimulation: true,
          analysisExercise: true,
          phase1Decision: true,
          phase1FfDecision: true,  
          finalDecision: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Transformation des données pour le type attendu par ScoresList
  const candidates: CandidateWithScore[] = candidatesData.map(candidate => ({
    id: candidate.id,
    full_name: `${candidate.nom} ${candidate.prenom}`,
    metier: candidate.metier,
    email: candidate.email,
    final_decision: candidate.scores?.finalDecision || undefined,
    created_at: candidate.createdAt,
    phone: candidate.phone,
    scores: candidate.scores ? {
      voice_quality: candidate.scores.voiceQuality ? Number(candidate.scores.voiceQuality) : null,
      verbal_communication: candidate.scores.verbalCommunication ? Number(candidate.scores.verbalCommunication) : null,
      psychotechnical_test: candidate.scores.psychotechnicalTest ? Number(candidate.scores.psychotechnicalTest) : null,
      typing_speed: candidate.scores.typingSpeed,
      typing_accuracy: candidate.scores.typingAccuracy ? Number(candidate.scores.typingAccuracy) : null,
      excel_test: candidate.scores.excelTest ? Number(candidate.scores.excelTest) : null,
      dictation: candidate.scores.dictation ? Number(candidate.scores.dictation) : null,
      sales_simulation: candidate.scores.salesSimulation ? Number(candidate.scores.salesSimulation) : null,
      analysis_exercise: candidate.scores.analysisExercise ? Number(candidate.scores.analysisExercise) : null,
      phase1_decision: candidate.scores.phase1Decision,
      phase2_ff_decision: candidate.scores.phase1FfDecision,  
    } : null
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={userData} role="WFM" />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Saisie des Notes</h1>
          <p className="text-gray-600 mt-2">Gérer toutes les notes techniques des candidats</p>
        </div>
        <ScoresList candidates={candidates} />
      </main>

      {/* Footer avec copyright */}
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}