// app/wfm/candidates/[id]/page.tsx
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidateDetails } from "@/components/candidates-details"
import { transformPrismaData } from "@/lib/server-utils" // ⭐ CHANGEMENT ICI

interface CandidateDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  const { id } = await params

  // Récupérer les données du candidat avec toutes les relations nécessaires
  const candidate = await prisma.candidate.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      scores: true,
      session: true,
      faceToFaceScores: {
        include: {
          juryMember: {
            select: {
              fullName: true,
              roleType: true,
              specialite: true
            }
          }
        }
      }
    }
  })

  if (!candidate) {
    notFound()
  }

  // Utiliser transformPrismaData du serveur
  const formattedCandidate = transformPrismaData(candidate)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <DashboardHeader user={session.user} role="WFM" />
      
      <main className="container mx-auto p-6 max-w-7xl">
        <CandidateDetails candidate={formattedCandidate} />
      </main>
    </div>
  )
}