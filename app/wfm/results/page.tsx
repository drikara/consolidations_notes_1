import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { ResultsTable } from "@/components/results-table"

export default async function ResultsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "WFM") {
    redirect("/auth/login")
  }

  const results = await sql`
    SELECT 
      c.*,
      s.voice_quality,
      s.verbal_communication,
      s.psychotechnical_test,
      s.phase1_decision,
      s.typing_speed,
      s.typing_accuracy,
      s.excel_test,
      s.dictation,
      s.sales_simulation,
      s.analysis_exercise,
      s.phase2_date,
      s.phase2_ff_decision,
      s.final_decision,
      s.comments
    FROM candidates c
    LEFT JOIN scores s ON c.id = s.candidate_id
    ORDER BY c.created_at DESC
  `

  // Calculate statistics by metier
  const statsByMetier = await sql`
    SELECT 
      c.metier,
      COUNT(*) as total,
      COUNT(CASE WHEN s.final_decision = 'RECRUTÉ' THEN 1 END) as recrutes,
      COUNT(CASE WHEN s.final_decision = 'NON RECRUTÉ' THEN 1 END) as non_recrutes
    FROM candidates c
    LEFT JOIN scores s ON c.id = s.candidate_id
    GROUP BY c.metier
    ORDER BY c.metier
  `

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Résultats et Consolidation</h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble des résultats de tous les candidats</p>
        </div>

        {/* Statistics by Metier */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Statistiques par Métier</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsByMetier.map((stat: any) => (
              <div key={stat.metier} className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium text-primary mb-2">{stat.metier}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium text-foreground">{Number(stat.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recrutés:</span>
                    <span className="font-medium text-green-600">{Number(stat.recrutes)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Non Recrutés:</span>
                    <span className="font-medium text-red-600">{Number(stat.non_recrutes)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ResultsTable results={results} />
      </main>
    </div>
  )
}
