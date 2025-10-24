"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Candidate = {
  id: number
  full_name: string
  metier: string
  email: string
  final_decision?: string
}

export function ScoresList({ candidates }: { candidates: Candidate[] }) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCandidates.map((candidate) => (
          <div
            key={candidate.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-foreground text-lg">{candidate.full_name}</h3>
                <p className="text-sm text-muted-foreground">{candidate.metier}</p>
              </div>
              {candidate.final_decision && (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    candidate.final_decision === "RECRUTÉ" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {candidate.final_decision}
                </span>
              )}
              <Link href={`/wfm/scores/${candidate.id}`}>
                <Button className="w-full bg-primary hover:bg-accent text-primary-foreground">Gérer les Notes</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
