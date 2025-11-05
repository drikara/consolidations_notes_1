// components/consolidation-result.tsx
'use client'

import { Metier } from "@prisma/client"
// ⭐ CORRECTION: Import correct
import { ConsolidationResultData } from "@/lib/consolidation"

interface ConsolidationResultProps {
  candidate: {
    metier: Metier
    fullName: string
    avgPhase1?: number
    avgPhase2?: number
  }
  faceToFaceScores: any[]
  technicalScores?: any
  consolidation?: ConsolidationResultData
}

export function ConsolidationResult({ candidate, faceToFaceScores, technicalScores, consolidation }: ConsolidationResultProps) {
  if (!consolidation) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune consolidation disponible. Les scores doivent être saisis pour calculer la consolidation.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className={`p-4 rounded-lg border-2 ${
        consolidation.isAdmitted 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {consolidation.isAdmitted ? '✅ RECRUTE' : '❌ NON RECRUTE'}
            </h3>
            <p className="text-sm mt-1">
              {candidate.fullName} - {candidate.metier}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm">Phase 1: {consolidation.averagePhase1.toFixed(2)}/5</p>
            <p className="text-sm">Phase 2: {consolidation.averagePhase2.toFixed(2)}/5</p>
          </div>
        </div>
      </div>

      {/* Détails des scores face à face */}
      <div>
        <h4 className="font-semibold mb-3">Évaluations Face à Face</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <h5 className="font-medium text-sm mb-2">Phase 1 - Comportemental</h5>
            <p className="text-2xl font-bold">{consolidation.averagePhase1.toFixed(2)}/5</p>
            <p className={`text-sm ${consolidation.details.phase1Passed ? 'text-green-600' : 'text-red-600'}`}>
              {consolidation.details.phase1Passed ? '✅ Validé' : '❌ Non validé'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <h5 className="font-medium text-sm mb-2">Phase 2 - Technique</h5>
            <p className="text-2xl font-bold">{consolidation.averagePhase2.toFixed(2)}/5</p>
            <p className={`text-sm ${consolidation.details.phase2Passed ? 'text-green-600' : 'text-red-600'}`}>
              {consolidation.details.phase2Passed ? '✅ Validé' : '❌ Non validé'}
            </p>
          </div>
        </div>
      </div>

      {/* Tests techniques */}
      {technicalScores && (
        <div>
          <h4 className="font-semibold mb-3">Tests Techniques</h4>
          <div className="space-y-2">
            {Object.entries(consolidation.details.technicalTests).map(([test, details]: [string, any]) => (
              <div key={test} className="flex items-center justify-between p-2 bg-white border rounded">
                <span className="capitalize font-medium">
                  {test.replace(/([A-Z])/g, ' $1').replace('_', ' ')}
                </span>
                <div className="text-right">
                  <span className={details.passed ? 'text-green-600' : 'text-red-600'}>
                    {details.value} / Requis: {details.required}
                  </span>
                  <span className={`ml-2 ${details.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {details.passed ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Détail des jurys */}
      <div>
        <h4 className="font-semibold mb-3">Détail par Jury</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {faceToFaceScores.map((score, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <div>
                <span className="font-medium">{score.juryMember.fullName}</span>
                <span className="text-gray-500 ml-2">({score.juryMember.roleType})</span>
              </div>
              <div className="text-right">
                <span>Phase {score.phase}: </span>
                <span className="font-medium">{Number(score.score).toFixed(2)}/5</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}