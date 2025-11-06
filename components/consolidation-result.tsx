// components/consolidation-result.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  User
} from "lucide-react"
import { ConsolidationResultData } from "@/lib/consolidation"

interface ConsolidationResultProps {
  candidate: any
  faceToFaceScores: any[]
  technicalScores: any[]
  consolidation: ConsolidationResultData // ⭐ AJOUTEZ CETTE LIGNE
}

export function ConsolidationResult({ 
  candidate, 
  faceToFaceScores, 
  technicalScores,
  consolidation // ⭐ AJOUTEZ CETTE LIGNE
}: ConsolidationResultProps) {
  
  // Fonction pour formater le nom du test
  const formatTestName = (testName: string): string => {
    const names: { [key: string]: string } = {
      typing: "Dactylographie",
      excel: "Test Excel",
      dictation: "Dictée",
      salesSimulation: "Simulation de Vente",
      psychotechnical: "Test Psychotechnique",
      analysisExercise: "Exercice d'Analyse"
    }
    return names[testName] || testName
  }

  return (
    <div className="space-y-6">
      {/* Carte de résultat de consolidation */}
      <div className={`p-4 rounded-lg border-2 ${
        consolidation.isAdmitted 
          ? "bg-green-50 border-green-300" 
          : "bg-red-50 border-red-300"
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Résultat Final</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            consolidation.isAdmitted 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            {consolidation.isAdmitted ? "ADMIS" : "NON ADMIS"}
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phase 1 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Phase 1 (Face à Face):</span>
              <span>{consolidation.averagePhase1.toFixed(2)}/5</span>
            </div>
            <div className={`text-sm ${consolidation.details.phase1Passed ? "text-green-600" : "text-red-600"}`}>
              {consolidation.details.phase1Passed ? "✓ Seuil atteint" : "✗ Seuil non atteint"}
            </div>
          </div>

          {/* Phase 2 si applicable */}
          {consolidation.averagePhase2 > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Phase 2 (Face à Face):</span>
                <span>{consolidation.averagePhase2.toFixed(2)}/5</span>
              </div>
              <div className={`text-sm ${consolidation.details.phase2Passed ? "text-green-600" : "text-red-600"}`}>
                {consolidation.details.phase2Passed ? "✓ Seuil atteint" : "✗ Seuil non atteint"}
              </div>
            </div>
          )}
        </div>

        {/* Tests techniques */}
        {Object.keys(consolidation.details.technicalTests).length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-3">Tests Techniques:</h4>
            <div className="space-y-2">
              {Object.entries(consolidation.details.technicalTests).map(([test, details]: [string, any]) => (
                <div key={test} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{formatTestName(test)}</span>
                    <div className="text-sm text-gray-600">
                      Requis: {details.required}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${
                    details.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {details.value} {details.passed ? "✓" : "✗"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Votre code existant pour les scores détaillés */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Face à Face</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {consolidation.averagePhase1 > 0 ? consolidation.averagePhase1.toFixed(2) : "N/A"}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {faceToFaceScores.length} évaluation(s)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Technique</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {Object.keys(consolidation.details.technicalTests).length > 0 ? 
                Object.values(consolidation.details.technicalTests).filter((test: any) => test.passed).length + 
                "/" + 
                Object.keys(consolidation.details.technicalTests).length + 
                " tests validés" 
                : "Aucun test"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Détails des évaluations face à face */}
      {faceToFaceScores.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Détails des évaluations face à face:</h4>
          <div className="space-y-2">
            {faceToFaceScores.map((score, index) => (
              <div key={score.id || index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">
                  {score.juryMember?.fullName || `Jury ${index + 1}`}
                </span>
                <span className="font-medium">{score.score?.toFixed(2)}/5</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}