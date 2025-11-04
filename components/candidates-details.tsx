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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{candidate.fullName}</h1>
          <p className="text-muted-foreground">{candidate.email} • {candidate.phone}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/wfm/candidates/${candidate.id}/edit`}>
            <Button variant="outline">Modifier</Button>
          </Link>
          <Link href={`/wfm/candidates/${candidate.id}/consolidation`}>
            <Button className="bg-orange-500 hover:bg-orange-600">
              Voir la Consolidation
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Métier:</span> {candidate.metier}
            </div>
            <div>
              <span className="font-medium">Âge:</span> {candidate.age} ans
            </div>
            <div>
              <span className="font-medium">Lieu:</span> {candidate.location}
            </div>
            <div>
              <span className="font-medium">Date de naissance:</span> {formatDate(candidate.birthDate)}
            </div>
          </CardContent>
        </Card>

        {/* Formation */}
        <Card>
          <CardHeader>
            <CardTitle>Formation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Diplôme:</span> {candidate.diploma}
            </div>
            <div>
              <span className="font-medium">Établissement:</span> {candidate.institution}
            </div>
          </CardContent>
        </Card>

        {/* Statut */}
        <Card>
          <CardHeader>
            <CardTitle>Statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Disponibilité:</span> {candidate.availability}
            </div>
            <div>
              <span className="font-medium">Date entretien:</span> {formatDate(candidate.interviewDate)}
            </div>
            <div>
              <span className="font-medium">SMS envoyé le:</span> {formatDate(candidate.smsSentDate)}
            </div>
            <div>
              <span className="font-medium">Décision:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                candidate.scores?.finalDecision === 'RECRUTE' 
                  ? 'bg-green-100 text-green-800'
                  : candidate.scores?.finalDecision === 'NON_RECRUTE'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {candidate.scores?.finalDecision || 'En attente'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scores face à face */}
        <Card>
          <CardHeader>
            <CardTitle>Scores Face à Face</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Phase 1</h4>
                {phase1Scores.length > 0 ? (
                  <div className="space-y-2">
                    {phase1Scores.map((score, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{score.juryMember.fullName}</span>
                        <span className="font-medium">{score.score}/5</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 font-medium">
                      Moyenne: {avgPhase1.toFixed(2)}/5
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun score</p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Phase 2</h4>
                {phase2Scores.length > 0 ? (
                  <div className="space-y-2">
                    {phase2Scores.map((score, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{score.juryMember.fullName}</span>
                        <span className="font-medium">{score.score}/5</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 font-medium">
                      Moyenne: {avgPhase2.toFixed(2)}/5
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun score</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session */}
        {candidate.session && (
          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Métier:</span> {candidate.session.metier}
              </div>
              <div>
                <span className="font-medium">Date:</span> {formatDate(candidate.session.date)}
              </div>
              <div>
                <span className="font-medium">Jour:</span> {candidate.session.jour}
              </div>
              <div>
                <span className="font-medium">Statut:</span> {candidate.session.status}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}