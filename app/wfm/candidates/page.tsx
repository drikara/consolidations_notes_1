// app/wfm/candidates/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidatesList } from "@/components/candidates-list"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CandidatesPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  // Attendre searchParams avant de l'utiliser
  const params = await searchParams
  
  const filterMetier = params.metier as string | undefined
  const filterStatus = params.status as string | undefined
  const searchQuery = params.search as string | undefined
  const sortBy = (params.sort as string) || 'newest'

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

      {/* Footer avec copyright */}
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}