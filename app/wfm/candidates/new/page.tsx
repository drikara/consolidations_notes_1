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

  // Vérification du rôle
  const userRole = (session.user as any).role || "JURY"
  if (userRole !== "WFM") {
    redirect("/auth/login")
  }

  // Récupérer les sessions disponibles pour l'association
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
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Nouveau Candidat</h1>
          <p className="text-muted-foreground mt-1">
            Enregistrer un nouveau candidat dans le système de recrutement
          </p>
          
          {/* Informations sur les sessions disponibles */}
          {sessions.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>{sessions.length} session(s) disponible(s)</strong> pour associer ce candidat
              </p>
            </div>
          )}
        </div>

        {/* Passez les sessions au formulaire */}
        <CandidateForm sessions={sessions} />
        
     

       
      </main>
    </div>
  )
}