import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { RecentCandidates } from "@/components/recent-candidates"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function WFMDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "WFM") {
    redirect("/auth/login")
  }

  // Get statistics
  const candidatesCount = await sql`SELECT COUNT(*) as count FROM candidates`
  const admisCount = await sql`SELECT COUNT(*) as count FROM scores WHERE final_decision = 'RECRUTÉ'`
  const elimineCount = await sql`SELECT COUNT(*) as count FROM scores WHERE final_decision = 'NON RECRUTÉ'`
  const enCoursCount = await sql`
    SELECT COUNT(*) as count FROM candidates c
    LEFT JOIN scores s ON c.id = s.candidate_id
    WHERE s.final_decision IS NULL
  `

  const stats = {
    total: Number(candidatesCount[0].count),
    admis: Number(admisCount[0].count),
    elimine: Number(elimineCount[0].count),
    enCours: Number(enCoursCount[0].count),
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tableau de Bord WFM</h1>
            <p className="text-muted-foreground mt-1">Gestion complète du processus de recrutement</p>
          </div>
          <div className="flex gap-3">
            <Link href="/wfm/candidates/new">
              <Button className="bg-primary hover:bg-accent text-primary-foreground">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau Candidat
              </Button>
            </Link>
            <Link href="/wfm/results">
              <Button variant="outline" className="border-border hover:bg-muted bg-transparent">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Voir Résultats
              </Button>
            </Link>
          </div>
        </div>
        <StatsCards stats={stats} />
        <RecentCandidates />
      </main>
    </div>
  )
}
