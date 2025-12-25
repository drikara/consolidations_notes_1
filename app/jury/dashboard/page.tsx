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
  Calendar,
  ArrowRight,
  BookOpen,
  Target,
  Briefcase
} from 'lucide-react'
import { filterCandidatesForJury, isSessionActive } from "@/lib/permissions"

export default async function JuryDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  const userRole = (session.user as any).role

  // ✅ Récupérer l'utilisateur avec son juryMember ET ses présences dans les sessions
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { 
      juryMember: {
        include: {
          juryPresences: {
            where: {
              session: {
                status: {
                  in: ["PLANIFIED", "IN_PROGRESS"]
                }
              }
            },
            select: {
              sessionId: true
            }
          }
        }
      }
    }
  })

  // ✅ NOUVELLE LOGIQUE : Autoriser WFM_JURY même sans sessions assignées
  const hasJuryProfile = !!user?.juryMember
  const hasActiveSessions = (user?.juryMember?.juryPresences?.length ?? 0) > 0
  const isWFMJury = user?.role === 'WFM' && user?.juryMember?.roleType === 'WFM_JURY'
  
  const canAccessJuryDashboard = hasJuryProfile && (
    userRole === 'JURY' || isWFMJury  // ✅ WFM_JURY peut accéder même sans sessions
  )

  if (!canAccessJuryDashboard) {
    const reason = !hasJuryProfile
      ? "pas de profil jury" 
      : "rôle non autorisé"
    
    console.log(`🚫 Accès refusé au dashboard Jury pour role: ${userRole}, raison: ${reason}`)
    redirect("/unauthorized")
  }

  // ✅ Le juryMember existe à ce stade (vérifié ci-dessus)
  const juryMember = user.juryMember!

  // Si WFM_JURY sans sessions, afficher un message informatif
  if (isWFMJury && !hasActiveSessions) {
    console.log('ℹ️ WFM_JURY sans sessions assignées - Affichage du dashboard vide')
  }

  // Récupérer les candidats évalués par ce jury (sessions actives seulement)
  const evaluatedCount = await prisma.faceToFaceScore.groupBy({
    by: ['candidateId'],
    where: {
      juryMemberId: juryMember.id,
      candidate: {
        session: {
          status: {
            in: ["PLANIFIED", "IN_PROGRESS"]
          }
        },
        availability: 'OUI'
      }
    },
    _count: {
      candidateId: true
    }
  })

  // Récupérer tous les candidats des sessions actives
  const allCandidates = await prisma.candidate.findMany({
    where: {
      session: {
        status: {
          in: ["PLANIFIED", "IN_PROGRESS"]
        }
      },
      availability: 'OUI'
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
      },
      faceToFaceScores: {
        where: {
          juryMemberId: juryMember.id
        },
        select: {
          candidateId: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const accessibleCandidates = await filterCandidatesForJury(allCandidates, juryMember)
  
  const evaluatedCandidateIds = new Set(
    allCandidates.flatMap(c => 
      c.faceToFaceScores.map(s => s.candidateId)
    )
  )

  const pendingCandidates = accessibleCandidates
    .filter(candidate => !evaluatedCandidateIds.has(candidate.id))
    .slice(0, 5)

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case 'DRH':
        return <Award className="w-5 h-5" />
      case 'EPC':
        return <Users className="w-5 h-5" />
      case 'FORMATEUR':
        return <Users className="w-5 h-5" />
      case 'REPRESENTANT_METIER':
        return <Target className="w-5 h-5" />
      case 'WFM_JURY':
        return <User className="w-5 h-5" />
      default:
        return <User className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardHeader user={session.user} />
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
                </div>
                <p className="text-gray-600 mt-2 text-lg">{juryMember.fullName}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link href="/jury/evaluations">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4" />
                  Mes Évaluations
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Message informatif pour WFM_JURY sans sessions */}
        {isWFMJury && !hasActiveSessions && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Aucune session assignée
                </h3>
                <p className="text-blue-700">
                  Vous n'êtes actuellement assigné à aucune session de recrutement active. 
                  Contactez l'administrateur WFM pour être ajouté à une session.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Candidats Accessibles</p>
                <p className="text-3xl font-bold text-gray-800">{accessibleCandidates.length}</p>
                <p className="text-xs text-gray-500 mt-1">Dans vos sessions actives</p>
              </div>
              <div className="bg-blue-500/20 text-blue-600 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Candidats à évaluer */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-orange-100 to-orange-200">
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
              <Link href="/jury/evaluations" className="cursor-pointer">
                <Button variant="outline" className="border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-100 text-gray-700 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer">
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
                <h3 className="text-xl font-semibold text-gray-600 mb-3">
                  {isWFMJury && !hasActiveSessions 
                    ? "Aucune session assignée" 
                    : "Aucun candidat en attente"
                  }
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {isWFMJury && !hasActiveSessions
                    ? "Vous devez être assigné à une session pour évaluer des candidats."
                    : "Tous les candidats accessibles ont été évalués ou aucune session n'est active."
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
                            {candidate.nom} {candidate.prenom}
                          </h3>
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
                          {candidate.session && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              <span>{candidate.session.jour}</span>
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
      </main>

      {/* Footer avec copyright */}
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}