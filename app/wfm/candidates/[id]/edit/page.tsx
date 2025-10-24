import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidateForm } from "@/components/candidate-form"

export default async function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "WFM") {
    redirect("/auth/login")
  }

  const candidates = await sql`SELECT * FROM candidates WHERE id = ${id}`
  const candidate = candidates[0]

  if (!candidate) {
    redirect("/wfm/candidates")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Modifier le Candidat</h1>
          <p className="text-muted-foreground mt-1">Mettre à jour les informations du candidat</p>
        </div>
        <CandidateForm candidate={candidate} />
      </main>
    </div>
  )
}
