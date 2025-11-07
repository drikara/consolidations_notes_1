// app/jury/dashboard/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  CheckCircle, 
  Clock, 
  User, 
  Users, 
  FileText, 
  Award,
  GraduationCap,
  Calendar,
  ArrowRight,
  AlertTriangle,
  BookOpen,
  Target,
  MapPin,
  Briefcase
} from 'lucide-react'
import { canJuryMemberAccessCandidate, isSessionActive } from "@/lib/permissions"

export default async function JuryDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  // Vérification du rôle
  const userRole = (session.user as any).role || "JURY"
  if (userRole !== "JURY") {
    redirect("/auth/login")
  }

  // Get jury member info avec Prisma
  const juryMember = await prisma.juryMember.findFirst({
    where: { 
      userId: session.user.id 
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        }
      }
    }
  })

  if (!juryMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <DashboardHeader user={session.user} role="JURY" />
        <main className="container mx-auto p-6">
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-orange-800 mb-3">Profil Jury Incomplet</h2>
            <p className="text-orange-700 text-lg mb-6">
              Votre compte n'est pas encore configuré comme membre du jury. Veuillez contacter l'administrateur WFM.
            </p>
            <div className="bg-white rounded-xl p-4 border border-orange-100">
              <p className="text-sm text-orange-600">
                Contactez le service WFM pour finaliser votre configuration de compte jury.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Get evaluation statistics avec Prisma - SEULEMENT pour les sessions actives
  const evaluatedCount = await prisma.faceToFaceScore.groupBy({
    by: ['candidateId'],
    where: {
      juryMemberId: juryMember.id,
      candidate: {
        session: {
          status: {
            in: ["PLANIFIED", "IN_PROGRESS"]
          }
        }
      }
    },
    _count: {
      candidateId: true
    }
  })

  // Get pending candidates avec Prisma - SEULEMENT pour les sessions actives
  const evaluatedCandidateIds = await prisma.faceToFaceScore.findMany({
    where: {
      juryMemberId: juryMember.id,
      candidate: {
        session: {
          status: {
            in: ["PLANIFIED", "IN_PROGRESS"]
          }
        }
      }
    },
    select: {
      candidateId: true
    },
    distinct: ['candidateId']
  })

  const evaluatedIds = evaluatedCandidateIds.map(score => score.candidateId)

  const allPendingCandidates = await prisma.candidate.findMany({
    where: {
      id: {
        notIn: evaluatedIds
      },
      // FILTRE CRITIQUE : Seulement les sessions actives
      session: {
        status: {
          in: ["PLANIFIED", "IN_PROGRESS"]
        }
      }
    },
    include: {
      session: {
        select: {
          metier: true,
          date: true,
          jour: true,
          location: true,
          status: true
        }
      },
      scores: {
        select: {
          finalDecision: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // FILTRER POUR LES REPRÉSENTANTS MÉTIER
  const pendingCandidates = allPendingCandidates.filter(candidate => 
    canJuryMemberAccessCandidate(juryMember, candidate)
  ).slice(0, 5) // Garder seulement les 5 premiers

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case 'DRH':
        return <Award className="w-5 h-5" />
      case 'EPC':
        return <Users className="w-5 h-5" />
      case 'REPRESENTANT_METIER':
        return <Target className="w-5 h-5" />
      case 'WFM_JURY':
        return <User className="w-5 h-5" />
      default:
        return <User className="w-5 h-5" />
    }
  }

  const getStatusColor = (finalDecision?: string) => {
    if (!finalDecision) return 'bg-gray-100 text-gray-700'
    return finalDecision === 'RECRUTE' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-red-100 text-red-700'
  }

  const getStatusIcon = (finalDecision?: string) => {
    if (!finalDecision) return null
    return finalDecision === 'RECRUTE' 
      ? <CheckCircle className="w-3 h-3 mr-1" />
      : <AlertTriangle className="w-3 h-3 mr-1" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardHeader user={session.user} role="JURY" />
      <main className="container mx-auto p-6 space-y-8">
        {/* En-tête du jury */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">Tableau de Bord Jury</h1>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-lg">
                    {getRoleIcon(juryMember.roleType)}
                    <span className="text-sm font-semibold text-orange-700 capitalize">
                      {juryMember.roleType.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </div>
                  {juryMember.specialite && (
                    <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded-lg">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">{juryMember.specialite}</span>
                    </div>
                  )}
                  {juryMember.department && (
                    <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-lg">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700">{juryMember.department}</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 mt-2 text-lg">{juryMember.fullName}</p>
                <p className="text-gray-500 text-sm">{juryMember.user.email}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link href="/jury/evaluations">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Mes Évaluations
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Carte Évaluations Complétées */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Évaluations Complétées</p>
                <p className="text-3xl font-bold text-gray-800">{evaluatedCount.length}</p>
                <p className="text-xs text-gray-500 mt-1">Candidats évalués</p>
              </div>
              <div className="bg-green-500/20 text-green-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Carte Candidats en Attente */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Candidats en Attente</p>
                <p className="text-3xl font-bold text-orange-600">{pendingCandidates.length}</p>
                <p className="text-xs text-gray-500 mt-1">En attente d'évaluation</p>
              </div>
              <div className="bg-orange-500/20 text-orange-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Carte Rôle du Jury */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Rôle du Jury</p>
                <p className="text-lg font-bold text-gray-800 capitalize">
                  {juryMember.roleType.toLowerCase().replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-gray-500 mt-1">Type d'évaluateur</p>
              </div>
              <div className="bg-blue-500/20 text-blue-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                {getRoleIcon(juryMember.roleType)}
              </div>
            </div>
          </div>
        </div>

        {/* Candidats à évaluer */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Candidats à Évaluer</h2>
                  <p className="text-gray-600 text-sm">
                    {pendingCandidates.length} candidat(s) en attente de votre évaluation
                  </p>
                </div>
              </div>
              <Link href="/jury/evaluations">
                <Button variant="outline" className="border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700 rounded-xl transition-all duration-200 flex items-center gap-2">
                  Voir tout
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {pendingCandidates.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-3">Aucun candidat en attente</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {allPendingCandidates.length === 0 
                    ? "Aucun candidat disponible dans les sessions actives." 
                    : "Tous les candidats accessibles ont été évalués. Revenez plus tard pour de nouvelles évaluations."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCandidates.map((candidate) => (
                  <div 
                    key={candidate.id} 
                    className="flex items-center justify-between p-6 bg-gray-50 rounded-xl hover:bg-orange-50 transition-all duration-200 border border-gray-200 hover:border-orange-200 group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        <User className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800 truncate">
                            {candidate.fullName}
                          </h3>
                          {candidate.scores?.finalDecision && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.scores.finalDecision)}`}>
                              {getStatusIcon(candidate.scores.finalDecision)}
                              {candidate.scores.finalDecision === 'RECRUTE' ? 'Admis' : 'Non admis'}
                            </span>
                          )}
                          {/* Indicateur de session active */}
                          {candidate.session && isSessionActive(candidate.session) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Session active
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{candidate.metier}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{candidate.age} ans</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            <span>{candidate.diploma}</span>
                          </div>
                          {candidate.session && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              <span>{candidate.session.jour} {candidate.session.date && new Date(candidate.session.date).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                          {candidate.session?.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{candidate.session.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link href={`/jury/evaluations/${candidate.id}`}>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Évaluer
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions d'évaluation */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-orange-900">Guide d'Évaluation Jury</h3>
              <p className="text-orange-700">Instructions et bonnes pratiques pour vos évaluations</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-orange-800">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Échelle d'évaluation</h4>
                  <p className="text-sm">Notez chaque critère sur une échelle de 0 à 5 points</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Phase comportementale</h4>
                  <p className="text-sm">Évaluez la motivation, communication et soft skills</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Phase technique</h4>
                  <p className="text-sm">Évaluez les connaissances métier et compétences techniques</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Sessions actives uniquement</h4>
                  <p className="text-sm">Seules les sessions en cours sont accessibles pour évaluation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}