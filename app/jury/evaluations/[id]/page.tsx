// app/jury/evaluations/[id]/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryScoreForm } from "@/components/jury-score-form"
import { 
  User, 
  Calendar, 
  BookOpen, 
  Target,
  Award,
  MapPin,
  Clock,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function JuryEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
    }
  })

  if (!juryMember) {
    redirect("/jury/dashboard")
  }

  // Récupérer le candidat avec Prisma - CORRECTION DES CHAMPS
  const candidate = await prisma.candidate.findUnique({
    where: { 
      id: parseInt(id) 
    },
    include: {
      session: {
        select: {
          metier: true,
          date: true,
          jour: true,
          location: true,
          description: true
        }
      },
      scores: {
        select: {
          finalDecision: true,
          voiceQuality: true,
          verbalCommunication: true,
          psychotechnicalTest: true
        }
      },
      faceToFaceScores: {
        where: {
          juryMemberId: juryMember.id
        },
        include: {
          juryMember: {
            select: {
              fullName: true,
              roleType: true
            }
          }
        }
      }
    }
  })

  if (!candidate) {
    redirect("/jury/evaluations")
  }

  // VÉRIFICATION DES PERMISSIONS - IMPORTANT !
  if (!canJuryMemberAccessCandidate(juryMember, candidate)) {
    redirect("/jury/evaluations")
  }

  // Récupérer les scores existants avec Prisma
  const existingScores = await prisma.faceToFaceScore.findMany({
    where: {
      candidateId: parseInt(id),
      juryMemberId: juryMember.id
    },
    orderBy: {
      phase: 'asc'
    }
  })

  // CONVERSION DES DECIMAL EN NUMBER - CORRECTION DE L'ERREUR
  const serializedExistingScores = existingScores.map(score => ({
    ...score,
    score: score.score.toNumber(),
  }))

  // 🔍 CORRECTION : Conversion des scores Decimal en number pour l'affichage
  const serializedCandidate = {
    ...candidate,
    scores: candidate.scores ? {
      ...candidate.scores,
      voiceQuality: candidate.scores.voiceQuality?.toNumber() || null,
      verbalCommunication: candidate.scores.verbalCommunication?.toNumber() || null,
      psychotechnicalTest: candidate.scores.psychotechnicalTest?.toNumber() || null,
    } : null
  }

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case 'DRH':
        return <Award className="w-4 h-4" />
      case 'EPC':
        return <User className="w-4 h-4" />
      case 'REPRESENTANT_METIER':
        return <Target className="w-4 h-4" />
      case 'WFM_JURY':
        return <User className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getDecisionColor = (decision?: string) => {
    if (!decision) return 'bg-gray-100 text-gray-700'
    return decision === 'RECRUTE' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-red-100 text-red-700'
  }

  const getDecisionIcon = (decision?: string) => {
    if (!decision) return null
    return decision === 'RECRUTE' 
      ? <Award className="w-3 h-3 mr-1" />
      : <AlertTriangle className="w-3 h-3 mr-1" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardHeader user={session.user} role="JURY" />
      <main className="container mx-auto p-6 max-w-4xl">
        {/* En-tête avec navigation */}
        <div className="mb-8">
          <Link href="/jury/evaluations">
            <Button variant="outline" className="mb-6 border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 text-gray-700 rounded-xl transition-all duration-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux évaluations
            </Button>
          </Link>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Évaluation Face à Face</h1>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-xl font-semibold text-gray-800">{serializedCandidate.fullName}</h2>
                    {serializedCandidate.scores?.finalDecision && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDecisionColor(serializedCandidate.scores.finalDecision)}`}>
                        {getDecisionIcon(serializedCandidate.scores.finalDecision)}
                        {serializedCandidate.scores.finalDecision === 'RECRUTE' ? 'Admis' : 'Non admis'}
                      </span>
                    )}
                  </div>
                  
                  {/* Informations du candidat */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Métier:</span>
                        <span>{serializedCandidate.metier}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Âge:</span>
                        <span>{serializedCandidate.age} ans</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Diplôme:</span>
                        <span>{serializedCandidate.diploma}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {serializedCandidate.session && (
                        <>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">Session:</span>
                            <span>{serializedCandidate.session.metier}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">Date:</span>
                            <span>{serializedCandidate.session.jour} {serializedCandidate.session.date.toLocaleDateString('fr-FR')}</span>
                          </div>
                          {serializedCandidate.session.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-orange-500" />
                              <span className="font-medium">Lieu:</span>
                              <span>{serializedCandidate.session.location}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge du rôle du jury */}
              <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-xl border border-orange-200">
                {getRoleIcon(juryMember.roleType)}
                <span className="text-sm font-semibold text-orange-700 capitalize">
                  {juryMember.roleType.toLowerCase().replace(/_/g, ' ')}
                </span>
                {juryMember.specialite && (
                  <>
                    <span className="text-orange-400">•</span>
                    <span className="text-sm text-orange-600">{juryMember.specialite}</span>
                  </>
                )}
              </div>
            </div>

            {/* Scores techniques existants */}
            {serializedCandidate.scores && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Scores Techniques Existants</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Qualité Vocale', value: serializedCandidate.scores.voiceQuality },
                    { label: 'Communication', value: serializedCandidate.scores.verbalCommunication },
                    { label: 'Test Psycho.', value: serializedCandidate.scores.psychotechnicalTest }
                  ].map((score, index) => (
                    score.value && (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-sm text-gray-600 mb-1">{score.label}</div>
                        <div className="text-xl font-bold text-gray-800">{score.value}/20</div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Formulaire d'évaluation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <JuryScoreForm 
            candidate={serializedCandidate} 
            juryMember={juryMember} 
            existingScores={serializedExistingScores}
          />
        </div>

        {/* Instructions d'évaluation */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-6 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900">Instructions d'Évaluation</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-orange-800">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                <div><strong>Phase 1</strong> : Évaluation comportementale et motivation</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                <div><strong>Phase 2</strong> : Évaluation technique et connaissances</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                <div><strong>Échelle</strong> : 0 à 5 points par critère</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                <div><strong>Sauvegarde</strong> : Enregistrez régulièrement</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// FONCTION DE VÉRIFICATION DES PERMISSIONS
function canJuryMemberAccessCandidate(juryMember: any, candidate: any) {
  // DRH, EPC et WFM_JURY peuvent voir tous les candidats
  if (["DRH", "EPC", "WFM_JURY"].includes(juryMember.roleType)) {
    return true
  }

  // REPRESENTANT_METIER ne voit que les candidats de son métier
  if (juryMember.roleType === "REPRESENTANT_METIER") {
    return juryMember.specialite === candidate.metier
  }

  return false
}

// Correction des métadonnées pour Next.js
export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    colorScheme: "light",
  }
}

export const metadata = {
  title: "Évaluation Candidat",
  description: "Évaluation face à face du candidat",
}