import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidatesList } from "@/components/candidates-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function CandidatesPage() {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Candidats</h1>
            <p className="text-muted-foreground mt-1">Liste complète des candidats enregistrés</p>
          </div>
          <Link href="/wfm/candidates/new">
            <Button className="bg-primary hover:bg-accent text-primary-foreground">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau Candidat
            </Button>
          </Link>
        </div>
        <CandidatesList candidates={candidates} />
      </main>
    </div>
  )
}
