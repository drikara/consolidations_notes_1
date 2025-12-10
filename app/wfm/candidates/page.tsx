// app/wfm/candidates/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidatesList } from "@/components/candidates-list"
import { serializeForClient } from "@/lib/server-utils"

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

  const params = await searchParams
  
  const filterMetier = params.metier as string | undefined
  const filterStatus = params.status as string | undefined
  const searchQuery = params.search as string | undefined
  const sortBy = (params.sort as string) || 'newest'

  try {
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

    // ✅ CORRECTION: Sérialiser les données pour les composants Client
    const serializedCandidates = serializeForClient(candidates)

    // Calcul des statistiques
    const totalCandidates = serializedCandidates.length
    const contactedCandidates = serializedCandidates.filter(candidate => 
      candidate?.scores?.statut && candidate.scores.statut !== 'ABSENT'
    ).length
    const recruitedCandidates = serializedCandidates.filter(candidate => 
      candidate?.scores?.finalDecision === 'RECRUTE'
    ).length
    const pendingCandidates = serializedCandidates.filter(candidate => 
      !candidate?.scores?.finalDecision
    ).length

    const metiers = [...new Set(serializedCandidates.map(c => c?.metier).filter(Boolean))]

    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={session.user} role="WFM" />
        
        <main className="container mx-auto p-6 max-w-7xl">
          <CandidatesList 
            candidates={serializedCandidates}
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

        <footer className="border-t mt-8 py-4">
          <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
          </div>
        </footer>
      </div>
    )
  } catch (error) {
    console.error("Erreur lors du chargement des candidats:", error)
    
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={session.user} role="WFM" />
        
        <main className="container mx-auto p-6 max-w-7xl">
          <CandidatesList 
            candidates={[]}
            statistics={{ total: 0, contacted: 0, recruited: 0, pending: 0 }}
            metiers={[]}
          />
        </main>
      </div>
    )
  }
}