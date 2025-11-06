// app/wfm/candidates/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidatesList } from "@/components/candidates-list"

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  const params = await searchParams
  const filterMetier = params.metier as string
  const filterStatus = params.status as string
  const searchQuery = params.search as string
  const sortBy = params.sort as string || 'newest'

  const candidates = await prisma.candidate.findMany({
    include: {
      scores: true,
      session: true,
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
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Calcul des statistiques (côté serveur)
  const totalCandidates = candidates.length
  const contactedCandidates = candidates.filter(candidate => 
    candidate.scores?.callStatus && candidate.scores.callStatus !== 'NON_CONTACTE'
  ).length
  const recruitedCandidates = candidates.filter(candidate => 
    candidate.scores?.finalDecision === 'RECRUTE'
  ).length
  const pendingCandidates = candidates.filter(candidate => 
    !candidate.scores?.finalDecision
  ).length

  const metiers = [...new Set(candidates.map(c => c.metier).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      
      <main className="container mx-auto p-6 max-w-7xl">
        {/* Composant Client pour la liste interactive */}
        <CandidatesList 
          candidates={candidates}
          initialFilters={{
            metier: filterMetier,
            status: filterStatus,
            search: searchQuery,
            sort: sortBy
          }}
          statistics={{
            total: totalCandidates,
            contacted: contactedCandidates,
            recruited: recruitedCandidates,
            pending: pendingCandidates
          }}
          metiers={metiers}
        />
      </main>
    </div>
  )
}