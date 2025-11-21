// components/scores-list.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Candidate = {
  id: number
  full_name: string
  metier: string
  email: string
  final_decision?: string
  created_at: string
  phone?: string
  scores?: {
    voice_quality?: number | null
    verbal_communication?: number | null
    psychotechnical_test?: number | null
    typing_speed?: number | null
    typing_accuracy?: number | null
    excel_test?: number | null
    dictation?: number | null
    sales_simulation?: number | null
    analysis_exercise?: number | null
    phase1_decision?: string | null
    phase2_ff_decision?: string | null
  } | null
}

interface ScoresListProps {
  candidates: Candidate[]
}

export function ScoresList({ candidates }: ScoresListProps) {
  const [search, setSearch] = useState("")
  const [metierFilter, setMetierFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("full_name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

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

  const statuses = [
    { value: "all", label: "Tous les statuts" },
    { value: "admis", label: "Admis" },
    { value: "elimine", label: "Éliminés" },
    { value: "en_cours", label: "En cours" },
  ]

  const sortOptions = [
    { value: "full_name", label: "Nom" },
    { value: "metier", label: "Métier" },
    { value: "created_at", label: "Date d'ajout" },
    { value: "final_decision", label: "Statut" },
    { value: "voice_quality", label: "Qualité vocale" },
    { value: "verbal_communication", label: "Communication verbale" },
    { value: "psychotechnical_test", label: "Test psychotechnique" },
    { value: "typing_speed", label: "Vitesse de frappe" },
    { value: "typing_accuracy", label: "Précision de frappe" },
    { value: "excel_test", label: "Test Excel" },
    { value: "dictation", label: "Dictée" },
    { value: "sales_simulation", label: "Simulation vente" },
    { value: "analysis_exercise", label: "Exercice analyse" },
  ]

  const filteredCandidates = candidates
    .filter((candidate) => {
      const matchesSearch =
        candidate.full_name.toLowerCase().includes(search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(search.toLowerCase())
      
      const matchesMetier = metierFilter === "all" || candidate.metier === metierFilter
      
      const matchesStatus = 
        statusFilter === "all" ? true :
        statusFilter === "admis" ? candidate.final_decision === "RECRUTE" :
        statusFilter === "elimine" ? candidate.final_decision === "NON_RECRUTE" :
        statusFilter === "en_cours" ? !candidate.final_decision : true

      return matchesSearch && matchesMetier && matchesStatus
    })
    .sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortBy in a && sortBy in b) {
        aValue = a[sortBy as keyof Candidate]
        bValue = b[sortBy as keyof Candidate]
      } else {
        aValue = a.scores?.[sortBy as keyof typeof a.scores]
        bValue = b.scores?.[sortBy as keyof typeof b.scores]
      }

      if (sortBy === "created_at") {
        aValue = new Date(aValue || 0)
        bValue = new Date(bValue || 0)
      }

      if (aValue === bValue) return 0
      if (aValue == null) return sortOrder === "asc" ? -1 : 1
      if (bValue == null) return sortOrder === "asc" ? 1 : -1

      const comparison = aValue < bValue ? -1 : 1
      return sortOrder === "asc" ? comparison : -comparison
    })

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A'
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return Number(numValue).toFixed(2)
  }

  const getScoreDisplay = (candidate: Candidate, scoreType: string) => {
    const score = candidate.scores?.[scoreType as keyof typeof candidate.scores]
    if (score === null || score === undefined) return 'N/A'
    
    const numericScore = typeof score === 'string' ? parseFloat(score) : score
    
    switch (scoreType) {
      case 'typing_speed':
        return `${numericScore} MPM`
      case 'typing_accuracy':
        return `${formatNumber(numericScore)}%`
      default:
        return `${formatNumber(numericScore)}/20`
    }
  }

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-gray-500'
    const numScore = typeof score === 'string' ? parseFloat(score) : score
    if (numScore >= 16) return 'text-green-600'
    if (numScore >= 12) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <Input
            placeholder="Rechercher un candidat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-2 border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl"
          />
        </div>
        
        <Select value={metierFilter} onValueChange={setMetierFilter}>
          <SelectTrigger className="border-2 border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl">
            <SelectValue placeholder="Métier" />
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="border-2 border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="border-2 border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="border-2 border-gray-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 rounded-xl transition-all duration-200"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      {/* Indicateur de résultats */}
      <div className="text-sm text-gray-600 bg-orange-25 px-4 py-2 rounded-xl border border-orange-200">
        {filteredCandidates.length} candidat{filteredCandidates.length > 1 ? 's' : ''} trouvé{filteredCandidates.length > 1 ? 's' : ''}
      </div>

      {/* Grille des candidats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">Aucun candidat trouvé</p>
            <p className="text-gray-400 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-orange-300 transition-all duration-200"
            >
              <div className="space-y-4">
                {/* En-tête */}
                <div>
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{candidate.full_name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg">
                      {candidate.metier}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{candidate.email}</p>
                  {candidate.phone && (
                    <p className="text-sm text-gray-500">{candidate.phone}</p>
                  )}
                </div>

                {/* Scores rapides */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 text-xs">Qualité vocale:</span>
                    <div className={`font-medium ${getScoreColor(candidate.scores?.voice_quality)}`}>
                      {getScoreDisplay(candidate, 'voice_quality')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Comm. verbale:</span>
                    <div className={`font-medium ${getScoreColor(candidate.scores?.verbal_communication)}`}>
                      {getScoreDisplay(candidate, 'verbal_communication')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Frappe:</span>
                    <div className={`font-medium ${getScoreColor(candidate.scores?.typing_speed)}`}>
                      {getScoreDisplay(candidate, 'typing_speed')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs">Précision:</span>
                    <div className={`font-medium ${getScoreColor(candidate.scores?.typing_accuracy)}`}>
                      {getScoreDisplay(candidate, 'typing_accuracy')}
                    </div>
                  </div>
                </div>

                {/* Statut et actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 cursor-pointer">
                  {candidate.final_decision ? (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        candidate.final_decision === "RECRUTE" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {candidate.final_decision === "RECRUTE" ? "Admis" : "Éliminé"}
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      En cours
                    </span>
                  )}

                  <Link href={`/wfm/scores/${candidate.id}`}>
                    <Button 
                      size="sm" 
                      className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                    >
                      Gérer les Notes
                    </Button>
                  </Link>
                </div>

                {/* Indicateur de complétion des scores */}
                {candidate.scores && (
                  <div className="text-xs text-gray-500 flex items-center justify-between">
                    <span>Progression des scores:</span>
                    <span className="font-medium">
                      {Object.values(candidate.scores).filter(score => score !== null && score !== undefined).length} /
                      {Object.keys(candidate.scores).length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}