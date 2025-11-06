'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  PhoneIncoming, 
  PhoneOutgoing,
  Calendar,
  MessageSquare,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft
} from 'lucide-react'

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
  const router = useRouter()
  
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
    { 
      value: 'NON_CONTACTE', 
      label: 'Non contacté', 
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      activeColor: 'bg-orange-500 text-white border-orange-500',
      icon: PhoneOff,
      description: 'Aucun contact établi'
    },
    { 
      value: 'CONTACTE', 
      label: 'Contacté', 
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      activeColor: 'bg-orange-500 text-white border-orange-500',
      icon: PhoneCall,
      description: 'Contact établi, en discussion'
    },
    { 
      value: 'RESISTANT', 
      label: 'Résistant', 
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      activeColor: 'bg-orange-500 text-white border-orange-500',
      icon: PhoneIncoming,
      description: 'Difficile à joindre'
    },
    { 
      value: 'CONFIRME', 
      label: 'Confirmé', 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeColor: 'bg-orange-500 text-white border-orange-500',
      icon: CheckCircle2,
      description: 'Entretien confirmé'
    },
    { 
      value: 'REFUS', 
      label: 'Refus', 
      color: 'bg-red-50 text-red-700 border-red-200',
      activeColor: 'bg-orange-500 text-white border-orange-500',
      icon: XCircle,
      description: 'Candidat a refusé'
    },
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
        // Notification de succès
        const event = new CustomEvent('show-toast', {
          detail: { message: 'Suivi d\'appel mis à jour avec succès!', type: 'success' }
        })
        window.dispatchEvent(event)
        
        // Redirection vers la page des candidats après succès
        setTimeout(() => {
          router.push('/wfm/candidates')
          router.refresh()
        }, 1000)
      } else {
        const error = await response.json()
        const event = new CustomEvent('show-toast', {
          detail: { message: `Erreur: ${error.error}`, type: 'error' }
        })
        window.dispatchEvent(event)
      }
    } catch (error) {
      console.error('Error updating call tracking:', error)
      const event = new CustomEvent('show-toast', {
        detail: { message: 'Erreur lors de la mise à jour', type: 'error' }
      })
      window.dispatchEvent(event)
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

  const resetAttempts = () => {
    setFormData(prev => ({
      ...prev,
      call_attempts: 0,
      last_call_date: ''
    }))
  }

  const getCurrentStatusConfig = () => {
    return callStatusOptions.find(option => option.value === formData.call_status) || callStatusOptions[0]
  }

  const currentStatusConfig = getCurrentStatusConfig()

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* En-tête avec gradient orange */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Suivi d'Appel</h3>
            <p className="text-orange-100 text-sm">Gérez les contacts avec le candidat</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Statut d'appel */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <PhoneCall className="w-5 h-5 text-orange-600" />
              <label className="text-sm font-semibold text-gray-900">
                Statut de l'appel
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {callStatusOptions.map(option => {
                const Icon = option.icon
                const isActive = formData.call_status === option.value
                return (
                  <label
                    key={option.value}
                    className={`
                      flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center group
                      ${isActive 
                        ? `${option.activeColor} shadow-lg shadow-orange-500/25 scale-105` 
                        : `${option.color} hover:shadow-md hover:scale-102 hover:border-orange-300`
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="call_status"
                      value={option.value}
                      checked={isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, call_status: e.target.value }))}
                      className="sr-only"
                    />
                    <Icon className={`w-6 h-6 mb-2 transition-colors ${
                      isActive ? 'text-white' : 'group-hover:text-orange-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-white' : 'group-hover:text-orange-900'
                    }`}>
                      {option.label}
                    </span>
                    <span className={`text-xs mt-1 ${
                      isActive ? 'text-white/90' : 'text-gray-500 group-hover:text-orange-700'
                    }`}>
                      {option.description}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Tentatives et date */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <PhoneOutgoing className="w-5 h-5 text-orange-600" />
                <label className="text-sm font-semibold text-gray-900">
                  Tentatives d'appel
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.call_attempts}
                    onChange={(e) => setFormData(prev => ({ ...prev, call_attempts: parseInt(e.target.value) || 0 }))}
                    className="w-full p-3 pl-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-500 text-sm font-medium">
                      {formData.call_attempts === 1 ? 'tentative' : 'tentatives'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={incrementAttempts}
                    className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors shadow-sm hover:shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">+1</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={resetAttempts}
                    className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <label className="text-sm font-semibold text-gray-900">
                  Dernier appel
                </label>
              </div>
              
              <div className="relative">
                <input
                  type="date"
                  value={formData.last_call_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_call_date: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
                {!formData.last_call_date && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes d'appel */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <label className="text-sm font-semibold text-gray-900">
                Notes d'appel
              </label>
            </div>
            
            <div className="relative">
              <textarea
                value={formData.call_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, call_notes: e.target.value }))}
                rows={4}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                placeholder="Notes sur l'appel, réactions du candidat, informations importantes, disponibilités discutées..."
              />
              <div className="absolute bottom-3 right-3">
                <span className={`text-xs ${
                  formData.call_notes.length > 200 ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {formData.call_notes.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* Résumé et actions */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  formData.call_status === 'NON_CONTACTE' ? 'bg-gray-100' : 
                  formData.call_status === 'CONTACTE' ? 'bg-orange-100' :
                  formData.call_status === 'RESISTANT' ? 'bg-amber-100' :
                  formData.call_status === 'CONFIRME' ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  <currentStatusConfig.icon className={`w-4 h-4 ${
                    formData.call_status === 'NON_CONTACTE' ? 'text-gray-600' : 
                    formData.call_status === 'CONTACTE' ? 'text-orange-600' :
                    formData.call_status === 'RESISTANT' ? 'text-amber-600' :
                    formData.call_status === 'CONFIRME' ? 'text-emerald-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Statut actuel</p>
                  <p className="text-sm text-gray-600">{currentStatusConfig.label}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Tentatives</p>
                <p className="text-sm text-gray-600">{formData.call_attempts} appel(s)</p>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/wfm/candidates')}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Annuler</span>
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 font-medium"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mise à jour...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Mettre à jour</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Légende des statuts */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Signification des statuts :</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            {callStatusOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  option.value === 'NON_CONTACTE' ? 'bg-gray-400' :
                  option.value === 'CONTACTE' ? 'bg-orange-400' :
                  option.value === 'RESISTANT' ? 'bg-amber-400' :
                  option.value === 'CONFIRME' ? 'bg-emerald-400' : 'bg-red-400'
                }`}></div>
                <span className="font-medium text-gray-700">{option.label}:</span>
                <span className="text-gray-600">{option.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}