//components/jury-evaluations-list.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  User, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Clock,
  Edit,
  Star,
  Filter,
  CheckCircle2,
  XCircle,
  Search
} from 'lucide-react'

interface Candidate {
  id: number
  fullName: string
  metier: string
  age: number
  diploma: string
  location: string
  availability: string
  interviewDate: Date | null
  session: {
    metier: string
    date: Date
  } | null
  scores: {
    finalDecision: string | null
    callStatus: string | null
  } | null
  myScore: {
    score: number
    phase: number
    evaluatedAt: Date
  } | null
  evaluationStatus: 'not_evaluated' | 'phase1_only' | 'both_phases' | string
}

interface JuryEvaluationsListProps {
  candidates: Candidate[]
  juryMemberId: number
}

export function JuryEvaluationsList({ candidates, juryMemberId }: JuryEvaluationsListProps) {
  const [filter, setFilter] = useState<'all' | 'evaluated' | 'pending'>('all')
  const [search, setSearch] = useState('')

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.fullName.toLowerCase().includes(search.toLowerCase()) ||
                         candidate.metier.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' ? true : 
                         filter === 'evaluated' ? candidate.myScore : 
                         !candidate.myScore
    return matchesSearch && matchesFilter
  })

  const getEvaluationBadge = (candidate: Candidate) => {
    switch (candidate.evaluationStatus) {
      case 'not_evaluated':
        return { 
          label: 'À évaluer', 
          color: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200',
          icon: Clock
        }
      case 'phase1_only':
        return { 
          label: 'Phase 1', 
          color: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
          icon: Star
        }
      case 'both_phases':
        return { 
          label: 'Complète', 
          color: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
          icon: CheckCircle2
        }
      default:
        return { 
          label: 'À évaluer', 
          color: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200',
          icon: Clock
        }
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200'
    if (score >= 3) return 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200'
    return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200'
  }

  const getFinalDecisionColor = (decision: string) => {
    if (decision === 'ADMIS') return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200'
    if (decision === 'NON_ADMIS') return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200'
    return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-200'
  }

  return (
    <div className="space-y-6">
      {/* En-tête principal */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Évaluations des Candidats
              </h1>
              <p className="text-orange-700">
                {filteredCandidates.length} candidat(s) sur {candidates.length}
              </p>
            </div>
          </div>
          
          {/* Barre de recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-400" />
            <input
              type="text"
              placeholder="Rechercher un candidat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-6 border-2 border-orange-100 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              filter === 'all'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-white text-gray-700 border-2 border-orange-200 hover:border-orange-300 hover:text-orange-700'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Tous les candidats</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold min-w-6">
              {candidates.length}
            </span>
          </button>
          
          <button
            onClick={() => setFilter('evaluated')}
            className={`flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              filter === 'evaluated'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-white text-gray-700 border-2 border-orange-200 hover:border-orange-300 hover:text-orange-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Évalués</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold min-w-6">
              {candidates.filter(c => c.myScore).length}
            </span>
          </button>
          
          <button
            onClick={() => setFilter('pending')}
            className={`flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              filter === 'pending'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                : 'bg-white text-gray-700 border-2 border-orange-200 hover:border-orange-300 hover:text-orange-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>En attente</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold min-w-6">
              {candidates.filter(c => !c.myScore).length}
            </span>
          </button>
        </div>
      </div>

      {/* Liste des candidats */}
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-orange-100 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-orange-400" />
            </div>
            <h3 className="text-orange-600 text-xl font-semibold mb-2">Aucun candidat correspondant</h3>
            <p className="text-orange-500">
              {search ? 'Aucun candidat ne correspond à votre recherche' : 
               filter === 'all' ? "Aucun candidat n'est disponible pour évaluation" :
               `Aucun candidat ${filter === 'evaluated' ? 'évalué' : 'en attente'}`}
            </p>
          </div>
        ) : (
          filteredCandidates.map(candidate => {
            const evaluationBadge = getEvaluationBadge(candidate)
            const BadgeIcon = evaluationBadge.icon
            
            return (
              <div key={candidate.id} className="bg-white rounded-2xl border-2 border-orange-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-orange-200 group">
                <div className="flex items-start justify-between">
                  {/* Informations du candidat */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                        {candidate.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          <h3 className="font-bold text-xl text-gray-900 group-hover:text-orange-700 transition-colors">
                            {candidate.fullName}
                          </h3>
                          
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 ${evaluationBadge.color}`}>
                            <BadgeIcon className="w-4 h-4" />
                            {evaluationBadge.label}
                          </span>

                          {/* Score actuel */}
                          {candidate.myScore && (
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 ${getScoreColor(candidate.myScore.score)}`}>
                              <Star className="w-4 h-4" />
                              {candidate.myScore.score}/5 (Phase {candidate.myScore.phase})
                            </span>
                          )}
                        </div>

                        {/* Informations principales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-3 text-gray-700 bg-orange-50 px-4 py-3 rounded-xl border border-orange-200">
                            <User className="w-5 h-5 text-orange-500" />
                            <span className="font-medium">{candidate.metier}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-gray-700 bg-orange-50 px-4 py-3 rounded-xl border border-orange-200">
                            <Calendar className="w-5 h-5 text-orange-500" />
                            <span>{candidate.age} ans</span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-gray-700 bg-orange-50 px-4 py-3 rounded-xl border border-orange-200">
                            <GraduationCap className="w-5 h-5 text-orange-500" />
                            <span className="truncate">{candidate.diploma}</span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-gray-700 bg-orange-50 px-4 py-3 rounded-xl border border-orange-200">
                            <MapPin className="w-5 h-5 text-orange-500" />
                            <span>{candidate.location}</span>
                          </div>
                        </div>

                        {/* Informations secondaires */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-orange-200">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span>Disponibilité: {candidate.availability}</span>
                          </div>

                          {candidate.session && (
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-orange-200">
                              <Calendar className="w-4 h-4 text-orange-500" />
                              <span>
                                Session {candidate.session.metier} - {candidate.session.date.toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          )}

                          {candidate.myScore && (
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-orange-200">
                              <Calendar className="w-4 h-4 text-orange-500" />
                              <span>
                                Évalué le {candidate.myScore.evaluatedAt.toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions et statut final */}
                  <div className="flex flex-col gap-3 ml-6 min-w-[160px]">
                    <Link
                      href={`/jury/evaluations/${candidate.id}`}
                      className={`flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                        candidate.myScore
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
                          : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                      {candidate.myScore ? 'Modifier' : 'Évaluer'}
                    </Link>
                    
                    {candidate.scores?.finalDecision && (
                      <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold ${getFinalDecisionColor(candidate.scores.finalDecision)}`}>
                        {candidate.scores.finalDecision === 'ADMIS' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                        <span>{candidate.scores.finalDecision}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}