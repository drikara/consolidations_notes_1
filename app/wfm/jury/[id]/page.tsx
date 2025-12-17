// app/wfm/jury/[id]/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryProfile } from "@/components/jury-profile"

export default async function JuryProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  const juryMember = await prisma.juryMember.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
      },
      faceToFaceScores: {
        include: {
          candidate: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              metier: true,
            },
          },
        },
        orderBy: {
          evaluatedAt: 'desc',
        },
        take: 10,
      },
      juryPresences: {
        include: {
          session: {
            select: {
              id: true,
              metier: true,
              date: true,
              location: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    },
  })

  if (!juryMember) {
    redirect("/wfm/jury")
  }

  // Récupérer la dernière activité (évaluation) pour compléter les informations
  const lastActivity = await prisma.faceToFaceScore.findFirst({
    where: { juryMemberId: parseInt(id) },
    orderBy: { evaluatedAt: 'desc' },
    select: { evaluatedAt: true }
  })

  const stats = {
    totalEvaluations: juryMember.faceToFaceScores?.length || 0,
    phase1Evaluations: juryMember.faceToFaceScores?.filter((s: any) => s.phase === 1).length || 0,
    phase2Evaluations: juryMember.faceToFaceScores?.filter((s: any) => s.phase === 2).length || 0,
    totalPresences: juryMember.juryPresences?.length || 0,
    presenceRate: juryMember.juryPresences && juryMember.juryPresences.length > 0 
      ? (juryMember.juryPresences.filter((p: any) => p.wasPresent).length / juryMember.juryPresences.length * 100)
      : 0,
    lastActivity: lastActivity?.evaluatedAt || null,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6">
        <JuryProfile 
          juryMember={juryMember} 
          stats={stats}
        />
      </main>
    </div>
  )
}

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    colorScheme: "light",
  }
}

export const metadata = {
  title: "Profil Jury - WFM",
  description: "Profil détaillé du membre du jury",
}