import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryEvaluationsList } from "@/components/jury-evaluations-list"

export default async function JuryEvaluationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "JURY") {
    redirect("/auth/login")
  }

  const juryMembers = await sql`SELECT * FROM jury_members WHERE user_id = ${session.user.id}`
  const juryMember = juryMembers[0]

  if (!juryMember) {
    redirect("/jury/dashboard")
  }

  const candidates = await sql`
    SELECT c.*,
      ffs.score as my_score,
      ffs.phase as evaluated_phase
    FROM candidates c
    LEFT JOIN face_to_face_scores ffs ON c.id = ffs.candidate_id AND ffs.jury_member_id = ${juryMember.id}
    ORDER BY c.created_at DESC
  `

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="JURY" />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mes Évaluations</h1>
          <p className="text-muted-foreground mt-1">Liste des candidats à évaluer</p>
        </div>
        <JuryEvaluationsList candidates={candidates} juryMemberId={juryMember.id} />
      </main>
    </div>
  )
}
