// app/jury/evaluations/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryEvaluationsList } from "@/components/jury-evaluations-list"
import { 
  User, 
  FileText, 
  CheckCircle, 
  Clock, 
  Users,
  Award,
  Target,
  BookOpen,
  Filter,
  BarChart3,
  Calendar
} from 'lucide-react'
import { canJuryMemberAccessCandidate, filterCandidatesForJury, isSessionActive } from "@/lib/permissions"

export default async function JuryEvaluationsPage() {
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

  // Récupérer le membre du jury avec Prisma
  const juryMember = await prisma.juryMember.findFirst({
    where: { 
      userId: session.user.id 
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  if (!juryMember) {
    redirect("/jury/dashboard")
  }

  // Récupérer tous les candidats avec leurs scores pour ce jury - SEULEMENT sessions actives
  const allCandidates = await prisma.candidate.findMany({
    where: {
      // FILTRE CRITIQUE : Seulement les candidats des sessions actives
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
          status: true // ← IMPORTANT : Ajouter le statut
        }
      },
      scores: {
        select: {
          finalDecision: true,
          callStatus: true
        }
      },
      faceToFaceScores: {
        where: {
          juryMemberId: juryMember.id
        },
        select: {
          phase: true,
          score: true,
          evaluatedAt: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // FILTRER POUR LES REPRÉSENTANTS MÉTIER
  const candidates = filterCandidatesForJury(allCandidates, juryMember)

  // Définir les types pour résoudre les erreurs TypeScript
  interface CandidateScore {
    phase: number
    score: any // Decimal de Prisma
    evaluatedAt: Date
  }

  interface FormattedCandidate {
    id: number
    fullName: string
    metier: string
    age: number
    diploma: string
    location: string
    availability: string
    interviewDate: Date | null
    session: any
    scores: any
    myScore: {
      score: number
      phase: number
      evaluatedAt: Date
    } | null
    evaluationStatus: 'not_evaluated' | 'phase1_only' | 'both_phases'
  }

  // Formater les données pour le composant avec conversion Decimal → Number
  const formattedCandidates: FormattedCandidate[] = candidates.map((candidate: any) => {
    const myScores: CandidateScore[] = candidate.faceToFaceScores
    const phase1Score = myScores.find((score: CandidateScore) => score.phase === 1)
    const phase2Score = myScores.find((score: CandidateScore) => score.phase === 2)

    // Conversion correcte de Decimal en number avec gestion des valeurs nulles
    const myScore = phase1Score || phase2Score ? {
      score: phase1Score?.score ? Number(phase1Score.score) : 
             phase2Score?.score ? Number(phase2Score.score) : 0,
      phase: phase1Score ? 1 : 2,
      evaluatedAt: phase1Score?.evaluatedAt || phase2Score?.evaluatedAt || new Date()
    } : null

    return {
      id: candidate.id,
      fullName: candidate.fullName,
      metier: candidate.metier,
      age: candidate.age,
      diploma: candidate.diploma,
      location: candidate.location,
      availability: candidate.availability,
      interviewDate: candidate.interviewDate,
      session: candidate.session,
      scores: candidate.scores,
      myScore: myScore,
      evaluationStatus: myScores.length === 0 ? 'not_evaluated' : 
                       myScores.length === 1 ? 'phase1_only' : 
                       'both_phases'
    }
  })

  // Calcul des statistiques avec types explicites
  const totalCandidates = formattedCandidates.length
  const evaluatedCount = formattedCandidates.filter((c: FormattedCandidate) => c.myScore).length
  const pendingCount = formattedCandidates.filter((c: FormattedCandidate) => !c.myScore).length
  const phase1OnlyCount = formattedCandidates.filter((c: FormattedCandidate) => c.evaluationStatus === 'phase1_only').length
  const bothPhasesCount = formattedCandidates.filter((c: FormattedCandidate) => c.evaluationStatus === 'both_phases').length

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case 'DRH':
        return <Award className="w-4 h-4" />
      case 'EPC':
        return <Users className="w-4 h-4" />
      case 'REPRESENTANT_METIER':
        return <Target className="w-4 h-4" />
      case 'WFM_JURY':
        return <User className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardHeader user={session.user} role="JURY" />
      <main className="container mx-auto p-6 space-y-8">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">Mes Évaluations</h1>
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
                <p className="text-gray-500 text-sm">
                  {totalCandidates} candidat(s) accessible(s) dans les sessions actives
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques détaillées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Candidats</p>
                <p className="text-3xl font-bold text-gray-800">{totalCandidates}</p>
                <p className="text-xs text-gray-500 mt-1">Accessibles pour évaluation</p>
              </div>
              <div className="bg-blue-500/20 text-blue-600 p-4 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Évaluations Complétées</p>
                <p className="text-3xl font-bold text-green-600">{evaluatedCount}</p>
                <p className="text-xs text-gray-500 mt-1">Avec score attribué</p>
              </div>
              <div className="bg-green-500/20 text-green-600 p-4 rounded-2xl">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">En Attente</p>
                <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
                <p className="text-xs text-gray-500 mt-1">À évaluer</p>
              </div>
              <div className="bg-orange-500/20 text-orange-600 p-4 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Phase 1 Seule</p>
                <p className="text-3xl font-bold text-purple-600">{phase1OnlyCount}</p>
                <p className="text-xs text-gray-500 mt-1">Comportemental évalué</p>
              </div>
              <div className="bg-purple-500/20 text-purple-600 p-4 rounded-2xl">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* En-tête de la liste avec filtres */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Filter className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Liste des Candidats</h2>
                <p className="text-gray-600 text-sm">
                  {formattedCandidates.length} candidat(s) à évaluer dans les sessions actives
                </p>
              </div>
            </div>
            
            {/* Filtres rapides */}
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm">
                <Users className="w-4 h-4" />
                Tous ({totalCandidates})
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200 transition-all duration-200">
                <CheckCircle className="w-4 h-4" />
                Évalués ({evaluatedCount})
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl text-sm font-medium hover:bg-orange-200 transition-all duration-200">
                <Clock className="w-4 h-4" />
                En attente ({pendingCount})
              </button>
            </div>
          </div>

          {/* Liste des évaluations */}
          <JuryEvaluationsList 
            candidates={formattedCandidates} 
            juryMemberId={juryMember.id} 
          />
        </div>

        {/* Guide d'évaluation amélioré */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-orange-900">Guide d'Évaluation Jury</h3>
              <p className="text-orange-700">Méthodologie et critères d'évaluation</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-5 border border-orange-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">Phase 1 - Entretien Comportemental</h4>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Présentation et communication</span>
                    <span className="font-semibold text-blue-600">20%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Motivation et attitude</span>
                    <span className="font-semibold text-blue-600">30%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Réponses aux questions RH</span>
                    <span className="font-semibold text-blue-600">50%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-5 border border-orange-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">2</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">Phase 2 - Évaluation Technique</h4>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Connaissances techniques</span>
                    <span className="font-semibold text-green-600">40%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Résolution de cas pratiques</span>
                    <span className="font-semibold text-green-600">40%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Compréhension des processus</span>
                    <span className="font-semibold text-green-600">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Note importante */}
          <div className="mt-6 bg-orange-200/50 rounded-lg p-4 border border-orange-300">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>Note importante :</strong> Seuls les candidats des sessions <strong>actives</strong> (planifiées ou en cours) sont accessibles pour évaluation. 
                Chaque phase est notée sur 5 points. Utilisez des demi-points si nécessaire (ex: 3.5/5).
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}