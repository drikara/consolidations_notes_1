// components/session-form.tsx
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

    // Validation côté client
    if (!formData.metier || !formData.date) {
      setError("Le métier et la date sont obligatoires")
      setLoading(false)
      return
    }

    try {
      const url = session ? `/api/sessions/${session.id}` : '/api/sessions'
      const method = session ? 'PUT' : 'POST'

      // Préparer les données
      const payload = {
        metier: formData.metier,
        date: formData.date,
        jour: formData.jour,
        status: formData.status,
        description: formData.description || null,
        location: formData.location || null,
      }

      console.log('📤 Envoi vers:', url)
      console.log('📤 Méthode:', method)
      console.log('📤 Données:', payload)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('📥 Statut réponse:', response.status)
      console.log('📥 Content-Type:', response.headers.get('content-type'))

      // Vérifier si la réponse est bien du JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Réponse non-JSON reçue')
        const textResponse = await response.text()
        console.error('Réponse brute:', textResponse.substring(0, 500))
        throw new Error('Le serveur a retourné une réponse invalide (HTML au lieu de JSON). Vérifiez que la route API existe.')
      }

      const result = await response.json()
      console.log('📥 Réponse JSON:', result)

      if (!response.ok) {
        throw new Error(result.error || `Erreur HTTP ${response.status}`)
      }

      console.log('✅ Session sauvegardée avec succès')
      router.push('/wfm/sessions')
      router.refresh()
    } catch (error) {
      console.error('❌ Erreur complète:', error)
      
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
    
    // Calcul automatique du jour de la semaine
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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-6">
      {/* Message d'erreur détaillé */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Erreur</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Métier */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Métier <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.metier}
          onChange={(e) => setFormData(prev => ({ ...prev, metier: e.target.value as Metier }))}
          className="w-full p-2 border rounded-md border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        >
          <option value="">Sélectionnez un métier</option>
          {Object.values(Metier).map(metier => (
            <option key={metier} value={metier}>{metier}</option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Date de la session <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full p-2 border rounded-md border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      {/* Jour (calculé automatiquement) */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Jour de la semaine
        </label>
        <input
          type="text"
          value={formData.jour}
          readOnly
          className="w-full p-2 border rounded-md bg-gray-50 border-gray-300"
        />
        <p className="text-sm text-gray-600 mt-1">
          Calculé automatiquement à partir de la date
        </p>
      </div>

      {/* Statut */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Statut <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as SessionStatus }))}
          className="w-full p-2 border rounded-md border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        >
          <option value="PLANIFIED">Planifié</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="COMPLETED">Terminé</option>
          <option value="CANCELLED">Annulé</option>
        </select>
      </div>

      {/* Lieu */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Lieu
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          className="w-full p-2 border rounded-md border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Ex: Siège social, Salle de réunion A..."
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full p-2 border rounded-md border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Informations supplémentaires sur cette session..."
        />
      </div>

      {/* Boutons */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
        >
          {loading ? 'Sauvegarde...' : (session ? 'Modifier' : 'Créer')} la Session
        </button>
        <button
          type="button"
          onClick={() => router.push('/wfm/sessions')}
          disabled={loading}
          className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50 font-medium transition-colors cursor-pointer"
        >
          Annuler
        </button>
      </div>

      {/* Informations de validation */}
      {(!formData.metier || !formData.date) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            <strong>Champs obligatoires :</strong> Métier et Date
          </p>
        </div>
      )}
    </form>
  )
}