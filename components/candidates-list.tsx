"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Candidate = {
  id: number
  full_name: string
  phone: string
  email: string
  metier: string
  availability: string
  final_decision?: string
}

export function CandidatesList({ candidates }: { candidates: Candidate[] }) {
  const [search, setSearch] = useState("")
  const [metierFilter, setMetierFilter] = useState("all")

  const metiers = [
    "Call Center",
    "Agences",
    "Bo Réclam",
    "Télévente",
    "Réseaux Sociaux",
    "Supervision",
    "Bot Cognitive Trainer",
    "SMC Fixe & Mobile",
  ]

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.full_name.toLowerCase().includes(search.toLowerCase()) ||
      candidate.email.toLowerCase().includes(search.toLowerCase()) ||
      candidate.phone.includes(search)
    const matchesMetier = metierFilter === "all" || candidate.metier === metierFilter
    return matchesSearch && matchesMetier
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Rechercher par nom, email ou téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border-border focus:ring-primary"
        />
        <Select value={metierFilter} onValueChange={setMetierFilter}>
          <SelectTrigger className="w-full sm:w-64 border-border focus:ring-primary">
            <SelectValue placeholder="Filtrer par métier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les métiers</SelectItem>
            {metiers.map((metier) => (
              <SelectItem key={metier} value={metier}>
                {metier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Candidat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Métier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Disponibilité
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
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
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
                      <p className="text-sm text-foreground">{candidate.email}</p>
                      <p className="text-sm text-muted-foreground">{candidate.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                        {candidate.metier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{candidate.availability}</td>
                    <td className="px-6 py-4">
                      {candidate.final_decision ? (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            candidate.final_decision === "RECRUTÉ"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {candidate.final_decision}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          En cours
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/wfm/scores/${candidate.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-muted">
                          Notes
                        </Button>
                      </Link>
                      <Link href={`/wfm/candidates/${candidate.id}/edit`}>
                        <Button variant="ghost" size="sm" className="hover:bg-muted">
                          Modifier
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
