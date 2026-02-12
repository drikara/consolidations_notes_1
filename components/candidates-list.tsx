'use client'

import { useState, useMemo, useEffect } from 'react'
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
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BadgeCheck,
  CalendarDays,
  BriefcaseBusiness,
  Building2
} from 'lucide-react'
import { RecruitmentStatut } from '@prisma/client'

interface CandidatesListProps {
  candidates?: any[]
  initialFilters?: {
    metier?: string
    status?: string
    search?: string
    sort?: string
    recruitmentStatus?: string
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
  candidates, 
  initialFilters = {},
  statistics = { total: 0, contacted: 0, recruited: 0, pending: 0 },
  metiers = []
}: CandidatesListProps) {
  const [filters, setFilters] = useState({
    metier: initialFilters.metier || 'all',
    status: initialFilters.status || 'all',
    recruitmentStatus: initialFilters.recruitmentStatus || 'all',
    search: initialFilters.search || '',
    sort: initialFilters.sort || 'newest'
  })

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setCurrentPage(1)
  }, [filters.metier, filters.status, filters.search, filters.sort, filters.recruitmentStatus])

  const safeCandidates = useMemo(() => {
    if (!candidates) return []
    if (!Array.isArray(candidates)) return []
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

  const formatRecruitmentStatus = (status: RecruitmentStatut | null) => {
    const statusMap: Record<RecruitmentStatut, string> = {
      STAGE: 'Stage',
      INTERIM: 'Intérim',
      CDI: 'CDI',
      CDD: 'CDD',
      AUTRE: 'Autre'
    }
    return status ? statusMap[status] : 'Non spécifié'
  }

  const getRecruitmentStatusColor = (status: RecruitmentStatut | null) => {
    const colorMap: Record<RecruitmentStatut, string> = {
      STAGE: 'bg-purple-100 text-purple-800 border-purple-200',
      INTERIM: 'bg-orange-100 text-orange-800 border-orange-200',
      CDI: 'bg-green-100 text-green-800 border-green-200',
      CDD: 'bg-blue-100 text-blue-800 border-blue-200',
      AUTRE: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return status ? colorMap[status] : 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const filteredCandidates = useMemo(() => {
    if (!safeCandidates || safeCandidates.length === 0) return []

    let result = safeCandidates.filter(candidate => {
      if (!candidate || typeof candidate !== 'object') return false

      // Filtre métier
      if (filters.metier && filters.metier !== 'all' && candidate.metier !== filters.metier) return false

      // Filtre statut (présence/décision)
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'RECRUTE' && candidate.scores?.finalDecision !== 'RECRUTE') return false
        if (filters.status === 'NON_RECRUTE' && candidate.scores?.finalDecision !== 'NON_RECRUTE') return false
        if (filters.status === 'PRESENT' && candidate.scores?.statut !== 'PRESENT') return false
        if (filters.status === 'ABSENT' && candidate.scores?.statut !== 'ABSENT') return false
        if (filters.status === 'EN_ATTENTE' && candidate.scores?.finalDecision) return false
      }

      // Filtre statut recrutement
      if (filters.recruitmentStatus && filters.recruitmentStatus !== 'all') {
        if (!candidate.statutRecruitment) return false
        if (candidate.statutRecruitment !== filters.recruitmentStatus) return false
      }

      // Recherche texte
      if (filters.search) {
        const query = filters.search.toLowerCase()
        const fullName = `${candidate.nom || ''} ${candidate.prenom || ''}`.toLowerCase()
        const searchableFields = [
          fullName,
          candidate.email?.toLowerCase() || '',
          String(candidate.metier || '').toLowerCase(),
          candidate.location?.toLowerCase() || '',
          formatRecruitmentStatus(candidate.statutRecruitment).toLowerCase(),
          candidate.agenceType?.toLowerCase() || '' // ✅ Ajout du type d'agence
        ]
        return searchableFields.some(field => field.includes(query))
      }

      return true
    })

    // Tri
    result.sort((a, b) => {
      try {
        switch (filters.sort) {
          case 'newest': 
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          case 'oldest': 
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          case 'name_asc': 
            return (`${a.nom} ${a.prenom}`).localeCompare(`${b.nom} ${b.prenom}`)
          case 'name_desc': 
            return (`${b.nom} ${b.prenom}`).localeCompare(`${a.nom} ${a.prenom}`)
          case 'metier_asc': 
            return String(a.metier || '').localeCompare(String(b.metier || ''))
          case 'metier_desc': 
            return String(b.metier || '').localeCompare(String(a.metier || ''))
          case 'recruitment_status_asc':
            return String(formatRecruitmentStatus(a.statutRecruitment)).localeCompare(String(formatRecruitmentStatus(b.statutRecruitment)))
          case 'recruitment_status_desc':
            return String(formatRecruitmentStatus(b.statutRecruitment)).localeCompare(String(formatRecruitmentStatus(a.statutRecruitment)))
          default: 
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        }
      } catch (error) {
        return 0
      }
    })

    return result
  }, [safeCandidates, filters])

  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredCandidates.slice(startIndex, endIndex)
  }, [filteredCandidates, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const getStatusColor = (status: string, type: 'final' | 'statut' = 'final') => {
    const colors = {
      RECRUTE: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25',
      NON_RECRUTE: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25',
      PRESENT: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25',
      ABSENT: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25',
      EN_ATTENTE: 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/25'
    }
    return colors[status as keyof typeof colors] || 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/25'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      RECRUTE: <Award className="w-4 h-4" />,
      NON_RECRUTE: <XCircle className="w-4 h-4" />,
      PRESENT: <UserCheck className="w-4 h-4" />,
      ABSENT: <UserX className="w-4 h-4" />,
      EN_ATTENTE: <Clock className="w-4 h-4" />
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

  const getInitials = (nom: string | undefined, prenom: string | undefined) => {
    if (!nom || !prenom) return "??"
    try {
      return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase()
    } catch {
      return "??"
    }
  }

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

        {/* Cartes statistiques */}
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
                <p className="text-gray-600 text-sm font-medium">Présents</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{safeCandidates.filter(c => c.scores?.statut === 'PRESENT').length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <UserCheck className="w-6 h-6 text-white" />
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

      {/* Barre de filtres */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl mb-8 overflow-x-hidden">
        <div className="flex flex-col gap-6 w-full">
          {/* Recherche */}
          <div className="relative w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-sm"></div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un candidat..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full pl-12 pr-6 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
            <select
              value={filters.metier}
              onChange={(e) => setFilters((prev) => ({ ...prev, metier: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 cursor-pointer"
            >
              <option value="all">Tous les métiers</option>
              {metiers.map((metier) => (
                <option key={metier} value={metier}>{metier}</option>
              ))}
            </select>

            <select
              value={filters.recruitmentStatus}
              onChange={(e) => setFilters((prev) => ({ ...prev, recruitmentStatus: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 cursor-pointer"
            >
              <option value="all">Statut recrutement</option>
              <option value="STAGE">Stage</option>
              <option value="INTERIM">Intérim</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="AUTRE">Autre</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="PRESENT">Présent</option>
              <option value="ABSENT">Absent</option>
              <option value="RECRUTE">Recruté</option>
              <option value="NON_RECRUTE">Non recruté</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 cursor-pointer"
            >
              <option value="newest">Plus récent</option>
              <option value="oldest">Plus ancien</option>
              <option value="name_asc">Nom A-Z</option>
              <option value="name_desc">Nom Z-A</option>
              <option value="metier_asc">Métier A-Z</option>
              <option value="metier_desc">Métier Z-A</option>
              <option value="recruitment_status_asc">Statut recrutement A-Z</option>
              <option value="recruitment_status_desc">Statut recrutement Z-A</option>
            </select>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 cursor-pointer"
            >
              <option value="5">5 / page</option>
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>
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
                    Affichage {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredCandidates.length)} sur {filteredCandidates.length} candidat(s)
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>Total: {statistics.total}</span>
                  {(filters.metier !== 'all' || filters.status !== 'all' || filters.recruitmentStatus !== 'all' || filters.search) && (
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
              Aucun candidat ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200/60">
              {paginatedCandidates.map((candidate) => {
                const isAbsent = candidate.scores?.statut === 'ABSENT'
                const absenceMotif = candidate.scores?.statut_commentaire

                return (
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
                            {getInitials(candidate.nom, candidate.prenom)}
                          </div>
                          {candidate.scores?.finalDecision === 'RECRUTE' && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                              <Star className="w-3 h-3 text-white fill-current" />
                            </div>
                          )}
                          {/* ⭐ Badge absent uniquement */}
                          {isAbsent && (
                            <div className="absolute -bottom-2 -right-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium border border-red-200 shadow-sm flex items-center gap-1" title={absenceMotif || 'Candidat absent'}>
                              <UserX className="w-3 h-3" />
                              Absent
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h3 className="font-bold text-xl text-gray-900 group-hover:text-gray-800 transition-colors">
                              {candidate.nom} {candidate.prenom}
                            </h3>
                            
                            {candidate.scores?.finalDecision ? (
                              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${getStatusColor(candidate.scores.finalDecision, 'final')}`}>
                                {getStatusIcon(candidate.scores.finalDecision)}
                                {candidate.scores.finalDecision === 'RECRUTE' ? 'RECRUTÉ' : 'NON RECRUTÉ'}
                              </span>
                            ) : candidate.scores?.statut ? (
                              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${getStatusColor(candidate.scores.statut, 'statut')}`}>
                                {getStatusIcon(candidate.scores.statut)}
                                {candidate.scores.statut === 'PRESENT' ? 'Présent' : 'Absent'}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold ${getStatusColor('EN_ATTENTE', 'statut')}`}>
                                <Clock className="w-4 h-4" />
                                EN ATTENTE
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
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${getRecruitmentStatusColor(candidate.statutRecruitment)}`}>
                              <BriefcaseBusiness className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {formatRecruitmentStatus(candidate.statutRecruitment)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {/* Métier */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                              <Briefcase className="w-4 h-4" />
                              <span className="font-medium">{String(candidate.metier || "Métier non spécifié")}</span>
                            </div>
                            
                            {/* ✅ Type d'agence pour AGENCES */}
                            {candidate.metier === 'AGENCES' && candidate.agenceType && (
                              <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200 shadow-sm">
                                <Building2 className="w-4 h-4" />
                                <span className="font-medium">{candidate.agenceType}</span>
                              </div>
                            )}
                            
                            {/* Localisation */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium">{candidate.location || "Lieu non spécifié"}</span>
                            </div>
                            
                            {/* Âge */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                              <Cake className="w-4 h-4" />
                              <span className="font-medium">{candidate.age || "?"} ans</span>
                            </div>
                            
                            {/* Date d'inscription */}
                            {candidate.created_at && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">Inscrit le {formatDate(candidate.created_at)}</span>
                              </div>
                            )}
                          </div>

                          {/* ⭐ Affichage du motif d'absence si absent */}
                          {isAbsent && absenceMotif && (
                            <div className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-200">
                              <span className="font-semibold">Motif d'absence :</span> {absenceMotif}
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
                      
                      <Link
                        href={`/wfm/candidates/${candidate.id}/call`}
                        className="flex items-center gap-2 text-orange-600 hover:text-orange-800 text-sm font-semibold transition-all duration-200 hover:scale-105 transform"
                      >
                        <PhoneCall className="w-4 h-4" />
                        Statut présence
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
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50/50 to-blue-50/30">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Page <span className="font-semibold">{currentPage}</span> sur <span className="font-semibold">{totalPages}</span> • 
                    <span className="ml-2">{filteredCandidates.length} candidat(s) au total</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      title="Première page"
                    >
                      <ChevronsLeft className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      title="Page précédente"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-10 h-10 rounded-xl font-medium transition-all duration-200 ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      title="Page suivante"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      title="Dernière page"
                    >
                      <ChevronsRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}