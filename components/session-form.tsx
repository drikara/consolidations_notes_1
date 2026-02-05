//components/session-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Metier, SessionStatus } from '@prisma/client'

interface SessionFormProps {
  session?: {
    id: string
    metier: Metier
    date: string
    jour: string
    status: SessionStatus
    description?: string | null
    location?: string | null
  }
}

export function SessionForm({ session }: SessionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    metier: session?.metier || '' as Metier | '',
    date: session?.date || '',
    jour: session?.jour || '',
    status: session?.status || 'PLANIFIED' as SessionStatus,
    description: session?.description || '',
    location: session?.location || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.metier || !formData.date) {
      setError("Le métier et la date sont obligatoires")
      setLoading(false)
      return
    }

    try {
      const url = session ? `/api/sessions/${session.id}` : '/api/sessions'
      const method = session ? 'PUT' : 'POST'

      const payload = {
        metier: formData.metier,
        date: formData.date,
        jour: formData.jour,
        status: formData.status,
        description: formData.description || null,
        location: formData.location || null,
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        throw new Error('Le serveur a retourné une réponse invalide (HTML au lieu de JSON). Vérifiez que la route API existe.')
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Erreur HTTP ${response.status}`)
      }

      router.push('/wfm/sessions')
      router.refresh()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Impossible de contacter le serveur. Vérifiez que Next.js est démarré.')
      } else if (error instanceof SyntaxError && error.message.includes('JSON')) {
        setError('Erreur: La route API retourne du HTML au lieu de JSON. Vérifiez que /app/api/sessions/route.ts existe.')
      } else {
        setError(error instanceof Error ? error.message : 'Erreur inconnue')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date: string) => {
    setFormData(prev => ({ ...prev, date }))
    
    if (date) {
      try {
        const selectedDate = new Date(date + 'T00:00:00')
        const dayIndex = selectedDate.getDay()
        const frenchDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        setFormData(prev => ({ ...prev, jour: frenchDays[dayIndex] }))
      } catch (err) {
        console.error('Erreur lors du calcul du jour:', err)
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              {session ? "Modifier la session" : "Nouvelle session"}
            </h1>
            <p className="text-orange-700">
              {session ? "Modifiez les informations de la session" : "Créez une nouvelle session d'évaluation"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-orange-100 p-6 shadow-lg space-y-6">
        {/* Message d'erreur */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-4 border-2 border-red-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-red-800">Erreur</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Métier */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Métier <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.metier}
            onChange={(e) => setFormData(prev => ({ ...prev, metier: e.target.value as Metier }))}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
            required
          >
            <option value="">Sélectionnez un métier</option>
            {Object.values(Metier).map(metier => (
              <option key={metier} value={metier}>{metier}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Date de la session <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
            required
          />
        </div>

        {/* Jour (calculé automatiquement) */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Jour de la semaine
          </label>
          <input
            type="text"
            value={formData.jour}
            readOnly
            className="w-full p-3 border-2 border-orange-200 bg-orange-50 rounded-xl text-orange-700 font-medium"
          />
          <p className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
            Calculé automatiquement à partir de la date
          </p>
        </div>

        {/* Statut */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Statut <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as SessionStatus }))}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
            required
          >
           
            <option value="IN_PROGRESS">En cours</option>
            <option value="COMPLETED">Terminé</option>
            
          </select>
        </div>

        {/* Lieu */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Lieu
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
            placeholder="Ex: Siège social, Salle de réunion A..."
          />
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Vague
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors resize-none"
            placeholder="Informations supplémentaires sur cette session..."
          />
        </div>

       

        {/* Boutons */}
        <div className="flex gap-4 justify-end pt-6 border-t border-orange-100">
          <button
            type="button"
            onClick={() => router.push('/wfm/sessions')}
            disabled={loading}
            className="px-6 py-3 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
                {session ? 'Modifier' : 'Créer'} la Session
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}