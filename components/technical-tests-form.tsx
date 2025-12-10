'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Metier } from '@prisma/client'
import { getMetierConfig } from '@/lib/metier-config'

interface TechnicalTestsFormProps {
  candidateId: number
  existingScores?: any
  candidateMetier?: Metier
}

export function TechnicalTestsForm({ candidateId, existingScores, candidateMetier }: TechnicalTestsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [metierConfig, setMetierConfig] = useState<any>(null)
  
  const [scores, setScores] = useState({
    typingSpeed: existingScores?.typingSpeed || '',
    typingAccuracy: existingScores?.typingAccuracy || '',
    excelTest: existingScores?.excelTest || '',
    dictation: existingScores?.dictation || '',
    salesSimulation: existingScores?.salesSimulation || '',
    simulationSensNegociation: existingScores?.simulationSensNegociation || '',
    simulationCapacitePersuasion: existingScores?.simulationCapacitePersuasion || '',
    simulationSensCombativite: existingScores?.simulationSensCombativite || '',
    psychotechnicalTest: existingScores?.psychotechnicalTest || '',
    psychoRaisonnementLogique: existingScores?.psychoRaisonnementLogique || '',
    psychoAttentionConcentration: existingScores?.psychoAttentionConcentration || '',
    analysisExercise: existingScores?.analysisExercise || '',
  })

  useEffect(() => {
    if (candidateMetier) {
      const config = getMetierConfig(candidateMetier)
      setMetierConfig(config)
    }
  }, [candidateMetier])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/scores/technical/${candidateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scores),
      })

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Scores techniques enregistrés",
          variant: "default"
        })
        router.refresh()
      } else {
        const error = await response.json()
        toast({
          title: "Erreur",
          description: error.error || "Erreur lors de la sauvegarde",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const isTestRequired = (testType: string) => {
    if (!metierConfig) return false
    
    const tests = {
      typing: metierConfig.criteria.typing?.required,
      excel: metierConfig.criteria.excel?.required,
      dictation: metierConfig.criteria.dictation?.required,
      simulation: metierConfig.criteria.simulation?.required,
      psycho: metierConfig.criteria.psycho?.required,
      analysis: metierConfig.criteria.analysis?.required,
    }

    return tests[testType as keyof typeof tests] || false
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Tests Techniques
            </h1>
            <p className="text-orange-700">
              {candidateMetier ? `Métier: ${candidateMetier}` : 'Saisie des résultats des tests techniques'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-orange-100 p-6 shadow-lg space-y-6">
        {/* Test de Saisie */}
        {(isTestRequired('typing') || scores.typingSpeed || scores.typingAccuracy) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Test de Saisie {isTestRequired('typing') && <span className="text-red-500">*</span>}
              {metierConfig?.criteria.typing?.minSpeed && (
                <span className="text-sm text-gray-500 ml-auto">
                  Minimum: {metierConfig.criteria.typing.minSpeed} MPM, {metierConfig.criteria.typing.minAccuracy}%
                </span>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Rapidité (MPM)
                </label>
                <input
                  type="number"
                  value={scores.typingSpeed}
                  onChange={(e) => setScores(prev => ({ ...prev, typingSpeed: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  min="0"
                  max="100"
                  required={isTestRequired('typing')}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Précision (%)
                </label>
                <input
                  type="number"
                  value={scores.typingAccuracy}
                  onChange={(e) => setScores(prev => ({ ...prev, typingAccuracy: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  min="0"
                  max="100"
                  step="0.1"
                  required={isTestRequired('typing')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Test Excel */}
        {(isTestRequired('excel') || scores.excelTest) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Test Excel {isTestRequired('excel') && <span className="text-red-500">*</span>}
              {metierConfig?.criteria.excel?.minScore && (
                <span className="text-sm text-gray-500 ml-auto">
                  Minimum: {metierConfig.criteria.excel.minScore}/5
                </span>
              )}
            </h3>
            <div className="space-y-3">
              <input
                type="number"
                value={scores.excelTest}
                onChange={(e) => setScores(prev => ({ ...prev, excelTest: e.target.value }))}
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                min="0"
                max="5"
                step="0.5"
                required={isTestRequired('excel')}
                placeholder="Note sur 5"
              />
            </div>
          </div>
        )}

        {/* Dictée */}
        {(isTestRequired('dictation') || scores.dictation) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Dictée {isTestRequired('dictation') && <span className="text-red-500">*</span>}
              {metierConfig?.criteria.dictation?.minScore && (
                <span className="text-sm text-gray-500 ml-auto">
                  Minimum: {metierConfig.criteria.dictation.minScore}/20
                </span>
              )}
            </h3>
            <div className="space-y-3">
              <input
                type="number"
                value={scores.dictation}
                onChange={(e) => setScores(prev => ({ ...prev, dictation: e.target.value }))}
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                min="0"
                max="20"
                step="0.5"
                required={isTestRequired('dictation')}
                placeholder="Note sur 20"
              />
            </div>
          </div>
        )}

        {/* Simulation Vente */}
        {(isTestRequired('simulation') || scores.salesSimulation) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Simulation Vente {isTestRequired('simulation') && <span className="text-red-500">*</span>}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Sens négociation (/5)
                </label>
                <input
                  type="number"
                  value={scores.simulationSensNegociation}
                  onChange={(e) => setScores(prev => ({ ...prev, simulationSensNegociation: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  min="0"
                  max="5"
                  step="0.5"
                  required={isTestRequired('simulation')}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Capacité persuasion (/5)
                </label>
                <input
                  type="number"
                  value={scores.simulationCapacitePersuasion}
                  onChange={(e) => setScores(prev => ({ ...prev, simulationCapacitePersuasion: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  min="0"
                  max="5"
                  step="0.5"
                  required={isTestRequired('simulation')}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Sens combativité (/5)
                </label>
                <input
                  type="number"
                  value={scores.simulationSensCombativite}
                  onChange={(e) => setScores(prev => ({ ...prev, simulationSensCombativite: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  min="0"
                  max="5"
                  step="0.5"
                  required={isTestRequired('simulation')}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Note globale (/5)
                </label>
                <input
                  type="number"
                  value={scores.salesSimulation}
                  onChange={(e) => setScores(prev => ({ ...prev, salesSimulation: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  min="0"
                  max="5"
                  step="0.5"
                  required={isTestRequired('simulation')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Test Psychotechnique */}
        {(isTestRequired('psycho') || scores.psychotechnicalTest) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Test Psychotechnique {isTestRequired('psycho') && <span className="text-red-500">*</span>}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Raisonnement logique (/5)
                </label>
                <input
                  type="number"
                  value={scores.psychoRaisonnementLogique}
                  onChange={(e) => setScores(prev => ({ ...prev, psychoRaisonnementLogique: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  min="0"
                  max="5"
                  step="0.5"
                  required={isTestRequired('psycho')}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Attention concentration (/5)
                </label>
                <input
                  type="number"
                  value={scores.psychoAttentionConcentration}
                  onChange={(e) => setScores(prev => ({ ...prev, psychoAttentionConcentration: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  min="0"
                  max="5"
                  step="0.5"
                  required={isTestRequired('psycho')}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Note globale (/10)
                </label>
                <input
                  type="number"
                  value={scores.psychotechnicalTest}
                  onChange={(e) => setScores(prev => ({ ...prev, psychotechnicalTest: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  min="0"
                  max="10"
                  step="0.5"
                  required={isTestRequired('psycho')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Exercice d'Analyse */}
        {(isTestRequired('analysis') || scores.analysisExercise) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Exercice d'Analyse {isTestRequired('analysis') && <span className="text-red-500">*</span>}
              {metierConfig?.criteria.analysis?.minScore && (
                <span className="text-sm text-gray-500 ml-auto">
                  Minimum: {metierConfig.criteria.analysis.minScore}/5
                </span>
              )}
            </h3>
            <div className="space-y-3">
              <input
                type="number"
                value={scores.analysisExercise}
                onChange={(e) => setScores(prev => ({ ...prev, analysisExercise: e.target.value }))}
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                min="0"
                max="10"
                step="0.5"
                required={isTestRequired('analysis')}
                placeholder="Note sur 10"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-end pt-6 border-t border-orange-100">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sauvegarder les scores
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}