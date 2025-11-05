// app/wfm/candidates/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import Link from "next/link"
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  Mail,
  Briefcase,
  Cake,
  Eye,
  BarChart3,
  CheckCircle2,
  XCircle,
  PhoneCall,
  PhoneOff,
  Search
} from "lucide-react"

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  const params = await searchParams
  const filterMetier = params.metier as string
  const filterStatus = params.status as string
  const searchQuery = params.search as string
  const sortBy = params.sort as string || 'newest'

  // Récupération des candidats avec les relations
  const candidates = await prisma.candidate.findMany({
    include: {
      scores: true,
      session: true,
      faceToFaceScores: {
        include: {
          juryMember: {
            select: {
              fullName: true,
              roleType: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Filtrage et tri des candidats
  let filteredCandidates = candidates.filter(candidate => {
    // Filtre par métier
    if (filterMetier && candidate.metier !== filterMetier) {
      return false
    }
    
    // Filtre par statut
    if (filterStatus) {
      if (filterStatus === 'ADMIS' && candidate.scores?.finalDecision !== 'ADMIS') return false
      if (filterStatus === 'NON_ADMIS' && candidate.scores?.finalDecision !== 'NON_ADMIS') return false
      if (filterStatus === 'CONTACTE' && candidate.scores?.callStatus !== 'CONTACTE') return false
      if (filterStatus === 'NON_CONTACTE' && candidate.scores?.callStatus !== 'NON_CONTACTE') return false
      if (filterStatus === 'EN_ATTENTE' && candidate.scores?.finalDecision) return false
    }
    
    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const fullName = `${candidate.prenom || ''} ${candidate.nom || ''}`.toLowerCase()
      const email = candidate.email?.toLowerCase() || ''
      const metier = String(candidate.metier || '').toLowerCase()
      const location = candidate.location?.toLowerCase() || ''
      
      if (!fullName.includes(query) && !email.includes(query) && 
          !metier.includes(query) && !location.includes(query)) {
        return false
      }
    }
    
    return true
  })

  // Tri des candidats
  filteredCandidates.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'name_asc':
        return `${a.prenom || ''} ${a.nom || ''}`.localeCompare(`${b.prenom || ''} ${b.nom || ''}`)
      case 'name_desc':
        return `${b.prenom || ''} ${b.nom || ''}`.localeCompare(`${a.prenom || ''} ${a.nom || ''}`)
      case 'metier_asc':
        return String(a.metier || '').localeCompare(String(b.metier || ''))
      case 'metier_desc':
        return String(b.metier || '').localeCompare(String(a.metier || ''))
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // Calcul des statistiques
  const totalCandidates = candidates.length
  const contactedCandidates = candidates.filter(candidate => 
    candidate.scores?.callStatus && candidate.scores.callStatus !== 'NON_CONTACTE'
  ).length
  const recruitedCandidates = candidates.filter(candidate => 
    candidate.scores?.finalDecision === 'ADMIS'
  ).length
  const pendingCandidates = candidates.filter(candidate => 
    !candidate.scores?.finalDecision
  ).length

  // Couleurs vives pour les statuts
  const getStatusColor = (status: string, type: 'final' | 'call' = 'final') => {
    switch (status) {
      case 'ADMIS': 
        return 'bg-green-100 text-green-800 border-green-300 shadow-sm'
      case 'NON_ADMIS': 
        return 'bg-red-100 text-red-800 border-red-300 shadow-sm'
      case 'CONTACTE': 
        return 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm'
      case 'NON_CONTACTE': 
        return 'bg-orange-100 text-orange-800 border-orange-300 shadow-sm'
      case 'EN_ATTENTE': 
        return 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm'
      default: 
        return type === 'final' 
          ? 'bg-gray-100 text-gray-800 border-gray-300 shadow-sm'
          : 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ADMIS': return <CheckCircle2 className="w-4 h-4" />
      case 'NON_ADMIS': return <XCircle className="w-4 h-4" />
      case 'CONTACTE': return <PhoneCall className="w-4 h-4" />
      case 'NON_CONTACTE': return <PhoneOff className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getFullName = (candidate: any) => {
    return `${candidate.prenom || ''} ${candidate.nom || ''}`.trim() || 'Nom non renseigné'
  }

  const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return 0
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Métiers disponibles pour le filtre
  const metiers = [...new Set(candidates.map(c => c.metier).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      
      <main className="container mx-auto p-6 max-w-7xl">
        {/* En-tête avec statistiques */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Candidats</h1>
              <p className="text-gray-600 mt-2">Consultez et gérez l'ensemble des candidatures</p>
            </div>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Candidats</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalCandidates}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contactés</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{contactedCandidates}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <PhoneCall className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recrutés</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{recruitedCandidates}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{pendingCandidates}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de filtres et recherche */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              {/* Recherche */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un candidat..."
                  defaultValue={searchQuery}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filtre par métier */}
              <select 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px]"
                defaultValue={filterMetier}
              >
                <option value="">Tous les métiers</option>
                {metiers.map(metier => (
                  <option key={metier} value={metier}>{metier}</option>
                ))}
              </select>

              {/* Filtre par statut */}
              <select 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px]"
                defaultValue={filterStatus}
              >
                <option value="">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="CONTACTE">Contacté</option>
                <option value="NON_CONTACTE">Non contacté</option>
                <option value="ADMIS">Admis</option>
                <option value="NON_ADMIS">Non admis</option>
              </select>
            </div>

            {/* Tri */}
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px]"
              defaultValue={sortBy}
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

        {/* Liste des candidats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Liste des Candidats</h2>
                <p className="text-gray-600 mt-1">
                  {filteredCandidates.length} candidat(s) sur {totalCandidates}
                  {(filterMetier || filterStatus || searchQuery) && (
                    <span className="text-blue-600 ml-2">(filtrés)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun candidat trouvé</p>
              <p className="text-gray-400 text-sm mt-1">
                {candidates.length === 0 
                  ? "Les candidats apparaîtront ici une fois ajoutés" 
                  : "Aucun candidat ne correspond aux critères de recherche"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCandidates.map((candidate) => (
                <div key={candidate.id} className="p-6 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start justify-between">
                    {/* Informations du candidat */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 shadow-md">
                          {getFullName(candidate).charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-semibold text-lg text-gray-900 truncate">
                              {getFullName(candidate)}
                            </h3>
                            
                            {/* Statut final */}
                            {candidate.scores?.finalDecision ? (
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(candidate.scores.finalDecision, 'final')}`}>
                                {getStatusIcon(candidate.scores.finalDecision)}
                                {candidate.scores.finalDecision}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor('EN_ATTENTE', 'final')}`}>
                                <User className="w-4 h-4" />
                                EN ATTENTE
                              </span>
                            )}
                          </div>

                          {/* Informations de contact */}
                          <div className="flex flex-wrap gap-4 mb-3">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm">{candidate.email || 'Email non renseigné'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span className="text-sm">{candidate.telephone || 'Téléphone non renseigné'}</span>
                            </div>
                          </div>

                          {/* Métadonnées */}
                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border">
                              <Briefcase className="w-3 h-3" />
                              <span>{String(candidate.metier || 'Non renseigné')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border">
                              <MapPin className="w-3 h-3" />
                              <span>{candidate.location || 'Non renseignée'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border">
                              <Cake className="w-3 h-3" />
                              <span>{calculateAge(candidate.birthDate)} ans</span>
                            </div>
                            {candidate.createdAt && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border">
                                <Calendar className="w-3 h-3" />
                                <span>Inscrit le {formatDate(candidate.createdAt)}</span>
                              </div>
                            )}
                          </div>

                          {/* Statut d'appel */}
                          {candidate.scores?.callStatus && (
                            <div className="mt-3">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(candidate.scores.callStatus, 'call')}`}>
                                {getStatusIcon(candidate.scores.callStatus)}
                                Statut appel: {candidate.scores.callStatus}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-6">
                      <Link
                        href={`/wfm/candidates/${candidate.id}`}
                        className="flex items-center gap-2 bg-white text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-300 shadow-sm hover:shadow-md"
                      >
                        <Eye className="w-4 h-4" />
                        Détails
                      </Link>
                      <Link
                        href={`/wfm/candidates/${candidate.id}/consolidation`}
                        className="flex items-center gap-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-colors shadow-sm hover:shadow-md"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Consolidation
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}