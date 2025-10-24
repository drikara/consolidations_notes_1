import { sql } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export async function RecentCandidates() {
  const candidates = await sql`
    SELECT c.*, s.final_decision
    FROM candidates c
    LEFT JOIN scores s ON c.id = s.candidate_id
    ORDER BY c.created_at DESC
    LIMIT 5
  `

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Candidats Récents</h2>
        <Link href="/wfm/candidates">
          <Button variant="outline" size="sm" className="border-border hover:bg-muted bg-transparent">
            Voir tout
          </Button>
        </Link>
      </div>
      <div className="space-y-4">
        {candidates.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Aucun candidat enregistré</p>
        ) : (
          candidates.map((candidate: any) => (
            <div key={candidate.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-foreground">{candidate.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {candidate.metier} • {candidate.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {candidate.final_decision && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      candidate.final_decision === "RECRUTÉ" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {candidate.final_decision}
                  </span>
                )}
                <Link href={`/wfm/candidates/${candidate.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    Modifier
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
