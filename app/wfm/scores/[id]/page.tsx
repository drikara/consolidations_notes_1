import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { WFMScoreForm } from "@/components/wfm-score-form"

export default async function CandidateScorePage({ params }: { params: Promise<{ id: string }> }) {
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
    redirect("/wfm/scores")
  }

  const scores = await sql`SELECT * FROM scores WHERE candidate_id = ${id}`
  const score = scores[0] || null

  const faceToFaceScores = await sql`
    SELECT ffs.*, jm.full_name as jury_name, jm.role_type
    FROM face_to_face_scores ffs
    JOIN jury_members jm ON ffs.jury_member_id = jm.id
    WHERE ffs.candidate_id = ${id}
    ORDER BY ffs.phase, jm.full_name
  `

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Notes - {candidate.full_name}</h1>
          <p className="text-muted-foreground mt-1">
            {candidate.metier} • {candidate.email}
          </p>
        </div>
        <WFMScoreForm candidate={candidate} score={score} faceToFaceScores={faceToFaceScores} />
      </main>
    </div>
  )
}
