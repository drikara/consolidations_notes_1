'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/components/dashboard-header'
import { useSession } from '@/lib/auth-client'
import Link from 'next/link'
import { 
  Calendar,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  FileText,
  AlertCircle,
  Lock
} from 'lucide-react'

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
    scores?: {
      finalDecision: string | null
    } | null
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

  // État pour la suppression
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  // Fonction pour supprimer une session
  const handleDelete = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible et supprimera également tous les candidats et données associées.')) {
      return
    }

    setDeletingId(sessionId)
    try {
      console.log("🗑️ Tentative de suppression de la session:", sessionId)
      
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log("📡 Réponse du serveur:", response.status, response.statusText)

      const result = await response.json()
      console.log("📦 Données de réponse:", result)

      if (!response.ok) {
        throw new Error(result.error || `Erreur ${response.status}: ${response.statusText}`)
      }

      // Afficher un message de succès
      alert(result.message || 'Session supprimée avec succès!')
      
      // Recharger les sessions
      await fetchSessions()
      
    } catch (err) {
      console.error('❌ Erreur détaillée:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue lors de la suppression'
      alert(`Erreur: ${errorMessage}`)
    } finally {
      setDeletingId(null)
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PLANIFIED': 
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Clock className="w-3 h-3 mr-1.5" />,
          label: 'Planifiée'
        }
      case 'IN_PROGRESS':
        return {
          color: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: <RefreshCw className="w-3 h-3 mr-1.5" />,
          label: 'En cours'
        }
      case 'COMPLETED':
        return {
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: <CheckCircle className="w-3 h-3 mr-1.5" />,
          label: 'Terminée'
        }
      default:
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: <AlertCircle className="w-3 h-3 mr-1.5" />,
          label: status
        }
    }
  }

  const StatutBadge = ({ status }: { status: string }) => {
    const config = getStatusConfig(status)
    return (
      <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full border-2 ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-orange-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-orange-400" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600 mb-6">Veuillez vous connecter pour accéder à cette page.</p>
          <Link 
            href="/auth/login" 
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Lock className="w-4 h-4" />
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardHeader 
        user={{
          name: session.user?.name || 'Utilisateur',
          email: session.user?.email || '',
          role: (session.user as any)?.role
        }}
        role={(session.user as any)?.role}
      />
      
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* En-tête avec statistiques */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-800">Sessions de Recrutement</h1>
                    <p className="text-gray-600 mt-2 text-lg">Gérez l'ensemble des sessions de recrutement WFM</p>
                  </div>
                </div>
                
                {/* Statistiques rapides */}
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 min-w-[140px]">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <div className="text-2xl font-bold text-gray-800">{sessions.length}</div>
                    </div>
                    <div className="text-sm text-gray-600">Total sessions</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 min-w-[140px]">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-4 h-4 text-orange-500" />
                      <div className="text-2xl font-bold text-orange-600">
                        {sessions.filter(s => s.status === 'IN_PROGRESS').length}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">En cours</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 min-w-[140px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <div className="text-2xl font-bold text-blue-600">
                        {sessions.filter(s => s.status === 'PLANIFIED').length}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">Planifiées</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 min-w-[140px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <div className="text-2xl font-bold text-gray-800">
                        {sessions.reduce((acc, s) => acc + s._count.candidates, 0)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">Candidats total</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
              
                <Link
                  href="/wfm/sessions/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Nouvelle Session</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Filter className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Filtres et Recherche</h3>
                <p className="text-gray-500 text-sm mt-1">Affinez les résultats selon vos critères</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                {
                  label: "Métier",
                  value: filters.metier,
                  onChange: (value: string) => setFilters(prev => ({ ...prev, metier: value })),
                  options: [{ value: "", label: "Tous les métiers" }, ...getUniqueMetiers().map(metier => ({ value: metier, label: metier }))],
                  icon: <Users className="w-4 h-4 text-gray-400" />
                },
                {
                  label: "Mois",
                  value: filters.mois,
                  onChange: (value: string) => setFilters(prev => ({ ...prev, mois: value })),
                  options: [{ value: "", label: "Tous les mois" }, ...moisOptions],
                  icon: <Calendar className="w-4 h-4 text-gray-400" />
                },
                {
                  label: "Année",
                  value: filters.annee,
                  onChange: (value: string) => setFilters(prev => ({ ...prev, annee: value })),
                  options: [{ value: "", label: "Toutes les années" }, ...getUniqueAnnees().map(annee => ({ value: annee.toString(), label: annee.toString() }))],
                  icon: <Calendar className="w-4 h-4 text-gray-400" />
                },
                {
                  label: "Jour",
                  value: filters.jour,
                  onChange: (value: string) => setFilters(prev => ({ ...prev, jour: value })),
                  options: [{ value: "", label: "Tous les jours" }, ...getUniqueJours().map(jour => ({ value: jour, label: jour }))],
                  icon: <Clock className="w-4 h-4 text-gray-400" />
                },
                {
                  label: "Statut",
                  value: filters.statut,
                  onChange: (value: string) => setFilters(prev => ({ ...prev, statut: value })),
                  options: [
                    { value: "", label: "Tous les statuts" },
                    { value: "PLANIFIED", label: "Planifiée" },
                    { value: "IN_PROGRESS", label: "En cours" },
                    { value: "COMPLETED", label: "Terminée" }
                  ],
                  icon: <Filter className="w-4 h-4 text-gray-400" />
                }
              ].map((filter, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    {filter.icon}
                    {filter.label}
                  </label>
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white hover:border-gray-300"
                  >
                    {filter.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Bouton réinitialiser les filtres */}
            {(filters.metier || filters.mois || filters.annee || filters.jour || filters.statut) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setFilters({
                    metier: '',
                    mois: '',
                    annee: '',
                    jour: '',
                    statut: ''
                  })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-all duration-200 font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Réinitialiser les filtres</span>
                </button>
              </div>
            )}
          </div>

          {/* Contenu principal */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
                  <Calendar className="w-8 h-8 text-orange-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 mx-auto"></div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div className="font-semibold text-red-700 text-lg mb-2">Erreur de chargement</div>
                <div className="text-red-600 mb-6">{error}</div>
                <button
                  onClick={fetchSessions}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réessayer le chargement
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* En-tête du tableau */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {filteredSessions.length} session(s) trouvée(s)
                      </h2>
                      {filteredSessions.length !== sessions.length && (
                        <p className="text-gray-600 text-sm">
                          Filtrage appliqué sur {sessions.length} sessions au total
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {filteredSessions.length === 0 ? (
                <div className="px-8 py-16 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-600 mb-4">
                    {sessions.length === 0 ? 'Aucune session de recrutement' : 'Aucune session correspondante'}
                  </h3>
                  <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                    {sessions.length === 0 
                      ? "Commencez par créer votre première session de recrutement pour organiser vos candidats."
                      : "Aucune session ne correspond aux critères de filtrage sélectionnés."
                    }
                  </p>
                  {sessions.length === 0 && (
                    <Link 
                      href="/wfm/sessions/new"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-semibold"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Créer ma première session</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          { label: "Métier", className: "pl-8 pr-6 py-4" },
                          { label: "Date", className: "px-6 py-4" },
                          { label: "Jour", className: "px-6 py-4" },
                          { label: "Statut", className: "px-6 py-4" },
                          { label: "Candidats", className: "px-6 py-4" },
                          { label: "Jury", className: "px-6 py-4" },
                          { label: "Actions", className: "pr-8 pl-6 py-4" }
                        ].map((header, index) => (
                          <th 
                            key={index}
                            className={`text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${header.className}`}
                          >
                            {header.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredSessions.map((session) => (
                        <tr 
                          key={session.id} 
                          className="hover:bg-gradient-to-r hover:from-orange-25 hover:to-orange-50 transition-all duration-200 group"
                        >
                          <td className="pl-8 pr-6 py-6 whitespace-nowrap">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                <Users className="w-5 h-5 text-orange-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-gray-800 truncate">
                                  {session.metier}
                                </div>
                                {session.description && (
                                  <div className="text-sm text-gray-600 truncate max-w-xs mt-1">
                                    {session.description}
                                  </div>
                                )}
                                {session.location && (
                                  <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                                    <Calendar className="w-3 h-3 text-orange-500" />
                                    <span className="truncate">{session.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-800">
                              {new Date(session.date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-800 bg-gray-100 px-3 py-1.5 rounded-lg inline-block">
                              {session.jour}
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <StatutBadge status={session.status} />
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-800">
                                  {session._count.candidates}
                                </span>
                              </div>
                              {session._count.candidates > 0 && (
                                <div className="flex -space-x-2">
                                  {session.candidates.slice(0, 3).map((candidate, index) => (
                                    <div
                                      key={candidate.id}
                                      className="w-8 h-8 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-orange-700 shadow-sm"
                                      style={{ zIndex: 3 - index }}
                                      title={candidate.fullName}
                                    >
                                      <UserCheck className="w-3 h-3" />
                                    </div>
                                  ))}
                                  {session._count.candidates > 3 && (
                                    <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
                                      +{session._count.candidates - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                              <UserCheck className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-semibold text-gray-800">
                                {session._count.juryPresences}
                              </span>
                            </div>
                          </td>
                          <td className="pr-8 pl-6 py-6 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <Link 
                                href={`/wfm/sessions/${session.id}`}
                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 group/action"
                                title="Voir les détails"
                              >
                                <Eye className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                              </Link>
                              <Link
                                href={`/wfm/sessions/${session.id}/edit`}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group/action"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                              </Link>
                              <button 
                                onClick={() => handleDelete(session.id)}
                                disabled={deletingId === session.id}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group/action cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Supprimer"
                              >
                                {deletingId === session.id ? (
                                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 group-hover/action:scale-110 transition-transform" />
                                )}
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