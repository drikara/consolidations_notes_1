// app/wfm/scores/[id]/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { WFMScoreForm } from "@/components/wfm-score-form"
import { serializeScore } from "@/lib/decimal-helpers"
import Link from "next/link"

export default async function CandidateScorePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "WFM") {
    redirect("/auth/login")
  }

  const candidateId = parseInt(id)

  // Charger le candidat
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId }
  })

  if (!candidate) {
    redirect("/wfm/scores")
  }

  // Charger les scores existants
  const existingScores = await prisma.score.findUnique({
    where: { candidateId: candidateId }
  })

  // ⭐ SÉRIALISER les scores avant de les passer au composant client
  const serializedScores = existingScores ? serializeScore(existingScores) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />
      
      <main className="container mx-auto p-6 max-w-5xl">
        <Link
          href="/wfm/scores"
          className="inline-block border-b bg-orange-500 text-white px-4 py-2 rounded-sm cursor-pointer hover:bg-orange-600 transition-colors mb-8"
        >
          ← Revenir sur la page Notes
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Évaluation - {candidate.prenom} {candidate.nom}
          </h1>
          <p className="text-gray-600 mt-2">
            {candidate.metier} • {candidate.email || 'Pas d\'email'} • {candidate.phone}
          </p>
        </div>
        
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <WFMScoreForm 
            candidate={{
              id: candidate.id,
              fullName: `${candidate.prenom} ${candidate.nom}`,
              nom: candidate.nom,
              prenom: candidate.prenom,
              metier: candidate.metier,
              availability: candidate.availability
            }} 
            existingScores={serializedScores}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}