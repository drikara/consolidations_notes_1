import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers, cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryScoreForm } from "@/components/jury-score-form"
import { EvaluationStatusBanner } from "@/components/evaluation-status-banner"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  ArrowLeft, 
  User, 
  Briefcase, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Mail, 
  Phone,
  Building2
} from 'lucide-react'
import { canJuryMemberAccessCandidate, isSessionActive } from "@/lib/permissions"
import { checkSimulationUnlockStatus } from "@/lib/simulation-unlock"

export default async function JuryEvaluationPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  // ✅ Lire le cookie viewMode
  const cookieStore = await cookies()
  const viewMode = cookieStore.get('viewMode')?.value as 'WFM' | 'JURY' | undefined

  const userRole = (session.user as any).role || "JURY"
  
  // ✅ Récupérer les infos utilisateur pour vérifier WFM_JURY
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      juryMember: {
        select: {
          roleType: true,
          isActive: true
        }
      }
    }
  })

  const isWFMJury = user?.role === 'WFM' && user?.juryMember?.roleType === 'WFM_JURY'
  
  console.log('🔐 Jury Evaluation [id] Page - Auth check:', {
    candidateId: id,
    userRole,
    isWFMJury,
    viewMode,
    hasJuryMember: !!user?.juryMember
  })

  // ✅ Logique de vérification améliorée
  const canAccessJuryPage = 
    userRole === "JURY" || // JURY standard
    (isWFMJury && viewMode === 'JURY') // WFM_JURY en mode JURY

  if (!canAccessJuryPage) {
    console.log('🚫 Accès refusé à la page Jury Evaluation:', {
      userRole,
      isWFMJury,
      viewMode,
      reason: isWFMJury ? 'WFM_JURY pas en mode JURY' : 'Pas JURY ni WFM_JURY'
    })
    redirect("/auth/login")
  }

  const juryMember = await prisma.juryMember.findFirst({
    where: { userId: session.user.id }
  })

  if (!juryMember) {
    console.log('🚫 Aucun profil juryMember trouvé')
    redirect("/jury/dashboard")
  }

  const candidateId = parseInt(id)
  
  // Récupérer le candidat avec ses scores face à face POUR LE JURY ACTUEL
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      session: true,
      scores: true,
      faceToFaceScores: {
        where: { 
          juryMemberId: juryMember.id
        },
        orderBy: [
          { phase: 'asc' },
          { evaluatedAt: 'desc' }
        ]
      }
    }
  })

  if (!candidate) {
    redirect("/jury/evaluations")
  }

  const hasAccess = await canJuryMemberAccessCandidate(juryMember, candidate)
  if (!hasAccess) {
    redirect("/jury/evaluations")
  }

  if (!candidate.session || !isSessionActive(candidate.session)) {
    redirect("/jury/evaluations")
  }

  // Vérifier Phase Face à Face et Phase Simulation
  const phase1Score = candidate.faceToFaceScores.find(s => s.phase === 1)
  const phase2Score = candidate.faceToFaceScores.find(s => s.phase === 2)
  
  const phase1Complete = !!phase1Score
  const needsSimulation = candidate.metier === 'AGENCES' || candidate.metier === 'TELEVENTE'
  const isReseauxSociaux = candidate.metier === 'RESEAUX_SOCIAUX'
  
  // 🆕 Récupérer TOUS les scores de phase 1 pour ce candidat (tous les jurys)
  let averageAppetenceDigitale = null
  let appetenceDigitaleScoresCount = 0
  let allPhase1Scores: { appetenceDigitale: any; juryMemberId: number }[] = []
  
  if (isReseauxSociaux) {
    // Récupérer tous les scores de phase 1 pour ce candidat (tous les jurys)
    allPhase1Scores = await prisma.faceToFaceScore.findMany({
      where: {
        candidateId: candidate.id,
        phase: 1
      },
      select: {
        appetenceDigitale: true,
        juryMemberId: true
      }
    })

    console.log('📊 Debug - Scores récupérés pour la moyenne:', {
      candidateId: candidate.id,
      allPhase1ScoresCount: allPhase1Scores.length,
      allPhase1Scores: allPhase1Scores
    })

    // Filtrer seulement les scores avec appetenceDigitale non null
    const scoresWithAppetence = allPhase1Scores.filter(score => 
      score.appetenceDigitale !== null && score.appetenceDigitale !== undefined
    )

    appetenceDigitaleScoresCount = scoresWithAppetence.length

    if (scoresWithAppetence.length > 0) {
      // Calculer la moyenne
      const total = scoresWithAppetence.reduce((sum, score) => {
        if (score.appetenceDigitale === null) return sum
        // Convertir en nombre
        const value = Number(score.appetenceDigitale)
        console.log('📊 Valeur appétence digitale:', value)
        return sum + value
      }, 0)
      
      averageAppetenceDigitale = total / scoresWithAppetence.length
      
      console.log('📊 Moyenne calculée:', {
        total,
        count: scoresWithAppetence.length,
        average: averageAppetenceDigitale
      })
    } else {
      console.log('📊 Aucun score avec appétence digitale trouvé')
    }
  }

  let canDoPhase2 = false
  let unlockStatus = null

  if (needsSimulation && phase1Complete) {
    unlockStatus = await checkSimulationUnlockStatus(candidate.id, candidate.metier)
    canDoPhase2 = unlockStatus.unlocked
  }
  
  const fullName = `${candidate.prenom} ${candidate.nom}`

  // 🆕 Déterminer l'état d'avancement de l'évaluation
  const isFullyEvaluated = needsSimulation 
    ? (phase1Complete && !!phase2Score) 
    : phase1Complete

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardHeader user={session.user} />
      
      <main className="container mx-auto p-6 space-y-6">
        <Link href="/jury/evaluations">
          <Button variant="outline" className="flex items-center my-4 bg-orange-500 text-white hover:bg-orange-600 transition-all duration-200 shadow-md cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Retour aux évaluations
          </Button>
        </Link>

        {/* 🆕 Message de statut d'évaluation */}
        <EvaluationStatusBanner
          isFullyEvaluated={isFullyEvaluated}
          phase1Complete={phase1Complete}
          phase2Score={!!phase2Score}
          needsSimulation={needsSimulation}
          canDoPhase2={canDoPhase2}
        />

        {/* En-tête candidat */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{fullName}</h1>
              <p className="text-gray-600 mt-1">Évaluation - {candidate.metier}</p>
              {isReseauxSociaux && (
                <div className="inline-flex items-center px-3 py-1 mt-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Métier RESEAUX SOCIAUX - Appétence digitale requise
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 text-gray-700">
              <Briefcase className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Métier</p>
                <p className="font-semibold">{candidate.metier}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Âge</p>
                <p className="font-semibold">{candidate.age} ans</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <GraduationCap className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Diplôme</p>
                <p className="font-semibold">{candidate.diploma}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Building2 className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Université</p>
                <p className="font-semibold text-sm">{candidate.institution}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-semibold text-sm">{candidate.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Phone className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Téléphone</p>
                <p className="font-semibold">{candidate.phone}</p>
              </div>
            </div>
          </div>

          {/* Indicateur de phases */}
          <div className="space-y-3">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-orange-800"> Face-à-Face</p>
                    {isReseauxSociaux && (
                      <p className="text-sm text-purple-600 mt-1">
                        🌐 Inclut l'évaluation de l'appétence digitale
                      </p>
                    )}
                  </div>
                </div>
                {phase1Complete && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                    ✅ Complétée
                  </span>
                )}
              </div>
            </div>

            {needsSimulation && (
              <div className={`p-4 border rounded-xl ${
                canDoPhase2 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      canDoPhase2 ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className={`font-semibold ${
                        canDoPhase2 ? 'text-green-800' : 'text-gray-600'
                      }`}>
                         Simulation 
                      </p>
                      <p className={`text-sm ${
                        canDoPhase2 ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {canDoPhase2 
                          ? 'Disponible - Moyennes validées ✅' 
                          : !phase1Complete
                            ? 'Complétez Phase Face à Face d\'abord'
                            : unlockStatus && unlockStatus.missingConditions && unlockStatus.missingConditions.length > 0
                              ? 'Conditions de déblocage manquantes'
                              : 'En attente de validation'
                        }
                      </p>
                    </div>
                  </div>
                  {phase2Score && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                      ✅ Complétée
                    </span>
                  )}
                </div>
                
                {!canDoPhase2 && phase1Complete && unlockStatus && unlockStatus.missingConditions && unlockStatus.missingConditions.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      ⚠️ Conditions pour débloquer la simulation :
                    </p>
                    <ul className="text-xs text-yellow-700 list-disc pl-4 space-y-1">
                      {unlockStatus.missingConditions.map((condition, index) => (
                        <li key={index}>{condition}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-yellow-600 mt-2 italic">
                      Note : Seules les moyennes comptent pour le déblocage, pas les décisions individuelles.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Formulaire d'évaluation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <JuryScoreForm 
            candidate={{
              id: candidate.id,
              fullName: fullName,
              metier: candidate.metier
            }}
            juryMember={{
              id: juryMember.id,
              fullName: juryMember.fullName,
              roleType: juryMember.roleType
            }}
            phase1Complete={phase1Complete}
            canDoPhase2={canDoPhase2}
          />
        </div>

        {/* Affichage des évaluations existantes */}
        {(phase1Score || phase2Score) && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Vos évaluations</h2>
            
            {/* Phase Face à Face */} 
            {phase1Score && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">1</span>
                  </div>
                  Phase Face à Face 
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* ✅ Pour AGENCES : Présentation visuelle */}
                  {candidate.metier === 'AGENCES' && phase1Score.presentationVisuelle && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-2">Présentation visuelle</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {Number(phase1Score.presentationVisuelle).toFixed(2)} / 5
                      </p>
                    </div>
                  )}
                  
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Communication verbale</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {Number(phase1Score.verbalCommunication).toFixed(2)} / 5
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Qualité de la voix</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {Number(phase1Score.voiceQuality).toFixed(2)} / 5
                    </p>
                  </div>
                  
                  {/* ✅ Pour RESEAUX_SOCIAUX : Appétence digitale individuelle */}
                  {isReseauxSociaux && (
                    <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                      <p className="text-sm text-purple-700 mb-2 font-semibold flex items-center gap-2">
                        <span>🌐</span>
                        Votre appétence digitale
                      </p>
                      <p className="text-2xl font-bold text-purple-800">
                        {phase1Score.appetenceDigitale 
                          ? `${Number(phase1Score.appetenceDigitale).toFixed(2)} / 5`
                          : "Non noté"}
                      </p>
                      {!phase1Score.appetenceDigitale && (
                        <p className="text-xs text-purple-500 mt-1">
                          Cette note n'a pas encore été attribuée
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 🆕 Affichage de la moyenne d'appétence digitale pour RESEAUX_SOCIAUX */}
                {isReseauxSociaux && averageAppetenceDigitale !== null && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 mb-2 font-semibold flex items-center gap-2">
                          <span className="text-lg">📊</span>
                          Moyenne d'appétence digitale (tous les jurys)
                        </p>
                        <p className="text-3xl font-bold text-purple-800">
                          {averageAppetenceDigitale.toFixed(2)} / 5
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`text-xs px-2 py-1 rounded ${
                            averageAppetenceDigitale >= 3 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {averageAppetenceDigitale >= 3 ? '✅ Seuil atteint' : '⚠️ En dessous du seuil'}
                          </div>
                          <p className="text-xs text-purple-500">
                            Seuil minimum: 3/5
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                          Moyenne globale
                        </div>
                        <p className="text-xs text-purple-500 mt-2">
                          Basée sur {appetenceDigitaleScoresCount} évaluation(s)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message si aucun autre jury n'a noté l'appétence digitale */}
                {isReseauxSociaux && averageAppetenceDigitale === null && phase1Score.appetenceDigitale && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <p className="text-sm text-blue-700 font-semibold mb-2">
                      ℹ️ Information sur l'appétence digitale
                    </p>
                    <p className="text-blue-600">
                      Vous êtes le premier jury à noter l'appétence digitale pour ce candidat.
                    </p>
                    <p className="text-xs text-blue-500 mt-2">
                      La moyenne sera disponible lorsque d'autres jurys auront évalué ce critère.
                    </p>
                  </div>
                )}

                <div className={`p-4 rounded-xl border-2 ${
                  phase1Score.decision === 'FAVORABLE' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-700">Votre décision</p>
                    <p className={`text-xl font-bold ${
                      phase1Score.decision === 'FAVORABLE' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {phase1Score.decision === 'FAVORABLE' ? '✅ FAVORABLE' : '❌ DÉFAVORABLE'}
                    </p>
                  </div>
                </div>
                {phase1Score.comments && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2 font-semibold">Commentaires</p>
                    <p className="text-gray-700">{phase1Score.comments}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Évalué le {new Date(phase1Score.evaluatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            {/* Phase simulation */}
            {phase2Score && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">2</span>
                  </div>
                  Phase Simulation 
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Sens négociation</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {Number(phase2Score.simulationSensNegociation).toFixed(2)} / 5
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Capacité persuasion</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {Number(phase2Score.simulationCapacitePersuasion).toFixed(2)} / 5
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Sens combativité</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {Number(phase2Score.simulationSensCombativite).toFixed(2)} / 5
                    </p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 ${
                  phase2Score.decision === 'FAVORABLE' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-700">Décision</p>
                    <p className={`text-xl font-bold ${
                      phase2Score.decision === 'FAVORABLE' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {phase2Score.decision === 'FAVORABLE' ? '✅ FAVORABLE' : '❌ DÉFAVORABLE'}
                    </p>
                  </div>
                </div>

                {phase2Score.comments && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2 font-semibold">Commentaires</p>
                    <p className="text-gray-700">{phase2Score.comments}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Évalué le {new Date(phase2Score.evaluatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}