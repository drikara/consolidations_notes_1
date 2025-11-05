// app/wfm/scores/[id]/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { WFMScoreForm } from "@/components/wfm-score-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-5xl">
        <Link
          href={"/wfm/scores"}
          className="border-b bg-orange-500 text-white px-4 py-2  rounded-sm cursor-pointer"
          >  Revenir sur la page Notes
        </Link>
        <div className="mb-8 mt-8">
          <h1 className="text-3xl font-bold text-gray-800">Notes - {candidate.full_name}</h1>
          <p className="text-gray-600 mt-2">
            {candidate.metier} • {candidate.email}
          </p>
        </div>
        
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <WFMScoreForm candidate={candidate} score={score} faceToFaceScores={faceToFaceScores} />
        </div>
      </main>
    </div>
  )
}