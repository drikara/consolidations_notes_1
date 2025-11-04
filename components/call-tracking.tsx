// components/call-tracking.tsx
'use client'

import { useState } from 'react'

interface CallTrackingProps {
  candidateId: number
  currentStatus?: string | null
  currentAttempts?: number | null
  lastCallDate?: Date | null
  callNotes?: string | null
}

export function CallTracking({ 
  candidateId, 
  currentStatus = 'NON_CONTACTE', 
  currentAttempts = 0, 
  lastCallDate,
  callNotes 
}: CallTrackingProps) {
  const [loading, setLoading] = useState(false)
  
  // Gestion des valeurs null
  const safeCurrentStatus = currentStatus || 'NON_CONTACTE'
  const safeCurrentAttempts = currentAttempts || 0
  const safeLastCallDate = lastCallDate ? new Date(lastCallDate).toISOString().split('T')[0] : ''
  const safeCallNotes = callNotes || ''

  const [formData, setFormData] = useState({
    call_status: safeCurrentStatus,
    call_attempts: safeCurrentAttempts,
    last_call_date: safeLastCallDate,
    call_notes: safeCallNotes,
  })

  const callStatusOptions = [
    { value: 'NON_CONTACTE', label: 'Non contacté', color: 'bg-gray-100 text-gray-800' },
    { value: 'CONTACTE', label: 'Contacté', color: 'bg-blue-100 text-blue-800' },
    { value: 'RESISTANT', label: 'Résistant', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'CONFIRME', label: 'Confirmé', color: 'bg-green-100 text-green-800' },
    { value: 'REFUS', label: 'Refus', color: 'bg-red-100 text-red-800' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/candidates/${candidateId}/call-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('Suivi d\'appel mis à jour avec succès!')
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating call tracking:', error)
      alert('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const incrementAttempts = () => {
    setFormData(prev => ({
      ...prev,
      call_attempts: prev.call_attempts + 1,
      last_call_date: new Date().toISOString().split('T')[0]
    }))
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Suivi d'Appel</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Statut d'appel */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Statut de l'appel
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {callStatusOptions.map(option => (
              <label
                key={option.value}
                className={`flex items-center justify-center p-2 border rounded cursor-pointer text-center text-sm ${
                  formData.call_status === option.value
                    ? `${option.color} border-2 border-blue-500`
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="call_status"
                  value={option.value}
                  checked={formData.call_status === option.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, call_status: e.target.value }))}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Tentatives et date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre de tentatives
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={formData.call_attempts}
                onChange={(e) => setFormData(prev => ({ ...prev, call_attempts: parseInt(e.target.value) }))}
                className="w-20 p-2 border rounded"
              />
              <button
                type="button"
                onClick={incrementAttempts}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
              >
                +1 Tentative
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Date du dernier appel
            </label>
            <input
              type="date"
              value={formData.last_call_date}
              onChange={(e) => setFormData(prev => ({ ...prev, last_call_date: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Notes d'appel */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Notes d'appel
          </label>
          <textarea
            value={formData.call_notes}
            onChange={(e) => setFormData(prev => ({ ...prev, call_notes: e.target.value }))}
            rows={4}
            className="w-full p-2 border rounded"
            placeholder="Notes sur l'appel, réactions du candidat, informations importantes..."
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </form>

      {/* Légende des statuts */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="text-sm font-medium mb-2">Signification des statuts :</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span>Non contacté</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
            <span>Contacté</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            <span>Résistant</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
            <span>Confirmé</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
            <span>Refus</span>
          </div>
        </div>
      </div>
    </div>
  )
}