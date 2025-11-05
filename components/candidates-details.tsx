// components/candidate-details.tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CandidateDetailsProps {
  candidate: {
    id: number
    fullName: string
    phone: string
    email: string
    metier: string
    age: number
    location: string
    availability: string
    interviewDate: Date | null
    diploma: string
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
      finalDecision?: string | null
      callStatus?: string | null
      callAttempts?: number | null
      lastCallDate?: Date | null
      callNotes?: string | null
    } | null
    faceToFaceScores: Array<{
      score: number | any
      phase: number
      juryMember: {
        fullName: string
        roleType: string
        specialite?: string | null
      }
    }>
  }
}

export function CandidateDetails({ candidate }: CandidateDetailsProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "Non défini"
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const phase1Scores = candidate.faceToFaceScores.filter(score => score.phase === 1)
  const phase2Scores = candidate.faceToFaceScores.filter(score => score.phase === 2)

  const avgPhase1 = phase1Scores.length > 0 
    ? phase1Scores.reduce((sum, score) => sum + score.score, 0) / phase1Scores.length 
    : 0

  const avgPhase2 = phase2Scores.length > 0 
    ? phase2Scores.reduce((sum, score) => sum + score.score, 0) / phase2Scores.length 
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

  return (
    <div className="space-y-6">
      {/* En-tête élégant */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {candidate.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {candidate.fullName}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-orange-700">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {candidate.email}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {candidate.phone}
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
            <Link href={`/wfm/candidates/${candidate.id}/consolidation`}>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 font-semibold">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Voir la Consolidation
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
              <span className="text-gray-900 font-medium">{candidate.metier}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
              <span className="font-semibold text-orange-700">Âge:</span>
              <span className="text-gray-900 font-medium">{candidate.age} ans</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
              <span className="font-semibold text-orange-700">Lieu:</span>
              <span className="text-gray-900 font-medium">{candidate.location}</span>
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
              <span className="text-gray-900 font-medium text-right">{candidate.diploma}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
              <span className="font-semibold text-blue-700">Établissement:</span>
              <span className="text-gray-900 font-medium text-right">{candidate.institution}</span>
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
              <span className="text-gray-900 font-medium">{candidate.availability}</span>
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
                {candidate.scores?.finalDecision || 'En attente'}
              </span>
            </div>
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
                  Phase 1
                  {phase1Scores.length > 0 && (
                    <span className="ml-auto bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold">
                      Moyenne: {avgPhase1.toFixed(2)}/5
                    </span>
                  )}
                </h4>
                {phase1Scores.length > 0 ? (
                  <div className="space-y-3">
                    {phase1Scores.map((score, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <div>
                          <p className="font-semibold text-gray-900">{score.juryMember.fullName}</p>
                          <p className="text-xs text-amber-600">{score.juryMember.roleType}</p>
                        </div>
                        <span className="bg-white px-3 py-1 rounded-lg border border-amber-300 font-bold text-amber-700">
                          {score.score}/5
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-amber-50 rounded-xl border-2 border-dashed border-amber-200">
                    <svg className="w-8 h-8 text-amber-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-amber-600 font-medium">Aucun score</p>
                  </div>
                )}
              </div>
              
              {/* Phase 2 */}
              <div>
                <h4 className="font-bold text-lg text-amber-800 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="text-amber-700 font-bold text-sm">2</span>
                  </div>
                  Phase 2
                  {phase2Scores.length > 0 && (
                    <span className="ml-auto bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold">
                      Moyenne: {avgPhase2.toFixed(2)}/5
                    </span>
                  )}
                </h4>
                {phase2Scores.length > 0 ? (
                  <div className="space-y-3">
                    {phase2Scores.map((score, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <div>
                          <p className="font-semibold text-gray-900">{score.juryMember.fullName}</p>
                          <p className="text-xs text-amber-600">{score.juryMember.roleType}</p>
                        </div>
                        <span className="bg-white px-3 py-1 rounded-lg border border-amber-300 font-bold text-amber-700">
                          {score.score}/5
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-amber-50 rounded-xl border-2 border-dashed border-amber-200">
                    <svg className="w-8 h-8 text-amber-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-amber-600 font-medium">Aucun score</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session */}
        {candidate.session && (
          <Card className="border-2 border-emerald-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b-2 border-emerald-100">
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Session
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
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
                  {candidate.session.status}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}