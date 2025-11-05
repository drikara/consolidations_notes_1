// app/wfm/scores/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { ScoresList } from "@/components/scores-list"

// CORRECTION : Définir le type pour les résultats SQL
type CandidateFromDB = {
  id: number
  full_name: string
  metier: string
  email: string
  final_decision?: string
  created_at: string
  phone?: string
}

export default async function ScoresPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  // CORRECTION : Préparer les données user avec le bon type
  const userData = {
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role || undefined
  }

  // CORRECTION : Typage explicite des résultats SQL
  const candidatesResult = await sql<CandidateFromDB[]>`
    SELECT c.*, s.final_decision
    FROM candidates c
    LEFT JOIN scores s ON c.id = s.candidate_id
    ORDER BY c.created_at DESC
  `

  // CORRECTION : Convertir les résultats SQL en type Candidate attendu
  const candidates = candidatesResult.map(candidate => ({
    id: candidate.id,
    full_name: candidate.full_name,
    metier: candidate.metier,
    email: candidate.email,
    final_decision: candidate.final_decision,
    created_at: candidate.created_at,
    phone: candidate.phone,
    scores: null // Initialiser scores à null car non chargé dans cette requête
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CORRECTION : Passer les données corrigées */}
      <DashboardHeader user={userData} role="WFM" />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Saisie des Notes</h1>
          <p className="text-gray-600 mt-2">Gérer toutes les notes techniques des candidats</p>
        </div>
        <ScoresList candidates={candidates} />
      </main>
    </div>
  )
}