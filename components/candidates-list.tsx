'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  Mail,
  Briefcase,
  Cake,
  Eye,
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Shield,
  Star,
  Award,
  Clock,
  Sparkles,
  PhoneCall,
  PhoneOff,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface CandidatesListProps {
  candidates?: any[]
  initialFilters?: {
    metier?: string
    status?: string
    search?: string
    sort?: string
  }
  statistics?: {
    total: number
    contacted: number
    recruited: number
    pending: number
  }
  metiers?: string[]
}

export function CandidatesList({ 
  candidates = [], 
  initialFilters = {},
  statistics = { total: 0, contacted: 0, recruited: 0, pending: 0 },
  metiers = []
}: CandidatesListProps) {
  const [filters, setFilters] = useState({
    metier: initialFilters.metier || 'all',
    status: initialFilters.status || 'all',
    search: initialFilters.search || '',
    sort: initialFilters.sort || 'newest'
  })

  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const handleDeleteCandidate = async (candidateId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce candidat ? Cette action est irréversible.')) {
      try {
        const response = await fetch(`/api/candidates/${candidateId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          window.location.reload()
        } else {
          alert('Erreur lors de la suppression')
        }
      } catch (error) {
        alert('Erreur lors de la suppression')
      }
    }
  }

  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    )
  }

  const filteredCandidates = useMemo(() => {
    // CORRECTION : Vérification que candidates est défini
    if (!candidates || !Array.isArray(candidates)) {
      return []
    }

    let result = candidates.filter(candidate => {
      // Vérifier si candidate existe
      if (!candidate) return false

      // ✅ Vérifier si le filtre n'est pas 'all'
      if (filters.metier && filters.metier !== 'all' && candidate.metier !== filters.metier) return false
      
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'RECRUTE' && candidate.scores?.finalDecision !== 'RECRUTE') return false
        if (filters.status === 'NON_RECRUTE' && candidate.scores?.finalDecision !== 'NON_RECRUTE') return false
        if (filters.status === 'CONTACTE' && candidate.scores?.callStatus !== 'CONTACTE') return false
        if (filters.status === 'NON_CONTACTE' && candidate.scores?.callStatus !== 'NON_CONTACTE') return false
        if (filters.status === 'RESISTANT' && candidate.scores?.callStatus !== 'RESISTANT') return false
        if (filters.status === 'CONFIRME' && candidate.scores?.callStatus !== 'CONFIRME') return false
        if (filters.status === 'EN_ATTENTE' && candidate.scores?.finalDecision) return false
      }
      
      if (filters.search) {
        const query = filters.search.toLowerCase()
        const searchableFields = [
          candidate.fullName?.toLowerCase(),
          candidate.email?.toLowerCase(),
          String(candidate.metier).toLowerCase(),
          candidate.location?.toLowerCase()
        ]
        return searchableFields.some(field => field?.includes(query))
      }
      
      return true
    })

    result.sort((a, b) => {
      switch (filters.sort) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'name_asc': return (a.fullName || '').localeCompare(b.fullName || '')
        case 'name_desc': return (b.fullName || '').localeCompare(a.fullName || '')
        case 'metier_asc': return String(a.metier).localeCompare(String(b.metier))
        case 'metier_desc': return String(b.metier).localeCompare(String(a.metier))
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return result
  }, [candidates, filters])

  const getStatusColor = (status: string, type: 'final' | 'call' = 'final') => {
    const colors = {
      RECRUTE: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25',
      NON_RECRUTE: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25',
      CONTACTE: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/25',
      NON_CONTACTE: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25',
      RESISTANT: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 shadow-lg shadow-yellow-500/25',
      CONFIRME: 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25',
      EN_ATTENTE: 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/25'
    }
    return colors[status as keyof typeof colors] || 
      (type === 'final' 
        ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/25'
        : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 shadow-lg shadow-yellow-500/25')
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      RECRUTE: <Award className="w-4 h-4" />,
      NON_RECRUTE: <XCircle className="w-4 h-4" />,
      CONTACTE: <PhoneCall className="w-4 h-4" />,
      NON_CONTACTE: <PhoneOff className="w-4 h-4" />,
      RESISTANT: <Shield className="w-4 h-4" />,
      CONFIRME: <CheckCircle2 className="w-4 h-4" />,
      EN_ATTENTE: <Clock className="w-4 h-4" />
    }
    return icons[status as keyof typeof icons] || <User className="w-4 h-4" />
  }

  const formatDate = (date: Date) => {
    if (!date) return "Non défini"
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    if (!name) return "??"
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // CORRECTION : Vérification de sécurité avant le rendu
  if (!candidates) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <User className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chargement des candidats...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
      {/* En-tête avec statistiques */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              Gestion des Candidats
            </h1>
            <p className="text-gray-600 mt-2">Suivez et gérez l'ensemble de vos candidats</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/wfm/candidates/new"
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              <Plus className="w-5 h-5" />
              Nouveau Candidat
            </Link>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Candidats</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Contactés</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.contacted}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <PhoneCall className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Recrutés</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.recruited}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">En Attente</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.pending}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de filtres et recherche */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            {/* Recherche avec effet glass */}
            <div className="relative flex-1 min-w-[280px]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm"></div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un candidat..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-12 pr-6 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>

            {/* Bouton filtre mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 bg-white text-gray-700 px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
            >
              <Filter className="w-5 h-5" />
              Filtres
            </button>

            {/* Filtres desktop */}
            <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col sm:flex-row gap-4 flex-1`}>
              <select 
                value={filters.metier}
                onChange={(e) => setFilters(prev => ({ ...prev, metier: e.target.value }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[200px] transition-all duration-200"
              >
                <option value="all">Tous les métiers</option>
                {metiers.map(metier => (
                  <option key={metier} value={metier}>{metier}</option>
                ))}
              </select>

              <select 
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[200px] transition-all duration-200"
              >
                <option value="all">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="CONTACTE">Contacté</option>
                <option value="RESISTANT">Résistant</option>
                <option value="CONFIRME">Confirmé</option>
                <option value="NON_CONTACTE">Non contacté</option>
                <option value="RECRUTE">Recruté</option>
                <option value="NON_RECRUTE">Non recruté</option>
              </select>

              <select 
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[200px] transition-all duration-200"
              >
                <option value="newest">Plus récent</option>
                <option value="oldest">Plus ancien</option>
                <option value="name_asc">Nom A-Z</option>
                <option value="name_desc">Nom Z-A</option>
                <option value="metier_asc">Métier A-Z</option>
                <option value="metier_desc">Métier Z-A</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des candidats */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Candidats</h2>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                    {filteredCandidates.length} candidat(s)
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>Total: {statistics.total}</span>
                  {(filters.metier !== 'all' || filters.status !== 'all' || filters.search) && (
                    <span className="text-blue-600 font-medium ml-2">(résultats filtrés)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun candidat trouvé</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {candidates.length === 0 
                ? "Commencez par ajouter votre premier candidat pour le voir apparaître ici" 
                : "Aucun candidat ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
              }
            </p>
            {candidates.length === 0 && (
              <Link
                href="/wfm/candidates/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl mt-6"
              >
                <Plus className="w-5 h-5" />
                Ajouter un candidat
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200/60">
            {filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="p-8 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20 transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  {/* Checkbox de sélection */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="pt-3">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={() => toggleCandidateSelection(candidate.id)}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                      />
                    </div>

                    {/* Avatar avec gradient */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
                        {getInitials(candidate.fullName)}
                      </div>
                      {candidate.scores?.finalDecision === 'RECRUTE' && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                          <Star className="w-3 h-3 text-white fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Informations du candidat */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-gray-800 transition-colors">
                          {candidate.fullName || "Nom non disponible"}
                        </h3>
                        
                        {candidate.scores?.finalDecision ? (
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${getStatusColor(candidate.scores.finalDecision, 'final')}`}>
                            {getStatusIcon(candidate.scores.finalDecision)}
                            {candidate.scores.finalDecision.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${getStatusColor('EN_ATTENTE', 'final')}`}>
                            <Clock className="w-4 h-4" />
                            EN ATTENTE
                          </span>
                        )}
                      </div>

                      {/* Informations de contact */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center gap-3 text-gray-600 bg-gray-100/80 px-4 py-2 rounded-xl border border-gray-200/60">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm font-medium">{candidate.email || "Email non disponible"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600 bg-gray-100/80 px-4 py-2 rounded-xl border border-gray-200/60">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm font-medium">{candidate.phone || "Téléphone non disponible"}</span>
                        </div>
                      </div>

                      {/* Métadonnées */}
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                          <Briefcase className="w-4 h-4" />
                          <span className="font-medium">{String(candidate.metier || "Métier non spécifié")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{candidate.location || "Lieu non spécifié"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                          <Cake className="w-4 h-4" />
                          <span className="font-medium">{candidate.age || "?"} ans</span>
                        </div>
                        {candidate.createdAt && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">Inscrit le {formatDate(candidate.createdAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Statut d'appel */}
                      {candidate.scores?.callStatus && (
                        <div className="mt-4">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold ${getStatusColor(candidate.scores.callStatus, 'call')}`}>
                            {getStatusIcon(candidate.scores.callStatus)}
                            Statut appel: {candidate.scores.callStatus.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions principales */}
                  <div className="flex flex-col gap-3 ml-6">
                    <Link
                      href={`/wfm/candidates/${candidate.id}`}
                      className="flex items-center gap-2 bg-white text-gray-700 py-3 px-6 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 min-w-[140px] justify-center"
                    >
                      <Eye className="w-4 h-4" />
                      Détails
                    </Link>
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200/60">
                  <Link
                    href={`/wfm/scores/${candidate.id}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-semibold transition-all duration-200 hover:scale-105 transform"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier les notes
                  </Link>
                  
                  <Link
                    href={`/wfm/candidates/${candidate.id}/edit`}
                    className="flex items-center gap-2 text-green-600 hover:text-green-800 text-sm font-semibold transition-all duration-200 hover:scale-105 transform"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier infos
                  </Link>
                  
                  <Link
                    href={`/wfm/candidates/${candidate.id}/call`}
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-800 text-sm font-semibold transition-all duration-200 hover:scale-105 transform"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Statut appel
                  </Link>
                  
                  <button
                    onClick={() => handleDeleteCandidate(candidate.id)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-semibold transition-all duration-200 hover:scale-105 transform cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}