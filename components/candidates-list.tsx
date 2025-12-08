// components/candidates-list.tsx
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
  XCircle,
  Check,
  X,
  AlertCircle,
  GraduationCap
} from 'lucide-react'

interface CandidatesListProps {
  candidates?: any[]
  initialFilters?: {
    metier?: string
    status?: string
    search?: string
    sort?: string
    availability?: string
    statut?: string
  }
  statistics?: {
    total: number
    contacted: number
    recruited: number
    pending: number
    available: number
    notAvailable: number
    present: number
    absent: number
  }
  metiers?: string[]
}

export function CandidatesList({ 
  candidates, 
  initialFilters = {},
  statistics = { 
    total: 0, 
    contacted: 0, 
    recruited: 0, 
    pending: 0,
    available: 0,
    notAvailable: 0,
    present: 0,
    absent: 0
  },
  metiers = []
}: CandidatesListProps) {
  const [filters, setFilters] = useState({
    metier: initialFilters.metier || 'all',
    status: initialFilters.status || 'all',
    availability: initialFilters.availability || 'all',
    statut: initialFilters.statut || 'all',
    search: initialFilters.search || '',
    sort: initialFilters.sort || 'newest'
  })

  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // ✅ CORRECTION CRITIQUE : Vérification robuste avec valeur par défaut
  const safeCandidates = useMemo(() => {
    if (!candidates) {
      console.warn('CandidatesList: candidates is undefined')
      return []
    }
    if (!Array.isArray(candidates)) {
      console.error('CandidatesList: candidates is not an array', typeof candidates)
      return []
    }
    return candidates
  }, [candidates])

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
        console.error('Error deleting candidate:', error)
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
    // ✅ Protection supplémentaire
    if (!safeCandidates || safeCandidates.length === 0) {
      return []
    }

    let result = safeCandidates.filter(candidate => {
      // ✅ Vérification robuste de l'objet candidat
      if (!candidate || typeof candidate !== 'object') {
        console.warn('Invalid candidate object:', candidate)
        return false
      }

      // Filtre par métier
      if (filters.metier && filters.metier !== 'all' && candidate.metier !== filters.metier) return false
      
      // Filtre par statut final
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'RECRUTE' && candidate.scores?.finalDecision !== 'RECRUTE') return false
        if (filters.status === 'NON_RECRUTE' && candidate.scores?.finalDecision !== 'NON_RECRUTE') return false
        if (filters.status === 'EN_ATTENTE' && candidate.scores?.finalDecision) return false
      }
      
      // Filtre par disponibilité
      if (filters.availability && filters.availability !== 'all') {
        if (filters.availability === 'Oui' && candidate.availability !== 'Oui') return false
        if (filters.availability === 'Non' && candidate.availability !== 'Non') return false
      }
      
      // Filtre par statut (présent/absent)
      if (filters.statut && filters.statut !== 'all') {
        if (filters.statut === 'PRESENT' && candidate.scores?.statut !== 'PRESENT') return false
        if (filters.statut === 'ABSENT' && candidate.scores?.statut !== 'ABSENT') return false
        if (filters.statut === 'NON_DEFINI' && !candidate.scores?.statut) return false
      }
      
      // Filtre par recherche
      if (filters.search) {
        const query = filters.search.toLowerCase()
        const searchableFields = [
          candidate.fullName?.toLowerCase() || '',
          candidate.email?.toLowerCase() || '',
          String(candidate.metier || '').toLowerCase(),
          candidate.location?.toLowerCase() || '',
          candidate.phone?.toLowerCase() || '',
          candidate.diploma?.toLowerCase() || '',
          candidate.institution?.toLowerCase() || '',
          candidate.niveauEtudes?.toLowerCase() || ''
        ]
        return searchableFields.some(field => field.includes(query))
      }
      
      return true
    })

    // ✅ Protection avant le tri
    result.sort((a, b) => {
      try {
        switch (filters.sort) {
          case 'newest': 
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          case 'oldest': 
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          case 'name_asc': 
            return (a.fullName || '').localeCompare(b.fullName || '')
          case 'name_desc': 
            return (b.fullName || '').localeCompare(a.fullName || '')
          case 'metier_asc': 
            return String(a.metier || '').localeCompare(String(b.metier || ''))
          case 'metier_desc': 
            return String(b.metier || '').localeCompare(String(a.metier || ''))
          case 'statut_asc': 
            return String(a.scores?.statut || '').localeCompare(String(b.scores?.statut || ''))
          case 'statut_desc': 
            return String(b.scores?.statut || '').localeCompare(String(a.scores?.statut || ''))
          default: 
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        }
      } catch (error) {
        console.error('Error sorting candidates:', error)
        return 0
      }
    })

    return result
  }, [safeCandidates, filters])

  const getStatusColor = (status: string, type: 'final' | 'call' | 'statut' = 'final') => {
    const colors = {
      // Statut final
      RECRUTE: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25',
      NON_RECRUTE: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25',
      EN_ATTENTE: 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/25',
      
      // Statut d'appel (maintenant remplacé par statut présent/absent)
      PRESENT: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25',
      ABSENT: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25',
      
      // Disponibilité
      Oui: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25',
      Non: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
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
      EN_ATTENTE: <Clock className="w-4 h-4" />,
      PRESENT: <Check className="w-4 h-4" />,
      ABSENT: <X className="w-4 h-4" />,
      Oui: <CheckCircle2 className="w-4 h-4" />,
      Non: <XCircle className="w-4 h-4" />
    }
    return icons[status as keyof typeof icons] || <User className="w-4 h-4" />
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Non défini"
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return "Date invalide"
    }
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return "??"
    try {
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    } catch {
      return "??"
    }
  }

  // ✅ Affichage quand aucun candidat
  if (safeCandidates.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-6">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <User className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun candidat disponible</h3>
          <p className="text-gray-500 mb-6">
            Commencez par ajouter votre premier candidat pour le voir apparaître ici
          </p>
          <Link
            href="/wfm/candidates/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Ajouter un candidat
          </Link>
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

        {/* Cartes de statistiques améliorées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <p className="text-gray-600 text-sm font-medium">Disponibles</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.available}</p>
                <p className="text-xs text-gray-500 mt-1">{statistics.notAvailable} non disponibles</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Présents</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.present}</p>
                <p className="text-xs text-gray-500 mt-1">{statistics.absent} absents</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                <Check className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Recrutés</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.recruited}</p>
                <p className="text-xs text-gray-500 mt-1">{statistics.pending} en attente</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de filtres et recherche améliorée */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            {/* Recherche */}
            <div className="relative flex-1 min-w-[280px]">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm"></div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un candidat (nom, email, téléphone, diplôme...)"
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

            {/* Filtres desktop - Élargis */}
            <div className={`${showFilters ? 'grid grid-cols-2 gap-4' : 'hidden'} lg:grid lg:grid-cols-4 gap-4 w-full lg:w-auto`}>
              <select 
                value={filters.metier}
                onChange={(e) => setFilters(prev => ({ ...prev, metier: e.target.value }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 cursor-pointer"
              >
                <option value="all">Tous les métiers</option>
                {metiers.map(metier => (
                  <option key={metier} value={metier}>{metier}</option>
                ))}
              </select>

              <select 
                value={filters.availability}
                onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 cursor-pointer"
              >
                <option value="all">Toutes disponibilités</option>
                <option value="Oui">Disponible</option>
                <option value="Non">Non disponible</option>
              </select>

              <select 
                value={filters.statut}
                onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="PRESENT">Présent</option>
                <option value="ABSENT">Absent</option>
                <option value="NON_DEFINI">Non défini</option>
              </select>

              <select 
                value={filters.sort}
                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 cursor-pointer"
              >
                <option value="newest">Plus récent</option>
                <option value="oldest">Plus ancien</option>
                <option value="name_asc">Nom A-Z</option>
                <option value="name_desc">Nom Z-A</option>
                <option value="metier_asc">Métier A-Z</option>
                <option value="metier_desc">Métier Z-A</option>
                <option value="statut_asc">Statut A-Z</option>
                <option value="statut_desc">Statut Z-A</option>
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
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {filteredCandidates.length} candidat(s)
                  </span>
                  {filters.availability !== 'all' && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Disponibilité: {filters.availability}
                    </span>
                  )}
                  {filters.statut !== 'all' && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      Statut: {filters.statut}
                    </span>
                  )}
                  {(filters.metier !== 'all' || filters.search) && (
                    <span className="text-blue-600 font-medium">(résultats filtrés)</span>
                  )}
                </div>
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
              Aucun candidat ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200/60">
            {filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="p-8 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/20 transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="pt-3">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.id)}
                        onChange={() => toggleCandidateSelection(candidate.id)}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                      />
                    </div>

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

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-gray-800 transition-colors">
                          {candidate.fullName || "Nom non disponible"}
                        </h3>
                        
                        {/* Statut final */}
                        {candidate.scores?.finalDecision ? (
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${getStatusColor(candidate.scores.finalDecision, 'final')}`}>
                            {getStatusIcon(candidate.scores.finalDecision)}
                            {candidate.scores.finalDecision === 'RECRUTE' ? 'Recruté' : 'Non recruté'}
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${getStatusColor('EN_ATTENTE', 'final')}`}>
                            <Clock className="w-4 h-4" />
                            EN ATTENTE
                          </span>
                        )}

                        {/* Disponibilité */}
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${getStatusColor(candidate.availability)}`}>
                          {getStatusIcon(candidate.availability)}
                          Disponible: {candidate.availability}
                        </span>

                        {/* Statut (Présent/Absent) */}
                        {candidate.scores?.statut && (
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${getStatusColor(candidate.scores.statut, 'statut')}`}>
                            {getStatusIcon(candidate.scores.statut)}
                            {candidate.scores.statut === 'PRESENT' ? 'Présent' : 'Absent'}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center gap-3 text-gray-600 bg-gray-100/80 px-4 py-2 rounded-xl border border-gray-200/60">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm font-medium">{candidate.email || "Email non disponible"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600 bg-gray-100/80 px-4 py-2 rounded-xl border border-gray-200/60">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm font-medium">{candidate.phone || "Téléphone non disponible"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600 bg-gray-100/80 px-4 py-2 rounded-xl border border-gray-200/60">
                          <GraduationCap className="w-4 h-4" />
                          <span className="text-sm font-medium">{candidate.niveauEtudes || "Niveau non spécifié"}</span>
                        </div>
                      </div>

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

                      {/* Commentaire du statut */}
                      {candidate.scores?.statutCommentaire && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-yellow-800">
                              <span className="font-medium">Justification: </span>
                              {candidate.scores.statutCommentaire}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 ml-6">
                    <Link
                      href={`/wfm/candidates/${candidate.id}`}
                      className="flex items-center gap-2 bg-white text-gray-700 py-3 px-6 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 min-w-[140px] justify-center"
                    >
                      <Eye className="w-4 h-4" />
                      Détails
                    </Link>
                    <Link
                      href={`/wfm/candidates/${candidate.id}/call`}
                      className="flex items-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-all duration-200 border-2 border-blue-600 shadow-sm hover:shadow-md min-w-[140px] justify-center"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Gérer statut
                    </Link>
                  </div>
                </div>

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