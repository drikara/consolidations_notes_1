'use client'

import { useState } from 'react'
import { Metier, SessionStatus } from '@prisma/client'
import Link from 'next/link'

// Type local temporaire jusqu'à ce que Prisma génère AgenceType
type AgenceType = 'ABIDJAN' | 'INTERIEUR'

interface Session {
  id: string
  metier: Metier
  date: Date
  jour: string
  status: SessionStatus
  description?: string | null
  location?: string | null
  agenceType?: AgenceType | null
  _count: {
    candidates: number
    juryPresences: number
  }
  candidates: Array<{
    id: number
    fullName: string
    metier: Metier
    scores?: {
      finalDecision: string | null
    } | null
  }>
}

interface SessionsListProps {
  sessions: Session[]
}

export function SessionsList({ sessions }: SessionsListProps) {
  const [filterStatus, setFilterStatus] = useState<SessionStatus | 'all'>('all')
  const [filterMetier, setFilterMetier] = useState<Metier | 'all'>('all')
  const [filterAgenceType, setFilterAgenceType] = useState<AgenceType | 'all'>('all')
  const [loading, setLoading] = useState<string | null>(null)

  const filteredSessions = sessions.filter((session) => {
    if (filterStatus !== 'all' && session.status !== filterStatus) return false
    if (filterMetier !== 'all' && session.metier !== filterMetier) return false
    if (
      filterMetier === 'AGENCES' &&
      filterAgenceType !== 'all' &&
      session.agenceType !== filterAgenceType
    )
      return false
    return true
  })

  const handleDelete = async (sessionId: string) => {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible.'
      )
    ) {
      return
    }

    setLoading(sessionId)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      window.location.reload()
    } catch (error) {
      console.error('Erreur:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la suppression de la session'
      )
    } finally {
      setLoading(null)
    }
  }

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'PLANIFIED':
        return 'bg-linear-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200'
      case 'IN_PROGRESS':
        return 'bg-linear-to-r from-green-100 to-emerald-100 text-green-700 border-green-200'
      case 'COMPLETED':
        return 'bg-linear-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-200'
      case 'CANCELLED':
        return 'bg-linear-to-r from-red-100 to-pink-100 text-red-700 border-red-200'
      default:
        return 'bg-linear-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-200'
    }
  }

  const getRecruitedCount = (session: Session) => {
    return session.candidates.filter((c) => c.scores?.finalDecision === 'RECRUTE').length
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <div className="bg-linear-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Sessions d'Évaluation
              </h1>
              <p className="text-orange-700">
                {filteredSessions.length} session
                {filteredSessions.length > 1 ? 's' : ''} sur {sessions.length}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Filtre Statut */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-orange-700">Statut:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as SessionStatus | 'all')}
                className="p-2 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white text-sm"
              >
                <option value="all">Tous</option>
                <option value="PLANIFIED">Planifié</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="COMPLETED">Terminé</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>

            {/* Filtre Métier */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-orange-700">Métier:</label>
              <select
                value={filterMetier}
                onChange={(e) => {
                  const value = e.target.value as Metier | 'all'
                  setFilterMetier(value)
                  if (value !== 'AGENCES') setFilterAgenceType('all')
                }}
                className="p-2 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white text-sm"
              >
                <option value="all">Tous</option>
                {Object.values(Metier).map((metier) => (
                  <option key={metier} value={metier}>
                    {metier}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre Type d'agence (conditionnel) */}
            {filterMetier === 'AGENCES' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-orange-700">Type d'agence:</label>
                <select
                  value={filterAgenceType}
                  onChange={(e) => setFilterAgenceType(e.target.value as AgenceType | 'all')}
                  className="p-2 border-2 border-orange-200 focus:border-orange-400 rounded-xl bg-white text-sm"
                >
                  <option value="all">Tous</option>
                  <option value="ABIDJAN">Abidjan</option>
                  <option value="INTERIEUR">Intérieur</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Liste des sessions */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-orange-200 p-12 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-orange-600 text-xl font-semibold mb-2">Aucune session correspondante</h3>
            <p className="text-orange-500">
              Aucune session ne correspond à vos critères de filtrage
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl border-2 border-orange-100 p-6 hover:shadow-xl hover:border-orange-200 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {session.metier
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{session.metier}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(
                            session.status
                          )}`}
                        >
                          {session.status}
                        </span>
                        <span className="text-orange-600 font-medium">
                          {new Date(session.date).toLocaleDateString('fr-FR')} ({session.jour})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                      </svg>
                      {session.location || 'Non spécifié'}
                    </div>

                    {/* Affichage du type d'agence */}
                    {session.metier === 'AGENCES' && session.agenceType && (
                      <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        <span>
                          Agence {session.agenceType === 'ABIDJAN' ? 'Abidjan' : 'Intérieur'}
                        </span>
                      </div>
                    )}
                  </div>

                  {session.description && (
                    <p className="text-sm text-gray-600 mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      {session.description}
                    </p>
                  )}

                  {/* Statistiques */}
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-linear-to-r from-blue-50 to-cyan-50 px-4 py-2 rounded-xl border border-blue-200">
                      <div className="text-lg font-bold text-blue-600">{session._count.candidates}</div>
                      <div className="text-xs text-blue-700 font-medium">Candidats</div>
                    </div>
                    <div className="bg-linear-to-r from-emerald-50 to-green-50 px-4 py-2 rounded-xl border border-emerald-200">
                      <div className="text-lg font-bold text-emerald-600">
                        {getRecruitedCount(session)}
                      </div>
                      <div className="text-xs text-emerald-700 font-medium">Recrutés</div>
                    </div>
                    <div className="bg-linear-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-xl border border-purple-200">
                      <div className="text-lg font-bold text-purple-600">
                        {session._count.juryPresences}
                      </div>
                      <div className="text-xs text-purple-700 font-medium">Jurys</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/wfm/sessions/${session.id}`}
                    className="flex items-center gap-2 bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm text-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Voir
                  </Link>
                  <Link
                    href={`/api/export/session/${session.id}`}
                    className="flex items-center gap-2 bg-linear-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm text-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Exporter
                  </Link>
                  <Link
                    href={`/wfm/sessions/${session.id}/edit`}
                    className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm text-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Modifier
                  </Link>
                  <button
                    onClick={() => handleDelete(session.id)}
                    disabled={loading === session.id}
                    className="flex items-center gap-2 bg-linear-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm text-center disabled:opacity-50"
                  >
                    {loading === session.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Supprimer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}