import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidateForm } from "@/components/candidate-form"

export default async function NewCandidatePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "WFM") {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Nouveau Candidat</h1>
          <p className="text-muted-foreground mt-1">Enregistrer un nouveau candidat dans le système</p>
        </div>
        <CandidateForm />
      </main>
    </div>
  )
}
