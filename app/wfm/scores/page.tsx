import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { ScoresList } from "@/components/scores-list"

export default async function ScoresPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "WFM") {
    redirect("/auth/login")
  }

  const candidates = await sql`
    SELECT c.*, s.final_decision
    FROM candidates c
    LEFT JOIN scores s ON c.id = s.candidate_id
    ORDER BY c.created_at DESC
  `

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Saisie des Notes</h1>
          <p className="text-muted-foreground mt-1">Gérer toutes les notes techniques des candidats</p>
        </div>
        <ScoresList candidates={candidates} />
      </main>
    </div>
  )
}
