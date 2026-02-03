// app/wfm/candidates/[id]/call/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatutForm } from "@/components/statut-form" // ✅ CORRECTION: Nom correct

export default async function CandidateCallPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: parseInt(id) },
    include: {
      scores: true
    }
  })

  if (!candidate) {
    redirect("/wfm/candidates")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />
      <main className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          {/* ✅ CORRECTION: nom et prenom au lieu de fullName */}
          <h1 className="text-3xl font-bold">
            Statut de Présence - {candidate.nom} {candidate.prenom}
          </h1>
          <p className="text-muted-foreground">
            {candidate.metier} • {candidate.email || 'Pas d\'email'} • {candidate.phone}
          </p>
        </div>

        {/* ✅ CORRECTION: Props correctes selon StatutForm */}
        <StatutForm 
          candidateId={candidate.id}
          currentStatut={candidate.scores?.statut}
          currentComment={candidate.scores?.statutCommentaire}
        />
      </main>
    </div>
  )
}