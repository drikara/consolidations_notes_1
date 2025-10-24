"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Candidate = {
  id: number
  full_name: string
  metier: string
  my_score?: number
  evaluated_phase?: number
}

export function JuryEvaluationsList({
  candidates,
  juryMemberId,
}: {
  candidates: Candidate[]
  juryMemberId: number
}) {
  const [search, setSearch] = useState("")

  const filteredCandidates = candidates.filter((candidate) =>
    candidate.full_name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher un candidat..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md border-border focus:ring-primary"
      />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Candidat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Métier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun candidat trouvé
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{candidate.full_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                        {candidate.metier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {candidate.my_score ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Évalué ({candidate.my_score}/5)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/jury/evaluations/${candidate.id}`}>
                        <Button size="sm" className="bg-primary hover:bg-accent text-primary-foreground">
                          {candidate.my_score ? "Modifier" : "Évaluer"}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
