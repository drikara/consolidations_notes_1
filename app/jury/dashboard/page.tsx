import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function JuryDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "JURY") {
    redirect("/auth/login")
  }

  // Get jury member info
  const juryMembers = await sql`SELECT * FROM jury_members WHERE user_id = ${session.user.id}`
  const juryMember = juryMembers[0]

  if (!juryMember) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={session.user} role="JURY" />
        <main className="container mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-yellow-800 mb-2">Profil Incomplet</h2>
            <p className="text-yellow-700">
              Votre compte n'est pas encore configuré comme membre du jury. Veuillez contacter l'administrateur WFM.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Get evaluation statistics
  const evaluatedCount = await sql`
    SELECT COUNT(DISTINCT candidate_id) as count
    FROM face_to_face_scores
    WHERE jury_member_id = ${juryMember.id}
  `

  const pendingCandidates = await sql`
    SELECT c.*
    FROM candidates c
    WHERE c.id NOT IN (
      SELECT candidate_id FROM face_to_face_scores WHERE jury_member_id = ${juryMember.id}
    )
    ORDER BY c.created_at DESC
    LIMIT 5
  `

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="JURY" />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de Bord Jury</h1>
          <p className="text-muted-foreground mt-1">
            {juryMember.full_name} - {juryMember.role_type}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Évaluations Complétées</p>
                <p className="text-3xl font-bold text-foreground mt-2">{Number(evaluatedCount[0].count)}</p>
              </div>
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Candidats en Attente</p>
                <p className="text-3xl font-bold text-foreground mt-2">{pendingCandidates.length}</p>
              </div>
              <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Candidats Récents</h2>
            <Link href="/jury/evaluations">
              <Button variant="outline" size="sm" className="border-border hover:bg-muted bg-transparent">
                Voir tout
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {pendingCandidates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucun candidat en attente d'évaluation</p>
            ) : (
              pendingCandidates.map((candidate: any) => (
                <div key={candidate.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{candidate.full_name}</p>
                    <p className="text-sm text-muted-foreground">{candidate.metier}</p>
                  </div>
                  <Link href={`/jury/evaluations/${candidate.id}`}>
                    <Button size="sm" className="bg-primary hover:bg-accent text-primary-foreground">
                      Évaluer
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
