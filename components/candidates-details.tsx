"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, UserCheck, UserX } from "lucide-react"
import { Statut, FinalDecision, NiveauEtudes } from "@prisma/client"

interface CandidateDetailsProps {
  candidate: {
    id: number
    nom: string
    prenom: string
    phone: string
    email: string
    metier: string
    age: number
    location: string
    availability: string
    interviewDate: Date | null
    diploma: string
    niveauEtudes: NiveauEtudes
    institution: string
    birthDate: Date
    smsSentDate: Date | null
    session?: {
      id: string
      metier: string
      date: Date
      jour: string
      status: string
    } | null
    scores?: {
      statut?: Statut | null
      statutCommentaire?: string | null
      finalDecision?: FinalDecision | null
      callAttempts?: number | null
      lastCallDate?: Date | null
      callNotes?: string | null
      presentationVisuelle?: number | null
      verbalCommunication?: number | null
      voiceQuality?: number | null
      psychotechnicalTest?: number | null
      typingSpeed?: number | null
      typingAccuracy?: number | null
      excelTest?: number | null
      dictation?: number | null
      salesSimulation?: number | null
      analysisExercise?: number | null
      simulationSensNegociation?: number | null
      simulationCapacitePersuasion?: number | null
      simulationSensCombativite?: number | null
      psychoRaisonnementLogique?: number | null
      psychoAttentionConcentration?: number | null
      phase2Date?: Date | null
    } | null
    faceToFaceScores: Array<{
      score: number | any
      phase: number
      presentationVisuelle?: number | null
      verbalCommunication?: number | null
      voiceQuality?: number | null
      juryMember: {
        fullName: string
        roleType: string
        specialite?: string | null
      }
    }>
  }
}

export function CandidateDetails({ candidate }: CandidateDetailsProps) {
  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Candidat non trouvé</p>
          <Link href="/wfm/candidates" className="text-blue-600 hover:underline mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Non défini"
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const faceToFaceScores = candidate.faceToFaceScores || []
  const phase1Scores = faceToFaceScores.filter(score => score?.phase === 1) || []
  const phase2Scores = faceToFaceScores.filter(score => score?.phase === 2) || []

  const avgPhase1 = phase1Scores.length > 0 
    ? phase1Scores.reduce((sum, score) => {
        const pres = score?.presentationVisuelle ?? 0
        const verbal = score?.verbalCommunication ?? 0
        const voice = score?.voiceQuality ?? 0
        const juryAvg = (pres + verbal + voice) / 3
        return sum + juryAvg
      }, 0) / phase1Scores.length
    : 0

  const avgPhase2 = phase2Scores.length > 0 
    ? phase2Scores.reduce((sum, score) => sum + (score?.score || 0), 0) / phase2Scores.length 
    : 0

  const getDecisionColor = (decision: string | null) => {
    switch (decision) {
      case 'RECRUTE':
        return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200'
      case 'NON_RECRUTE':
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200'
      default:
        return 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200'
    }
  }

  const getStatutColor = (statut: string | null) => {
    switch (statut) {
      case 'PRESENT':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200'
      case 'ABSENT':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200'
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          href="/wfm/candidates/"
          className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>
      </div>

      {/* En-tête élégant */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {candidate.nom?.[0]}{candidate.prenom?.[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {candidate.nom} {candidate.prenom}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-orange-700">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {candidate.email || "Email non disponible"}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {candidate.phone || "Téléphone non disponible"}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/wfm/candidates/${candidate.id}/edit`}>
              <Button 
                variant="outline" 
                className="border-2 border-orange-300 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 rounded-xl px-6 font-semibold"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grille d'informations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <Card className="border-2 border-orange-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-100">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Informations Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
              <span className="font-semibold text-orange-700">Métier:</span>
              <span className="text-gray-900 font-medium">{candidate.metier || "Non spécifié"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
              <span className="font-semibold text-orange-700">Âge:</span>
              <span className="text-gray-900 font-medium">{candidate.age || "?"} ans</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
              <span className="font-semibold text-orange-700">Lieu:</span>
              <span className="text-gray-900 font-medium">{candidate.location || "Non spécifié"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
              <span className="font-semibold text-orange-700">Date de naissance:</span>
              <span className="text-gray-900 font-medium">{formatDate(candidate.birthDate)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Formation */}
        <Card className="border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v6l9-5-9-5-9 5 9 5z" />
              </svg>
              Formation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
              <span className="font-semibold text-blue-700">Diplôme:</span>
              <span className="text-gray-900 font-medium text-right">{candidate.diploma || "Non spécifié"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
              <span className="font-semibold text-blue-700">Niveau d'études:</span>
              <span className="text-gray-900 font-medium text-right">{candidate.niveauEtudes?.replace(/_/g, ' ') || "Non spécifié"}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
              <span className="font-semibold text-blue-700">Établissement:</span>
              <span className="text-gray-900 font-medium text-right">{candidate.institution || "Non spécifié"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Statut */}
        <Card className="border-2 border-purple-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-100">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Statut
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
              <span className="font-semibold text-purple-700">Disponibilité:</span>
              <span className="text-gray-900 font-medium">{candidate.availability === 'OUI' ? '✅ Oui' : '❌ Non'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
              <span className="font-semibold text-purple-700">Date entretien:</span>
              <span className="text-gray-900 font-medium">{formatDate(candidate.interviewDate)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
              <span className="font-semibold text-purple-700">SMS envoyé le:</span>
              <span className="text-gray-900 font-medium">{formatDate(candidate.smsSentDate)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
              <span className="font-semibold text-purple-700">Décision:</span>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 ${getDecisionColor(candidate.scores?.finalDecision || null)}`}>
                {candidate.scores?.finalDecision === 'RECRUTE' 
                  ? '🎯 RECRUTÉ' 
                  : candidate.scores?.finalDecision === 'NON_RECRUTE' 
                  ? '🚫 NON RECRUTÉ' 
                  : '⏳ EN ATTENTE'}
              </span>
            </div>
            
            {/* Nouveau: Statut de présence */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
              <span className="font-semibold text-purple-700">Présence:</span>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 ${getStatutColor(candidate.scores?.statut || null)} flex items-center gap-2`}>
                {candidate.scores?.statut === 'PRESENT' ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    PRÉSENT
                  </>
                ) : candidate.scores?.statut === 'ABSENT' ? (
                  <>
                    <UserX className="w-4 h-4" />
                    ABSENT
                  </>
                ) : (
                  'NON DÉFINI'
                )}
              </span>
            </div>
            
            {/* Commentaire du statut si absent */}
            {candidate.scores?.statut === 'ABSENT' && candidate.scores?.statutCommentaire && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <span className="font-semibold text-red-700">Justification absence:</span>
                <p className="text-gray-700 mt-1 text-sm">{candidate.scores.statutCommentaire}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scores et Session */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scores face à face */}
        <Card className="border-2 border-amber-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b-2 border-amber-100">
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Scores Face à Face
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Phase 1 */}
              <div>
                <h4 className="font-bold text-lg text-amber-800 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="text-amber-700 font-bold text-sm">1</span>
                  </div>
                  Phase 1 - Jury
                  {phase1Scores.length > 0 && (
                    <span className="ml-auto bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold">
                      Moyenne: {avgPhase1.toFixed(2)}/5
                    </span>
                  )}
                </h4>
                {phase1Scores.length > 0 ? (
                  <div className="space-y-3">
                    {phase1Scores.map((score, index) => {
                      // Calculer la moyenne du jury
                      const pres = score?.presentationVisuelle ?? 0
                      const verbal = score?.verbalCommunication ?? 0
                      const voice = score?.voiceQuality ?? 0
                      const juryAvg = (pres + verbal + voice) / 3
                      
                      return (
                        <div key={`phase1-${score.juryMember?.fullName}-${index}`} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <div>
                            <p className="font-semibold text-gray-900">{score.juryMember?.fullName || "Jury inconnu"}</p>
                            <p className="text-xs text-amber-600">{score.juryMember?.roleType || "Rôle non spécifié"}</p>
                          </div>
                          <span className="bg-white px-3 py-1 rounded-lg border border-amber-300 font-bold text-amber-700">
                            {juryAvg.toFixed(2)}/5
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-amber-50 rounded-xl border-2 border-dashed border-amber-200">
                    <svg className="w-8 h-8 text-amber-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-amber-600 font-medium">Aucun score du jury</p>
                  </div>
                )}
              </div>

              {/* Phase 2 si disponible */}
              {phase2Scores.length > 0 && (
                <div>
                  <h4 className="font-bold text-lg text-amber-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                      <span className="text-amber-700 font-bold text-sm">2</span>
                    </div>
                    Phase 2 - Jury
                    <span className="ml-auto bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold">
                      Moyenne: {avgPhase2.toFixed(2)}/5
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {phase2Scores.map((score, index) => (
                      <div key={`phase2-${score.juryMember?.fullName}-${index}`} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <div>
                          <p className="font-semibold text-gray-900">{score.juryMember?.fullName || "Jury inconnu"}</p>
                          <p className="text-xs text-amber-600">{score.juryMember?.roleType || "Rôle non spécifié"}</p>
                        </div>
                        <span className="bg-white px-3 py-1 rounded-lg border border-amber-300 font-bold text-amber-700">
                          {Number(score?.score || 0).toFixed(2)}/5
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ✅ AJOUT: Scores Phase 2 Techniques */}
        <Card className="border-2 border-purple-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-100">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Tests Techniques Phase 2
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {candidate.scores?.typingSpeed !== null && candidate.scores?.typingSpeed !== undefined && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-semibold text-purple-700">Rapidité de Saisie:</span>
                <span className="text-gray-900 font-medium">{candidate.scores.typingSpeed} MPM</span>
              </div>
            )}
            
            {candidate.scores?.typingAccuracy !== null && candidate.scores?.typingAccuracy !== undefined && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-semibold text-purple-700">Précision Saisie:</span>
                <span className="text-gray-900 font-medium">{candidate.scores.typingAccuracy}%</span>
              </div>
            )}
            
            {candidate.scores?.excelTest !== null && candidate.scores?.excelTest !== undefined && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-semibold text-purple-700">Test Excel:</span>
                <span className="text-gray-900 font-medium">{candidate.scores.excelTest}/5</span>
              </div>
            )}
            
            {candidate.scores?.dictation !== null && candidate.scores?.dictation !== undefined && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-semibold text-purple-700">Dictée:</span>
                <span className="text-gray-900 font-medium">{candidate.scores.dictation}/20</span>
              </div>
            )}
            
            {/* Simulation vente avec sous-critères */}
            {(candidate.scores?.salesSimulation !== null || 
              candidate.scores?.simulationSensNegociation !== null ||
              candidate.scores?.simulationCapacitePersuasion !== null ||
              candidate.scores?.simulationSensCombativite !== null) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="font-semibold text-purple-700">Simulation Vente:</span>
                  {candidate.scores?.salesSimulation && (
                    <span className="text-gray-900 font-medium">{candidate.scores.salesSimulation}/5</span>
                  )}
                </div>
                {candidate.scores?.simulationSensNegociation !== null && (
                  <div className="ml-4 pl-4 border-l-2 border-purple-200">
                    <span className="text-sm text-purple-600">Sens négociation: </span>
                    <span className="text-gray-900 font-medium">{candidate.scores.simulationSensNegociation}/5</span>
                  </div>
                )}
                {candidate.scores?.simulationCapacitePersuasion !== null && (
                  <div className="ml-4 pl-4 border-l-2 border-purple-200">
                    <span className="text-sm text-purple-600">Capacité persuasion: </span>
                    <span className="text-gray-900 font-medium">{candidate.scores.simulationCapacitePersuasion}/5</span>
                  </div>
                )}
                {candidate.scores?.simulationSensCombativite !== null && (
                  <div className="ml-4 pl-4 border-l-2 border-purple-200">
                    <span className="text-sm text-purple-600">Sens combativité: </span>
                    <span className="text-gray-900 font-medium">{candidate.scores.simulationSensCombativite}/5</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Test psychotechnique avec sous-critères */}
            {(candidate.scores?.psychotechnicalTest !== null ||
              candidate.scores?.psychoRaisonnementLogique !== null ||
              candidate.scores?.psychoAttentionConcentration !== null) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="font-semibold text-purple-700">Test Psychotechnique:</span>
                  {candidate.scores?.psychotechnicalTest && (
                    <span className="text-gray-900 font-medium">{candidate.scores.psychotechnicalTest}/10</span>
                  )}
                </div>
                {candidate.scores?.psychoRaisonnementLogique !== null && (
                  <div className="ml-4 pl-4 border-l-2 border-purple-200">
                    <span className="text-sm text-purple-600">Raisonnement logique: </span>
                    <span className="text-gray-900 font-medium">{candidate.scores.psychoRaisonnementLogique}/5</span>
                  </div>
                )}
                {candidate.scores?.psychoAttentionConcentration !== null && (
                  <div className="ml-4 pl-4 border-l-2 border-purple-200">
                    <span className="text-sm text-purple-600">Attention concentration: </span>
                    <span className="text-gray-900 font-medium">{candidate.scores.psychoAttentionConcentration}/5</span>
                  </div>
                )}
              </div>
            )}
            
            {candidate.scores?.analysisExercise !== null && candidate.scores?.analysisExercise !== undefined && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-semibold text-purple-700">Exercice d'Analyse:</span>
                <span className="text-gray-900 font-medium">{candidate.scores.analysisExercise}/10</span>
              </div>
            )}
            
            {candidate.scores?.phase2Date && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-semibold text-purple-700">Date Phase 2:</span>
                <span className="text-gray-900 font-medium">{formatDate(candidate.scores.phase2Date)}</span>
              </div>
            )}
            
            {!candidate.scores?.typingSpeed && !candidate.scores?.excelTest && !candidate.scores?.dictation && 
             !candidate.scores?.salesSimulation && !candidate.scores?.analysisExercise && !candidate.scores?.psychotechnicalTest && (
              <div className="text-center py-6 bg-purple-50 rounded-xl border-2 border-dashed border-purple-200">
                <svg className="w-8 h-8 text-purple-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-purple-600 font-medium">Aucun test technique</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session */}
      {candidate.session && (
        <Card className="border-2 border-emerald-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-100">
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Session de Recrutement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-semibold text-emerald-700">Métier:</span>
                <span className="text-gray-900 font-medium">{candidate.session.metier}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-semibold text-emerald-700">Date:</span>
                <span className="text-gray-900 font-medium">{formatDate(candidate.session.date)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-semibold text-emerald-700">Jour:</span>
                <span className="text-gray-900 font-medium">{candidate.session.jour}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-semibold text-emerald-700">Statut:</span>
                <span className="px-3 py-1 bg-white rounded-lg border border-emerald-300 text-emerald-700 font-medium">
                  {candidate.session.status === 'PLANIFIED' ? 'Planifiée' :
                   candidate.session.status === 'IN_PROGRESS' ? 'En cours' :
                   candidate.session.status === 'COMPLETED' ? 'Terminée' :
                   candidate.session.status === 'CANCELLED' ? 'Annulée' :
                   candidate.session.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-end pt-6 border-t border-gray-200">
        <Link
          href={`/wfm/candidates/${candidate.id}/edit`}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Modifier le candidat
        </Link>
        
        <Link
          href={`/wfm/candidates/${candidate.id}/consolidation`}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Consolidation
        </Link>
        
        <Link
          href={`/wfm/candidates/${candidate.id}/call`}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {candidate.scores?.statut === 'PRESENT' ? (
            <UserCheck className="w-4 h-4" />
          ) : (
            <UserX className="w-4 h-4" />
          )}
          Marquer présence/absence
        </Link>
      </div>
    </div>
  )
}