import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers, cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryEvaluationsList } from "@/components/jury-evaluations-list"

export default async function JuryEvaluationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  const cookieStore = await cookies()
  const viewMode = cookieStore.get('viewMode')?.value as 'WFM' | 'JURY' | undefined

  const userRole = (session.user as any).role || "JURY"
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      juryMember: {
        select: {
          roleType: true,
          isActive: true
        }
      }
    }
  })

  const isWFMJury = user?.role === 'WFM' && user?.juryMember?.roleType === 'WFM_JURY'
  
  const canAccessJuryPage = 
    userRole === "JURY" || 
    (isWFMJury && viewMode === 'JURY')

  if (!canAccessJuryPage) {
    redirect("/auth/login")
  }

  const juryMember = await prisma.juryMember.findFirst({
    where: { userId: session.user.id }
  })

  if (!juryMember) {
    redirect("/jury/dashboard")
  }

  // ✅ CORRECTION : Même ordre que dans [id]/page.tsx
  const candidates = await prisma.candidate.findMany({
    where: {
      session: {
        juryMembers: {
          some: { id: juryMember.id }
        },
        status: {
          in: ["PLANIFIED", "IN_PROGRESS"]
        }
      }
    },
    include: {
      session: {
        select: {
          metier: true,
          date: true
        }
      },
      scores: {
        select: {
          finalDecision: true,
          statut: true
        }
      },
      faceToFaceScores: {
        where: {
          juryMemberId: juryMember.id
        },
        orderBy: {
          evaluatedAt: 'desc'
        },
        take: 1
      }
    },
    orderBy: {
      id: 'asc'  // ✅ MÊME ORDRE que [id]/page.tsx
    }
  })

  const candidatesWithStatus = candidates.map(candidate => {
    const phase1Score = candidate.faceToFaceScores.find(s => s.phase === 1)
    const phase2Score = candidate.faceToFaceScores.find(s => s.phase === 2)
    const needsSimulation = candidate.metier === 'AGENCES' || candidate.metier === 'TELEVENTE'

    let evaluationStatus: 'not_evaluated' | 'phase1_only' | 'both_phases'
    if (!phase1Score) {
      evaluationStatus = 'not_evaluated'
    } else if (needsSimulation && !phase2Score) {
      evaluationStatus = 'phase1_only'
    } else if (needsSimulation && phase2Score) {
      evaluationStatus = 'both_phases'
    } else {
      evaluationStatus = 'both_phases'
    }

    return {
      id: candidate.id,
      fullName: `${candidate.prenom} ${candidate.nom}`,
      metier: candidate.metier,
      age: candidate.age,
      diploma: candidate.diploma,
      location: candidate.location,
      availability: candidate.availability,
      interviewDate: candidate.interviewDate,
      session: candidate.session,
      scores: candidate.scores,
      myScore: candidate.faceToFaceScores[0] || null,
      evaluationStatus
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-cyan-50">
      <DashboardHeader user={session.user} />
      
      <main className="container mx-auto p-6 max-w-7xl">
        <JuryEvaluationsList 
          candidates={candidatesWithStatus}
          juryMemberId={juryMember.id}
        />
      </main>

      <footer className="border-t mt-8 py-4 bg-white">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}