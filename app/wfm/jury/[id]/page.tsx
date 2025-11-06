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
              fullName: true,
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
          session: {
            date: 'desc',
          },
        },
        take: 10,
      },
    },
  })

  if (!juryMember) {
    redirect("/wfm/jury")
  }

  const stats = {
    totalEvaluations: juryMember.faceToFaceScores.length,
    phase1Evaluations: juryMember.faceToFaceScores.filter(s => s.phase === 1).length,
    phase2Evaluations: juryMember.faceToFaceScores.filter(s => s.phase === 2).length,
    totalPresences: juryMember.juryPresences.length,
    presenceRate: juryMember.juryPresences.length > 0 
      ? (juryMember.juryPresences.filter(p => p.wasPresent).length / juryMember.juryPresences.length * 100)
      : 0,
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