//jury/evaluations/[id]/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers, cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryScoreForm } from "@/components/jury-score-form"
import { EvaluationStatusBanner } from "@/components/evaluation-status-banner"
import { canJuryMemberAccessCandidate, isSessionActive } from "@/lib/permissions"
import { checkSimulationUnlockStatus } from "@/lib/simulation-unlock"
import { NavigationBar } from "@/components/navigation-bar"   
import { AlertCircle, Briefcase, Building2, Calendar, CheckCircle, GraduationCap, Mail, MapPin, Phone } from "lucide-react"

export default async function JuryEvaluationPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  // ✅ CORRECTION : candidateId défini ICI, ligne 19
  const { id } = await params
  const candidateId = parseInt(id)
  
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  const cookieStore = await cookies()
  const viewMode = cookieStore.get('viewMode')?.value as 'WFM' | 'JURY' | undefined

  const userRole = (session.user as any).role || "JURY"
  
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
  
  const canAccessJuryPage = 
    userRole === "JURY" || 
    (isWFMJury && viewMode === 'JURY')

  if (!canAccessJuryPage) {
    redirect("/auth/login")
  }

  const juryMember = await prisma.juryMember.findFirst({
    where: { userId: session.user.id }
  })

  if (!juryMember) {
    redirect("/jury/dashboard")
  }

  // ✅ LIGNE 64 SUPPRIMÉE : const candidateId = parseInt(id) était ici dans l'ancien fichier
  
  // Récupérer tous les candidats évaluables pour la navigation
  const allEvaluableCandidates = await prisma.candidate.findMany({
    where: {
      AND: [
        { availability: 'OUI' },
        {
          session: {
            status: {
              in: ["PLANIFIED", "IN_PROGRESS"]
            }
          }
        },
        {
          OR: [
            { scores: null },
            { scores: { statut: 'PRESENT' } }
          ]
        }
      ]
    },
    select: {
      id: true,
      nom: true,
      prenom: true
    },
    orderBy: {
      id: 'asc'
    }
  })

  // Calculer la position et les candidats précédent/suivant
  const currentIndex = allEvaluableCandidates.findIndex(c => c.id === candidateId)
  const currentPosition = currentIndex >= 0 ? currentIndex + 1 : null
  const totalCandidates = allEvaluableCandidates.length
  
  const previousCandidate = currentIndex > 0 ? allEvaluableCandidates[currentIndex - 1] : null
  const nextCandidate = currentIndex < allEvaluableCandidates.length - 1 ? allEvaluableCandidates[currentIndex + 1] : null

  // ✅ Récupérer le candidat actuel avec ses scores - candidateId est maintenant défini ligne 20
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      session: true,
      scores: {
        select: {
          id: true,
          statut: true,
          finalDecision: true,
          evaluatedBy: true
        }
      },
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

  if (candidate.scores?.statut?.toString() === 'ABSENT') {
    redirect("/jury/evaluations?error=absent")
  }

  if (candidate.availability.toString() === 'NON') {
    redirect("/jury/evaluations?error=unavailable")
  }

  const hasAccess = await canJuryMemberAccessCandidate(juryMember, candidate)
  if (!hasAccess) {
    redirect("/jury/evaluations")
  }

  if (!candidate.session || !isSessionActive(candidate.session)) {
    redirect("/jury/evaluations")
  }

  const phase1Score = candidate.faceToFaceScores.find(s => s.phase === 1)
  const phase2Score = candidate.faceToFaceScores.find(s => s.phase === 2)
  
  const phase1Complete = !!phase1Score
  const needsSimulation = candidate.metier === 'AGENCES' || candidate.metier === 'TELEVENTE'
  const isReseauxSociaux = candidate.metier === 'RESEAUX_SOCIAUX'
  
  let allPhase1Scores: { appetenceDigitale: any; juryMemberId: number }[] = []
  let averageAppetenceDigitale = null
  let appetenceDigitaleScoresCount = 0
  
  if (isReseauxSociaux) {
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

    const scoresWithAppetence = allPhase1Scores.filter(score => 
      score.appetenceDigitale !== null && score.appetenceDigitale !== undefined
    )

    appetenceDigitaleScoresCount = scoresWithAppetence.length

    if (scoresWithAppetence.length > 0) {
      const total = scoresWithAppetence.reduce((sum, score) => {
        if (score.appetenceDigitale === null) return sum
        const value = Number(score.appetenceDigitale)
        return sum + value
      }, 0)
      
      averageAppetenceDigitale = total / scoresWithAppetence.length
    }
  }

  let canDoPhase2 = false
  let unlockStatus = null

  if (needsSimulation && phase1Complete) {
    unlockStatus = await checkSimulationUnlockStatus(candidate.id, candidate.metier)
    canDoPhase2 = unlockStatus.unlocked
  }
  
  const fullName = `${candidate.prenom} ${candidate.nom}`
  const isFullyEvaluated = needsSimulation 
    ? (phase1Complete && !!phase2Score) 
    : phase1Complete

  const isAbsent = candidate.scores?.statut?.toString() === 'ABSENT'
  const isUnavailable = candidate.availability.toString() === 'NON'

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-cyan-50">
      <DashboardHeader user={session.user} />
      
      <main className="container mx-auto p-6 space-y-6 max-w-6xl">
        
        {/* ✅ Barre de navigation (Client Component) */}
        <NavigationBar
          previousCandidateId={previousCandidate?.id ?? null}
          nextCandidateId={nextCandidate?.id ?? null}
          currentPosition={currentPosition}
          totalCandidates={totalCandidates}
        />

        {/* Bannière d'alerte */}
        {(isAbsent || isUnavailable) && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-red-800 text-lg">
                  {isAbsent ? 'Candidat Absent' : 'Candidat Non Disponible'}
                </h3>
                <p className="text-red-700">
                  {isAbsent 
                    ? 'Ce candidat a été marqué comme absent par le WFM.'
                    : 'Ce candidat n\'est pas disponible pour évaluation.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message de statut d'évaluation */}
        <EvaluationStatusBanner
          isFullyEvaluated={isFullyEvaluated}
          phase1Complete={phase1Complete}
          phase2Score={!!phase2Score}
          needsSimulation={needsSimulation}
          canDoPhase2={canDoPhase2}
        />

        {/* En-tête candidat */}
        <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-xl border-2 border-orange-200 p-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-amber-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <span className="text-white font-bold text-2xl">
                  {candidate.prenom.charAt(0)}{candidate.nom.charAt(0)}
                </span>
              </div>
              {candidate.scores?.statut && (
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white shadow-lg ${
                  candidate.scores.statut.toString() === 'PRESENT' ? 'bg-green-500' : 'bg-red-500'
                }`} />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                    {fullName}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-2 border-orange-300 shadow-sm">
                      <Briefcase className="w-4 h-4 mr-2" />
                      {candidate.metier}
                    </span>
                    {candidate.scores?.statut && (
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-sm font-semibold border-2 shadow-sm ${
                        candidate.scores.statut.toString() === 'PRESENT' 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300' 
                          : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                          candidate.scores.statut.toString() === 'PRESENT' ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        {candidate.scores.statut.toString() === 'PRESENT' ? 'Présent' : 'Absent'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations candidat en grille */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: Calendar, label: 'Âge', value: `${candidate.age} ans`, color: 'orange' },
                  { icon: GraduationCap, label: 'Diplôme', value: candidate.diploma, color: 'cyan' },
                  { icon: Building2, label: 'Université', value: candidate.institution, color: 'orange' },
                  { icon: MapPin, label: 'Localisation', value: candidate.location, color: 'cyan' },
                  { icon: Mail, label: 'Email', value: candidate.email || 'N/A', color: 'orange' },
                  { icon: Phone, label: 'Téléphone', value: candidate.phone, color: 'cyan' },
                ].map(({ icon: Icon, label, value, color }, index) => (
                  <div 
                    key={index} 
                    className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      color === 'orange' 
                        ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:border-orange-400' 
                        : 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200 hover:border-cyan-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                        color === 'orange' 
                          ? 'bg-gradient-to-br from-orange-500 to-amber-500' 
                          : 'bg-gradient-to-br from-cyan-500 to-blue-500'
                      }`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                        <p className="font-semibold text-gray-800 text-sm truncate">{value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Indicateur de phases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
              phase1Complete 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-lg' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110 ${
                    phase1Complete 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-br from-orange-500 to-amber-500'
                  }`}>
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  <div>
                    <p className={`font-bold text-lg ${
                      phase1Complete ? 'text-green-800' : 'text-orange-800'
                    }`}>
                      Phase Face-à-Face
                    </p>
                    <p className="text-xs text-gray-600">Évaluation initiale</p>
                  </div>
                </div>
                {phase1Complete && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Complétée</span>
                  </div>
                )}
              </div>
            </div>

            {needsSimulation && (
              <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                canDoPhase2 
                  ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-300 shadow-lg' 
                  : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300 opacity-75'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform duration-300 ${
                      canDoPhase2 
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-500 hover:scale-110' 
                        : 'bg-gradient-to-br from-gray-400 to-slate-400'
                    }`}>
                      <span className="text-white font-bold text-lg">2</span>
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${
                        canDoPhase2 ? 'text-cyan-800' : 'text-gray-600'
                      }`}>
                        Phase Simulation
                      </p>
                      <p className="text-xs text-gray-600">
                        {canDoPhase2 
                          ? 'Disponible maintenant' 
                          : !phase1Complete
                            ? 'Complétez Phase 1 d\'abord'
                            : 'En attente de validation'
                        }
                      </p>
                    </div>
                  </div>
                  {phase2Score && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm">
                      <CheckCircle className="w-4 h-4 text-cyan-600" />
                      <span className="text-sm font-semibold text-cyan-700">Complétée</span>
                    </div>
                  )}
                </div>
                
                {!canDoPhase2 && phase1Complete && unlockStatus && unlockStatus.missingConditions && unlockStatus.missingConditions.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Conditions pour débloquer :
                    </p>
                    <ul className="text-xs text-amber-700 list-disc pl-5 space-y-1">
                      {unlockStatus.missingConditions.map((condition, index) => (
                        <li key={index}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Formulaire d'évaluation */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-orange-200 p-8">
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
            // Props de navigation
            nextCandidateId={nextCandidate?.id || null}
            previousCandidateId={previousCandidate?.id || null}
            currentPosition={currentPosition}
            totalCandidates={totalCandidates}
          />
        </div>

        {/* Affichage des évaluations existantes */}
        {(phase1Score || phase2Score) && (
          <div className="bg-gradient-to-br from-white to-cyan-50 rounded-2xl shadow-xl border-2 border-cyan-200 p-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-cyan-600 bg-clip-text text-transparent mb-6">
              Vos évaluations
            </h2>
            
            {phase1Score && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  Phase Face à Face 
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {candidate.metier === 'AGENCES' && phase1Score.presentationVisuelle && (
                    <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200 hover:shadow-lg transition-all duration-300">
                      <p className="text-sm text-orange-600 mb-2 font-semibold">Présentation visuelle</p>
                      <p className="text-3xl font-bold text-orange-800">
                        {Number(phase1Score.presentationVisuelle).toFixed(2)} <span className="text-lg text-orange-600">/ 5</span>
                      </p>
                    </div>
                  )}
                  
                  <div className="p-5 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border-2 border-cyan-200 hover:shadow-lg transition-all duration-300">
                    <p className="text-sm text-cyan-600 mb-2 font-semibold">Communication verbale</p>
                    <p className="text-3xl font-bold text-cyan-800">
                      {Number(phase1Score.verbalCommunication).toFixed(2)} <span className="text-lg text-cyan-600">/ 5</span>
                    </p>
                  </div>
                  
                  <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200 hover:shadow-lg transition-all duration-300">
                    <p className="text-sm text-orange-600 mb-2 font-semibold">Qualité de la voix</p>
                    <p className="text-3xl font-bold text-orange-800">
                      {Number(phase1Score.voiceQuality).toFixed(2)} <span className="text-lg text-orange-600">/ 5</span>
                    </p>
                  </div>
                  
                  {isReseauxSociaux && (
                    <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 hover:shadow-lg transition-all duration-300">
                      <p className="text-sm text-purple-600 mb-2 font-semibold flex items-center gap-2">
                        <span>🌐</span>
                        Appétence digitale
                      </p>
                      <p className="text-3xl font-bold text-purple-800">
                        {phase1Score.appetenceDigitale 
                          ? `${Number(phase1Score.appetenceDigitale).toFixed(2)} / 5`
                          : "Non noté"}
                      </p>
                    </div>
                  )}
                </div>

                <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                  phase1Score.decision === 'FAVORABLE' 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-lg' 
                    : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300 shadow-lg'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-700 text-lg">Votre décision</p>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                      phase1Score.decision === 'FAVORABLE' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {phase1Score.decision === 'FAVORABLE' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span className="text-xl font-bold">
                        {phase1Score.decision === 'FAVORABLE' ? 'FAVORABLE' : 'DÉFAVORABLE'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {phase1Score.comments && (
                  <div className="mt-4 p-5 bg-gray-50 rounded-2xl border-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-2 font-semibold">Commentaires</p>
                    <p className="text-gray-700 leading-relaxed">{phase1Score.comments}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
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

            {phase2Score && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  Phase Simulation 
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-5 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border-2 border-cyan-200 hover:shadow-lg transition-all duration-300">
                    <p className="text-sm text-cyan-600 mb-2 font-semibold">Sens négociation</p>
                    <p className="text-3xl font-bold text-cyan-800">
                      {Number(phase2Score.simulationSensNegociation).toFixed(2)} <span className="text-lg text-cyan-600">/ 5</span>
                    </p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border-2 border-orange-200 hover:shadow-lg transition-all duration-300">
                    <p className="text-sm text-orange-600 mb-2 font-semibold">Capacité persuasion</p>
                    <p className="text-3xl font-bold text-orange-800">
                      {Number(phase2Score.simulationCapacitePersuasion).toFixed(2)} <span className="text-lg text-orange-600">/ 5</span>
                    </p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border-2 border-cyan-200 hover:shadow-lg transition-all duration-300">
                    <p className="text-sm text-cyan-600 mb-2 font-semibold">Sens combativité</p>
                    <p className="text-3xl font-bold text-cyan-800">
                      {Number(phase2Score.simulationSensCombativite).toFixed(2)} <span className="text-lg text-cyan-600">/ 5</span>
                    </p>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                  phase2Score.decision === 'FAVORABLE' 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-lg' 
                    : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300 shadow-lg'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-700 text-lg">Décision</p>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                      phase2Score.decision === 'FAVORABLE' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {phase2Score.decision === 'FAVORABLE' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span className="text-xl font-bold">
                        {phase2Score.decision === 'FAVORABLE' ? 'FAVORABLE' : 'DÉFAVORABLE'}
                      </span>
                    </div>
                  </div>
                </div>

                {phase2Score.comments && (
                  <div className="mt-4 p-5 bg-gray-50 rounded-2xl border-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-2 font-semibold">Commentaires</p>
                    <p className="text-gray-700 leading-relaxed">{phase2Score.comments}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
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

      <footer className="border-t mt-8 py-4 bg-white">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}