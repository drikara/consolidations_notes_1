// app/wfm/candidates/new/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidateForm } from "@/components/candidate-form"

export default async function NewCandidatePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  const userRole = (session.user as any).role || "JURY"
  if (userRole !== "WFM") {
    redirect("/auth/login")
  }

  const sessions = await prisma.recruitmentSession.findMany({
    where: {
      OR: [
        { status: 'PLANIFIED' },
        { status: 'IN_PROGRESS' }
      ]
    },
    select: {
      id: true,
      metier: true,
      date: true,
      jour: true,
      status: true,
      description: true
    },
    orderBy: {
      date: 'asc'
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ⭐ CORRECTION: Retirer la prop role */}
      <DashboardHeader user={session.user} />
      
      <main className="container mx-auto p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Nouveau Candidat</h1>
          <p className="text-gray-600 mt-2">
            Enregistrer un nouveau candidat dans le système de recrutement
          </p>
        </div>

        {sessions.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              💡 {sessions.length} session(s) disponible(s) pour associer ce candidat
            </p>
          </div>
        )}

        <CandidateForm sessions={sessions} />
      </main>
    </div>
  )
}