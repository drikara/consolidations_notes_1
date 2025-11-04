// app/wfm/sessions/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { useSession } from '@/lib/auth-client'
import Link from 'next/link'

interface RecruitmentSession {
  id: string
  metier: string
  date: string
  jour: string
  status: string
  description: string | null
  location: string | null
  _count: {
    candidates: number
    juryPresences: number
  }
  candidates: Array<{
    id: string
    fullName: string
    metier: string
  }>
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<RecruitmentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session, isPending: sessionLoading } = useSession()

  // États pour les filtres
  const [filters, setFilters] = useState({
    metier: '',
    mois: '',
    annee: '',
    jour: '',
    statut: ''
  })

  useEffect(() => {
    if (session) {
      fetchSessions()
    }
  }, [session])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sessions')
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des sessions')
      }
      
      const data = await response.json()
      setSessions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour extraire les métiers uniques
  const getUniqueMetiers = () => {
    const metiers = sessions.map(s => s.metier)
    return [...new Set(metiers)].sort()
  }

  // Fonction pour extraire les années uniques
  const getUniqueAnnees = () => {
    const annees = sessions.map(s => new Date(s.date).getFullYear())
    return [...new Set(annees)].sort((a, b) => b - a)
  }

  // Fonction pour extraire les jours uniques
  const getUniqueJours = () => {
    const jours = sessions.map(s => s.jour)
    return [...new Set(jours)].sort()
  }

  // Fonction de filtrage
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.date)
    const sessionMois = (sessionDate.getMonth() + 1).toString()
    const sessionAnnee = sessionDate.getFullYear().toString()

    return (
      (filters.metier === '' || session.metier === filters.metier) &&
      (filters.mois === '' || sessionMois === filters.mois) &&
      (filters.annee === '' || sessionAnnee === filters.annee) &&
      (filters.jour === '' || session.jour === filters.jour) &&
      (filters.statut === '' || session.status === filters.statut)
    )
  })

  // Générer les options de mois
  const moisOptions = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ]

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse p-8">Chargement...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-red-600">Non authentifié</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        user={{
          name: session.user?.name || 'Utilisateur',
          email: session.user?.email || '',
          role: (session.user as any)?.role
        }}
        role={(session.user as any)?.role}
      />
      
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* En-tête avec bouton d'ajout */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sessions de Recrutement</h1>
              <p className="text-gray-600 mt-2">Gestion des sessions de recrutement WFM</p>
            </div>
            <Link
              href="/wfm/sessions/new"
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2 shadow-md"
            >
              <span className="text-lg">+</span>
              <span>Nouvelle Session</span>
            </Link>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Filtre Métier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Métier
                </label>
                <select
                  value={filters.metier}
                  onChange={(e) => setFilters(prev => ({ ...prev, metier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Tous les métiers</option>
                  {getUniqueMetiers().map(metier => (
                    <option key={metier} value={metier}>{metier}</option>
                  ))}
                </select>
              </div>

              {/* Filtre Mois */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mois
                </label>
                <select
                  value={filters.mois}
                  onChange={(e) => setFilters(prev => ({ ...prev, mois: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Tous les mois</option>
                  {moisOptions.map(mois => (
                    <option key={mois.value} value={mois.value}>{mois.label}</option>
                  ))}
                </select>
              </div>

              {/* Filtre Année */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année
                </label>
                <select
                  value={filters.annee}
                  onChange={(e) => setFilters(prev => ({ ...prev, annee: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Toutes les années</option>
                  {getUniqueAnnees().map(annee => (
                    <option key={annee} value={annee.toString()}>{annee}</option>
                  ))}
                </select>
              </div>

              {/* Filtre Jour */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jour
                </label>
                <select
                  value={filters.jour}
                  onChange={(e) => setFilters(prev => ({ ...prev, jour: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Tous les jours</option>
                  {getUniqueJours().map(jour => (
                    <option key={jour} value={jour}>{jour}</option>
                  ))}
                </select>
              </div>

              {/* Filtre Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={filters.statut}
                  onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Tous les statuts</option>
                  <option value="PLANIFIED">Planifiée</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="COMPLETED">Terminée</option>
                </select>
              </div>
            </div>

            {/* Bouton réinitialiser les filtres */}
            {(filters.metier || filters.mois || filters.annee || filters.jour || filters.statut) && (
              <div className="mt-4">
                <button
                  onClick={() => setFilters({
                    metier: '',
                    mois: '',
                    annee: '',
                    jour: '',
                    statut: ''
                  })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>

          {/* Contenu principal */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="font-semibold">Erreur</div>
                <div>{error}</div>
                <button
                  onClick={fetchSessions}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {filteredSessions.length} session(s) trouvée(s)
                    {filteredSessions.length !== sessions.length && ` sur ${sessions.length}`}
                  </h2>
                  <button
                    onClick={fetchSessions}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                  >
                    <span>🔄</span>
                    <span>Actualiser</span>
                  </button>
                </div>
              </div>
              
              {filteredSessions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {sessions.length === 0 ? 'Aucune session de recrutement' : 'Aucune session correspond aux filtres'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {sessions.length === 0 
                      ? "Aucune session de recrutement n'a été créée pour le moment."
                      : "Essayez de modifier vos critères de recherche."
                    }
                  </p>
                  {sessions.length === 0 && (
                    <Link 
                      href="/wfm/sessions/new"
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors inline-block"
                    >
                      Créer une session
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Métier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jour
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidats
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jury
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <span className="text-orange-600 font-semibold text-sm">
                                  {session.metier.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {session.metier}
                                </div>
                                {session.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {session.description}
                                  </div>
                                )}
                                {session.location && (
                                  <div className="text-xs text-gray-400 flex items-center space-x-1">
                                    <span>📍</span>
                                    <span>{session.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(session.date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {session.jour}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                              session.status === 'PLANIFIED' 
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : session.status === 'IN_PROGRESS'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : session.status === 'COMPLETED'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              {session.status === 'PLANIFIED' && '🕐 Planifiée'}
                              {session.status === 'IN_PROGRESS' && '⚡ En cours'}
                              {session.status === 'COMPLETED' && '✅ Terminée'}
                              {!['PLANIFIED', 'IN_PROGRESS', 'COMPLETED'].includes(session.status) && session.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {session._count.candidates}
                              </span>
                              {session._count.candidates > 0 && (
                                <div className="flex -space-x-2">
                                  {session.candidates.slice(0, 3).map((candidate, index) => (
                                    <div
                                      key={candidate.id}
                                      className="w-6 h-6 bg-orange-200 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-orange-700"
                                      style={{ zIndex: 3 - index }}
                                      title={candidate.fullName}
                                    >
                                      {candidate.fullName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                  ))}
                                  {session._count.candidates > 3 && (
                                    <div className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                      +{session._count.candidates - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {session._count.juryPresences}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                                <span className="text-lg">👁️</span>
                              </button>
                              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <span className="text-lg">✏️</span>
                              </button>
                              <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <span className="text-lg">🗑️</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}