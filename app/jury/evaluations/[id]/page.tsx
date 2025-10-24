import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryScoreForm } from "@/components/jury-score-form"

export default async function JuryEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const candidates = await sql`SELECT * FROM candidates WHERE id = ${id}`
  const candidate = candidates[0]

  if (!candidate) {
    redirect("/jury/evaluations")
  }

  const existingScores = await sql`
    SELECT * FROM face_to_face_scores
    WHERE candidate_id = ${id} AND jury_member_id = ${juryMember.id}
  `

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="JURY" />
      <main className="container mx-auto p-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Évaluation Face à Face</h1>
          <p className="text-muted-foreground mt-1">
            {candidate.full_name} - {candidate.metier}
          </p>
        </div>
        <JuryScoreForm candidate={candidate} juryMember={juryMember} existingScores={existingScores} />
      </main>
    </div>
  )
}
