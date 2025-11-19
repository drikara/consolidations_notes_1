import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { ResultsTable } from "@/components/results-table"
import { ToastProvider } from '@/components/toast-provider'

// Type pour les résultats
interface Result {
  id: number
  full_name: string
  phone: string
  birth_date: Date
  age: number
  diploma: string
  institution: string
  email: string
  location: string
  sms_sent_date: Date | null
  availability: string
  interview_date: Date | null
  metier: string
  session_id: string | null
  notes: string | null
  created_at: Date
  updated_at: Date
  // Champs des scores
  voice_quality: number | null
  verbal_communication: number | null
  psychotechnical_test: number | null
  phase1_decision: string | null
  typing_speed: number | null
  typing_accuracy: number | null
  excel_test: number | null
  dictation: number | null
  sales_simulation: number | null
  analysis_exercise: number | null
  phase2_date: Date | null
  phase2_ff_decision: string | null
  final_decision: string | null
  comments: string | null
}

export default async function ResultsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  // Récupérer les candidats avec leurs scores en utilisant Prisma
  const candidates = await prisma.candidate.findMany({
    include: {
      scores: true,
      session: {
        select: {
          metier: true,
          date: true,
          jour: true,
          status: true,
          location: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Transformer les données pour correspondre au format attendu
  const results: Result[] = candidates.map(candidate => ({
    id: candidate.id,
    full_name: candidate.fullName,
    phone: candidate.phone,
    birth_date: candidate.birthDate,
    age: candidate.age,
    diploma: candidate.diploma,
    institution: candidate.institution,
    email: candidate.email,
    location: candidate.location,
    sms_sent_date: candidate.smsSentDate,
    availability: candidate.availability,
    interview_date: candidate.interviewDate,
    metier: candidate.metier,
    session_id: candidate.sessionId,
    notes: candidate.notes,
    created_at: candidate.createdAt,
    updated_at: candidate.updatedAt,
    // Champs des scores
    voice_quality: candidate.scores?.voiceQuality ? Number(candidate.scores.voiceQuality) : null,
    verbal_communication: candidate.scores?.verbalCommunication ? Number(candidate.scores.verbalCommunication) : null,
    psychotechnical_test: candidate.scores?.psychotechnicalTest ? Number(candidate.scores.psychotechnicalTest) : null,
    phase1_decision: candidate.scores?.phase1Decision || null,
    typing_speed: candidate.scores?.typingSpeed || null,
    typing_accuracy: candidate.scores?.typingAccuracy ? Number(candidate.scores.typingAccuracy) : null,
    excel_test: candidate.scores?.excelTest ? Number(candidate.scores.excelTest) : null,
    dictation: candidate.scores?.dictation ? Number(candidate.scores.dictation) : null,
    sales_simulation: candidate.scores?.salesSimulation ? Number(candidate.scores.salesSimulation) : null,
    analysis_exercise: candidate.scores?.analysisExercise ? Number(candidate.scores.analysisExercise) : null,
    phase2_date: candidate.scores?.phase2Date || null,
    phase2_ff_decision: candidate.scores?.phase2FfDecision || null,
    final_decision: candidate.scores?.finalDecision || null,
    comments: candidate.scores?.comments || null,
  }))

  // Calculer les statistiques par métier avec Prisma
  const statsByMetier = await prisma.candidate.groupBy({
    by: ['metier'],
    _count: {
      id: true
    },
    where: {
      scores: {
        isNot: null
      }
    }
  })

  // Récupérer les statistiques détaillées pour chaque métier
  const detailedStats = await Promise.all(
    statsByMetier.map(async (stat) => {
      const recrutes = await prisma.candidate.count({
        where: {
          metier: stat.metier,
          scores: {
            finalDecision: 'RECRUTE'
          }
        }
      })

      const nonRecrutes = await prisma.candidate.count({
        where: {
          metier: stat.metier,
          scores: {
            finalDecision: 'NON_RECRUTE'
          }
        }
      })

      return {
        metier: stat.metier,
        total: stat._count.id,
        recrutes,
        non_recrutes: nonRecrutes
      }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <ToastProvider />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Résultats et Consolidation</h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble des résultats de tous les candidats</p>
        </div>

        {/* Statistics by Metier */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Statistiques par Métier</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {detailedStats.map((stat) => (
              <div key={stat.metier} className="bg-orange-25 border border-orange-200 rounded-lg p-4">
                <p className="text-sm font-medium text-orange-700 mb-3">{stat.metier}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium text-gray-800">{stat.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recrutés:</span>
                    <span className="font-medium text-green-600">{stat.recrutes}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Non Recrutés:</span>
                    <span className="font-medium text-red-600">{stat.non_recrutes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ResultsTable results={results} />
      </main>

      {/* Footer avec copyright */}
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()}  Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}