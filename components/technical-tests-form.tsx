// components/technical-tests-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TechnicalTestsFormProps {
  candidateId: number
  existingScores?: any
}

export function TechnicalTestsForm({ candidateId, existingScores }: TechnicalTestsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState({
    typing_speed: existingScores?.typingSpeed || '',
    typing_accuracy: existingScores?.typingAccuracy || '',
    excel_test: existingScores?.excelTest || '',
    dictation: existingScores?.dictation || '',
    sales_simulation: existingScores?.salesSimulation || '',
    psychotechnical_test: existingScores?.psychotechnicalTest || '',
    analysis_exercise: existingScores?.analysisExercise || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/candidates/${candidateId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scores),
      })

      if (response.ok) {
        router.refresh()
      } else {
        console.error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
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
              Saisie des résultats des tests techniques
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-orange-100 p-6 shadow-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test de Saisie */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Test de Saisie
            </h3>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Rapidité (MPM)
              </label>
              <input
                type="number"
                value={scores.typing_speed}
                onChange={(e) => setScores(prev => ({ ...prev, typing_speed: e.target.value }))}
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                min="0"
                max="100"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Précision (%)
              </label>
              <input
                type="number"
                value={scores.typing_accuracy}
                onChange={(e) => setScores(prev => ({ ...prev, typing_accuracy: e.target.value }))}
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          {/* Test Excel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Test Excel
            </h3>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Note (/5)
              </label>
              <input
                type="number"
                value={scores.excel_test}
                onChange={(e) => setScores(prev => ({ ...prev, excel_test: e.target.value }))}
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                min="0"
                max="5"
                step="0.5"
              />
            </div>
          </div>

          {/* Dictée */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Dictée
            </h3>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Note (/20)
              </label>
              <input
                type="number"
                value={scores.dictation}
                onChange={(e) => setScores(prev => ({ ...prev, dictation: e.target.value }))}
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                min="0"
                max="20"
                step="0.5"
              />
            </div>
          </div>

          {/* Simulation Vente */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Simulation Vente
            </h3>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Note (/5)
              </label>
              <input
                type="number"
                value={scores.sales_simulation}
                onChange={(e) => setScores(prev => ({ ...prev, sales_simulation: e.target.value }))}
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                min="0"
                max="5"
                step="0.5"
              />
            </div>
          </div>

          {/* Test Psychotechnique */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Test Psychotechnique
            </h3>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Note (/10)
              </label>
              <input
                type="number"
                value={scores.psychotechnical_test}
                onChange={(e) => setScores(prev => ({ ...prev, psychotechnical_test: e.target.value }))}
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                min="0"
                max="10"
                step="0.5"
              />
            </div>
          </div>

          {/* Exercice d'Analyse */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Exercice d'Analyse
            </h3>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Note (/10)
              </label>
              <input
                type="number"
                value={scores.analysis_exercise}
                onChange={(e) => setScores(prev => ({ ...prev, analysis_exercise: e.target.value }))}
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                min="0"
                max="10"
                step="0.5"
              />
            </div>
          </div>
        </div>

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