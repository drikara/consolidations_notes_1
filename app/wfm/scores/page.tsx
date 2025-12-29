// app/wfm/scores/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { ScoresList } from "@/components/scores-list"
import { serializeCandidatesForList } from "@/lib/decimal-helpers"
import Link from "next/link"

export default async function ScoresPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "WFM") {
    redirect("/auth/login")
  }

  // Charger tous les candidats avec leurs scores
  const candidates = await prisma.candidate.findMany({
    include: {
      scores: true,
      session: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  //  SÉRIALISER les candidats avant de les passer au composant client
  const serializedCandidates = serializeCandidatesForList(candidates)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />
      
      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Gestion des Notes
            </h1>
            <p className="text-gray-600 mt-2">
              Évaluez et suivez les performances des candidats
            </p>
          </div>
          
          <Link
            href="/wfm/candidates"
            className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors font-semibold shadow-lg"
          >
            Voir tous les candidats
          </Link>
        </div>

        <ScoresList candidates={serializedCandidates} />
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