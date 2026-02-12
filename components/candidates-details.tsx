'use client'

import { ArrowLeft, UserCheck, UserX, CheckCircle, XCircle, AlertTriangle, Phone, MessageSquare, BriefcaseBusiness, Building2 } from 'lucide-react'
import { RecruitmentStatut } from '@prisma/client'

export function CandidateDetails({ candidate, expectedJuryCount, hasAllJuryScores, existingScores }: any) {
  // Fonctions utilitaires
  const formatDate = (date: string | null): string => {
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

  const formatScore = (value: any): number => {
    if (value == null) return 0
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    return isNaN(num) ? 0 : num
  }

  const formatRecruitmentStatus = (status: RecruitmentStatut | null) => {
    if (!status) return 'Non spécifié'
    const statusMap: Record<RecruitmentStatut, string> = {
      STAGE: 'Stage',
      INTERIM: 'Intérim',
      CDI: 'CDI',
      CDD: 'CDD',
      AUTRE: 'Autre'
    }
    return statusMap[status]
  }

  const getRecruitmentStatusColor = (status: RecruitmentStatut | null) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200'
    const colorMap: Record<RecruitmentStatut, string> = {
      STAGE: 'bg-purple-100 text-purple-800 border-purple-200',
      INTERIM: 'bg-orange-100 text-orange-800 border-orange-200',
      CDI: 'bg-green-100 text-green-800 border-green-200',
      CDD: 'bg-blue-100 text-blue-800 border-blue-200',
      AUTRE: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colorMap[status]
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-6">
            <p className="text-red-700 font-semibold">Aucun candidat trouvé</p>
          </div>
        </div>
      </div>
    )
  }

  const isAgences = candidate.metier === "AGENCES"
  const isReseauxSociaux = candidate.metier === "RESEAUX_SOCIAUX"
  const needsSimulation = candidate.metier === "AGENCES" || candidate.metier === "TELEVENTE"
  const scores = candidate.scores || {}
  const isAbsent = scores.statut === 'ABSENT'
  const absenceMotif = scores.statut_commentaire || 'Motif non précisé'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header retour */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
        </div>

        {/* En-tête candidat */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {candidate.nom?.[0] || '?'}{candidate.prenom?.[0] || '?'}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {candidate.nom} {candidate.prenom}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-orange-700">
                {candidate.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {candidate.phone}
                  </div>
                )}
                {candidate.email && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {candidate.email}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                  {candidate.metier || 'Non spécifié'}
                </span>
                {/* ✅ Type d'agence pour AGENCES */}
                {isAgences && candidate.agenceType && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {candidate.agenceType}
                  </span>
                )}
                {candidate.location && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    {candidate.location}
                  </span>
                )}
                {candidate.age && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                    {candidate.age} ans
                  </span>
                )}
                <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getRecruitmentStatusColor(candidate.statutRecruitment)}`}>
                  <BriefcaseBusiness className="w-3 h-3 inline mr-1" />
                  {formatRecruitmentStatus(candidate.statutRecruitment)}
                </span>
              </div>
            </div>
            {/* Badge décision finale */}
            <div className={`px-6 py-3 rounded-xl font-bold text-lg border-2 flex items-center gap-2 shadow-lg ${
              isAbsent ? 'bg-gray-100 text-gray-700 border-gray-300' :
              scores.finalDecision === 'RECRUTE' 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300' 
                : scores.finalDecision === 'NON_RECRUTE'
                ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-300'
                : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-300'
            }`}>
              {isAbsent ? (
                <>
                  <UserX className="w-6 h-6" />
                  ABSENT
                </>
              ) : scores.finalDecision === 'RECRUTE' ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  RECRUTÉ
                </>
              ) : scores.finalDecision === 'NON_RECRUTE' ? (
                <>
                  <XCircle className="w-6 h-6" />
                  NON RECRUTÉ
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6" />
                  EN ATTENTE
                </>
              )}
            </div>
          </div>
        </div>

        {/* ⭐ Bloc candidat absent */}
        {isAbsent && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-800 mb-2">Candidat absent</h2>
                <p className="text-red-700 mb-3">
                  <span className="font-semibold">Motif :</span> {absenceMotif}
                </p>
                <div className="bg-white/60 rounded-lg p-4 border border-red-200">
                  <p className="text-gray-700">
                    Ce candidat a été marqué comme <strong>absent</strong>. 
                    Aucune évaluation n'a été enregistrée (toutes les notes sont N/A).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {candidate.availability && (
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Disponibilité</p>
              <p className={`font-bold ${candidate.availability === 'OUI' ? 'text-green-600' : 'text-red-600'}`}>
                {candidate.availability}
              </p>
            </div>
          )}
          {candidate.createdAt && (
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Date d'enregistrement</p>
              <p className="font-bold text-gray-900">{formatDate(candidate.createdAt)}</p>
            </div>
          )}
          {candidate.interviewDate && (
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Date d'entretien</p>
              <p className="font-bold text-gray-900">{formatDate(candidate.interviewDate)}</p>
            </div>
          )}
          {candidate.diploma && (
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Diplôme</p>
              <p className="font-bold text-gray-900">{candidate.diploma}</p>
            </div>
          )}
          {candidate.niveauEtudes && (
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Niveau d'études</p>
              <p className="font-bold text-gray-900">{candidate.niveauEtudes}</p>
            </div>
          )}
          {candidate.institution && (
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Université</p>
              <p className="font-bold text-gray-900">{candidate.institution}</p>
            </div>
          )}
          {candidate.statutRecruitment && (
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Statut de recrutement</p>
              <p className="font-bold text-gray-900">{formatRecruitmentStatus(candidate.statutRecruitment)}</p>
            </div>
          )}
          {candidate.birthDate && (
            <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Date de naissance</p>
              <p className="font-bold text-gray-900">{formatDate(candidate.birthDate)}</p>
            </div>
          )}
          {/* ✅ Carte type d'agence pour AGENCES */}
          {isAgences && candidate.agenceType && (
            <div className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-sm">
              <p className="text-sm text-indigo-600 mb-1 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Type d'agence
              </p>
              <p className="font-bold text-indigo-900 text-lg">
                {candidate.agenceType}
              </p>
            </div>
          )}
        </div>

        {/* ⚠️ Sections de scores – affichées uniquement si présent */}
        {!isAbsent && (
          <>
            {/* Phase Face à Face */}
            {(scores.presentationVisuelle != null || scores.verbalCommunication != null || scores.voiceQuality != null || scores.appetenceDigitale != null) && (
              <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-700 font-bold">1</span>
                    </div>
                    Phase Face à Face
                  </h2>
                  {scores.phase1Decision && (
                    <div className={`px-4 py-2 rounded-lg font-bold border-2 ${
                      scores.phase1Decision === 'ADMIS' 
                        ? 'bg-green-100 text-green-700 border-green-300' 
                        : 'bg-red-100 text-red-700 border-red-300'
                    }`}>
                      {scores.phase1Decision === 'ADMIS' ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          ADMIS
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <XCircle className="w-5 h-5" />
                          ÉLIMINÉ
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Moyennes */}
                <div className={`grid ${
                  isAgences ? 'grid-cols-3' : 
                  isReseauxSociaux ? 'grid-cols-3' : 
                  'grid-cols-2'
                } gap-4 mb-6`}>
                  {isAgences && scores.presentationVisuelle != null && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-blue-600 mb-1">Présentation Visuelle</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.presentationVisuelle) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.presentationVisuelle).toFixed(2)}/5
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ 3/5</p>
                    </div>
                  )}
                  {scores.verbalCommunication != null && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-blue-600 mb-1">Communication Verbale</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.verbalCommunication) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.verbalCommunication).toFixed(2)}/5
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ 3/5</p>
                    </div>
                  )}
                  {scores.voiceQuality != null && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm text-blue-600 mb-1">Qualité de la Voix</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.voiceQuality) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.voiceQuality).toFixed(2)}/5
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ 3/5</p>
                    </div>
                  )}
                  {isReseauxSociaux && scores.appetenceDigitale != null && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-600 mb-1">Appétence Digitale</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.appetenceDigitale) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.appetenceDigitale).toFixed(2)}/5
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ 3/5</p>
                    </div>
                  )}
                </div>

                {/* Évaluations individuelles */}
                {candidate.faceToFaceScores && candidate.faceToFaceScores.filter((s: any) => s.phase === 1).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Évaluations individuelles des jurys</h3>
                    <div className="space-y-3">
                      {candidate.faceToFaceScores.filter((s: any) => s.phase === 1).map((score: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="font-medium text-gray-900 mb-2">
                            {score.juryMember?.fullName} ({score.juryMember?.roleType})
                          </p>
                          <div className={`grid ${
                            isAgences ? 'grid-cols-3' : 
                            isReseauxSociaux ? 'grid-cols-3' : 
                            'grid-cols-2'
                          } gap-3 text-sm`}>
                            {isAgences && score.presentationVisuelle != null && (
                              <div>
                                <span className="text-gray-600">Présentation Visuelle:</span>
                                <span className="font-semibold ml-2 text-blue-600">{score.presentationVisuelle}/5</span>
                              </div>
                            )}
                            {score.verbalCommunication != null && (
                              <div>
                                <span className="text-gray-600">Communication vocale:</span>
                                <span className="font-semibold ml-2 text-blue-600">{score.verbalCommunication}/5</span>
                              </div>
                            )}
                            {score.voiceQuality != null && (
                              <div>
                                <span className="text-gray-600">Qualité de la Voix:</span>
                                <span className="font-semibold ml-2 text-blue-600">{score.voiceQuality}/5</span>
                              </div>
                            )}
                            {isReseauxSociaux && score.appetenceDigitale != null && (
                              <div>
                                <span className="text-gray-600">Appétence Digitale:</span>
                                <span className="font-semibold ml-2 text-purple-600">{score.appetenceDigitale}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phase Simulation */}
            {needsSimulation && (scores.simulationSensNegociation != null || scores.simulationCapacitePersuasion != null || scores.simulationSensCombativite != null) && (
              <div className="bg-white border-2 border-green-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-700 font-bold">2</span>
                    </div>
                    Phase Simulation
                  </h2>
                  {scores.phase2Decision && (
                    <div className={`px-4 py-2 rounded-lg font-bold border-2 ${
                      scores.phase2Decision === 'VALIDEE' 
                        ? 'bg-green-100 text-green-700 border-green-300' 
                        : 'bg-red-100 text-red-700 border-red-300'
                    }`}>
                      {scores.phase2Decision === 'VALIDEE' ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          VALIDÉE
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <XCircle className="w-5 h-5" />
                          NON VALIDÉE
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Moyennes */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {scores.simulationSensNegociation != null && (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-sm text-green-600 mb-1">Sens de Négociation</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.simulationSensNegociation) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.simulationSensNegociation).toFixed(2)}/5
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ 3/5</p>
                    </div>
                  )}
                  {scores.simulationCapacitePersuasion != null && (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-sm text-green-600 mb-1">Capacité de Persuasion</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.simulationCapacitePersuasion) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.simulationCapacitePersuasion).toFixed(2)}/5
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ 3/5</p>
                    </div>
                  )}
                  {scores.simulationSensCombativite != null && (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-sm text-green-600 mb-1">Sens de Combativité</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.simulationSensCombativite) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.simulationSensCombativite).toFixed(2)}/5
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ 3/5</p>
                    </div>
                  )}
                </div>

                {/* Évaluations individuelles */}
                {candidate.faceToFaceScores && candidate.faceToFaceScores.filter((s: any) => s.phase === 2).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Évaluations individuelles des jurys</h3>
                    <div className="space-y-3">
                      {candidate.faceToFaceScores.filter((s: any) => s.phase === 2).map((score: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="font-medium text-gray-900 mb-2">
                            {score.juryMember?.fullName} ({score.juryMember?.roleType})
                          </p>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            {score.simulationSensNegociation != null && (
                              <div>
                                <span className="text-gray-600">Négociation:</span>
                                <span className="font-semibold ml-2 text-green-600">{score.simulationSensNegociation}/5</span>
                              </div>
                            )}
                            {score.simulationCapacitePersuasion != null && (
                              <div>
                                <span className="text-gray-600">Persuasion:</span>
                                <span className="font-semibold ml-2 text-green-600">{score.simulationCapacitePersuasion}/5</span>
                              </div>
                            )}
                            {score.simulationSensCombativite != null && (
                              <div>
                                <span className="text-gray-600">Combativité:</span>
                                <span className="font-semibold ml-2 text-green-600">{score.simulationSensCombativite}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tests Techniques */}
            {(scores.typingSpeed != null || scores.typingAccuracy != null || scores.excelTest != null || 
              scores.dictation != null || scores.psychoRaisonnementLogique != null || 
              scores.psychoAttentionConcentration != null || scores.analysisExercise != null) && (
              <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-700 font-bold">📝</span>
                  </div>
                  Tests Techniques
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scores.typingSpeed != null && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-600 mb-1">Rapidité de Saisie</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.typingSpeed) >= 17 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.typingSpeed).toFixed(2)}/17 <span className="text-sm text-green-600">Mots par minute (MPM)</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ 17 MPM</p>
                    </div>
                  )}
                  {scores.typingAccuracy != null && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-600 mb-1">Précision</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.typingAccuracy) >= 75 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.typingAccuracy).toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ 75%</p>
                    </div>
                  )}
                  {scores.excelTest != null && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-600 mb-1">Test Excel</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.excelTest) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.excelTest).toFixed(2)}/5
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ 3/5</p>
                    </div>
                  )}
                  {scores.dictation != null && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-600 mb-1">Dictée</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.dictation) >= 14 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.dictation).toFixed(2)}/20
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Seuil: ≥ 14/20</p>
                    </div>
                  )}
                  {scores.psychoRaisonnementLogique != null && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-600 mb-1">Raisonnement Logique</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.psychoRaisonnementLogique) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.psychoRaisonnementLogique).toFixed(2)}/5
                      </p>
                    </div>
                  )}
                  {scores.psychoAttentionConcentration != null && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-600 mb-1">Attention/Concentration</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.psychoAttentionConcentration) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.psychoAttentionConcentration).toFixed(2)}/5
                      </p>
                    </div>
                  )}
                  {scores.analysisExercise != null && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-600 mb-1">Capacité d'Analyse</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.analysisExercise) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.analysisExercise).toFixed(2)}/5
                      </p>
                    </div>
                  )}
                  {scores.appetenceDigitale != null && (
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <p className="text-sm text-purple-600 mb-1">Appétence Digitale</p>
                      <p className={`text-3xl font-bold ${
                        formatScore(scores.appetenceDigitale) >= 3 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatScore(scores.appetenceDigitale).toFixed(2)}/5
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}