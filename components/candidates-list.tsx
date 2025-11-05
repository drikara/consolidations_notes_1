// components/candidates-list.tsx
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

interface CandidatesListProps {
  candidates: Candidate[]
}

export function CandidatesList({ candidates }: CandidatesListProps) {
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

  const getStatusColor = (decision: string | undefined) => {
    switch (decision) {
      case "RECRUTE":
        return "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200"
      case "NON_RECRUTE":
        return "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200"
      default:
        return "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200"
    }
  }

  const getScoreColor = (score: string) => {
    if (score === 'N/A') return 'text-gray-500'
    const numericValue = parseFloat(score)
    if (numericValue >= 16) return 'text-emerald-600'
    if (numericValue >= 12) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche et filtres */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
              Liste des Candidats
            </h1>
            <p className="text-orange-700">
              {filteredCandidates.length} candidat{filteredCandidates.length > 1 ? 's' : ''} sur {candidates.length}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full lg:w-auto">
            <div className="lg:col-span-2 relative">
              <Input
                placeholder="Rechercher un candidat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <Select value={metierFilter} onValueChange={setMetierFilter}>
              <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white">
                <SelectValue placeholder="Métier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="rounded-lg">Tous les métiers</SelectItem>
                {metiers.map((metier) => (
                  <SelectItem key={metier} value={metier} className="rounded-lg">
                    {metier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value} className="rounded-lg">
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="rounded-lg">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="border-2 border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 rounded-xl min-w-12 transition-all duration-200"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des candidats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCandidates.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border-2 border-dashed border-orange-200">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-orange-600 text-xl font-semibold mb-2">Aucun candidat trouvé</h3>
            <p className="text-orange-500">
              Aucun candidat ne correspond à vos critères de recherche
            </p>
          </div>
        ) : (
          filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-xl hover:border-orange-200 transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* En-tête avec avatar */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                    {candidate.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-700 transition-colors truncate">
                      {candidate.full_name}
                    </h3>
                    <p className="text-orange-600 font-medium text-sm truncate">{candidate.metier}</p>
                    <p className="text-gray-500 text-xs truncate">{candidate.email}</p>
                  </div>
                </div>

                {/* Scores rapides */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="text-xs text-orange-600 font-medium mb-1">Qualité vocale</div>
                    <div className={`font-bold text-sm ${getScoreColor(getScoreDisplay(candidate, 'voice_quality'))}`}>
                      {getScoreDisplay(candidate, 'voice_quality')}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="text-xs text-orange-600 font-medium mb-1">Comm. verbale</div>
                    <div className={`font-bold text-sm ${getScoreColor(getScoreDisplay(candidate, 'verbal_communication'))}`}>
                      {getScoreDisplay(candidate, 'verbal_communication')}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="text-xs text-orange-600 font-medium mb-1">Frappe</div>
                    <div className={`font-bold text-sm ${getScoreColor(getScoreDisplay(candidate, 'typing_speed'))}`}>
                      {getScoreDisplay(candidate, 'typing_speed')}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="text-xs text-orange-600 font-medium mb-1">Précision</div>
                    <div className={`font-bold text-sm ${getScoreColor(getScoreDisplay(candidate, 'typing_accuracy'))}`}>
                      {getScoreDisplay(candidate, 'typing_accuracy')}
                    </div>
                  </div>
                </div>

                {/* Statut et actions principales */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(candidate.final_decision)}`}>
                    {candidate.final_decision || "En cours"}
                  </span>

                  <Link href={`/wfm/candidates/${candidate.id}`}>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl px-4 font-semibold"
                    >
                      Voir détails
                    </Button>
                  </Link>
                </div>

                {/* Actions rapides */}
                <div className="flex justify-center gap-4 pt-2 border-t border-orange-100">
                  <Link 
                    href={`/wfm/candidates/${candidate.id}/edit`}
                    className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 font-medium transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modifier
                  </Link>
                  <Link 
                    href={`/wfm/scores/${candidate.id}`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Notes
                  </Link>
                  <Link 
                    href={`/wfm/candidates/${candidate.id}/consolidation`}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Consolidation
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}