// components/jury-evaluation-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ExistingScore {
  presentationVisuelle?: number
  verbalCommunication?: number
  voiceQuality?: number
  score?: number
  comments?: string
}

interface JuryEvaluationFormProps {
  candidateId: number
  candidateName: string
  existingScore?: ExistingScore
}

export function JuryEvaluationForm({ 
  candidateId, 
  candidateName,
  existingScore
}: JuryEvaluationFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    presentationVisuelle: '',
    verbalCommunication: '',
    voiceQuality: '',
    comments: ''
  })

  useEffect(() => {
    if (existingScore) {
      setFormData({
        presentationVisuelle: existingScore.presentationVisuelle?.toString() || '',
        verbalCommunication: existingScore.verbalCommunication?.toString() || '',
        voiceQuality: existingScore.voiceQuality?.toString() || '',
        comments: existingScore.comments || ''
      })
    }
  }, [existingScore])

  const calculateScore = () => {
    const pres = parseFloat(formData.presentationVisuelle) || 0
    const verbal = parseFloat(formData.verbalCommunication) || 0
    const voice = parseFloat(formData.voiceQuality) || 0
    
    if (pres > 0 && verbal > 0 && voice > 0) {
      return (pres + verbal + voice) / 3
    }
    return 0
  }

  const getFFDecision = (score: number): 'FAVORABLE' | 'DEFAVORABLE' => {
    return score >= 3 ? 'FAVORABLE' : 'DEFAVORABLE'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.presentationVisuelle || !formData.verbalCommunication || 
        !formData.voiceQuality) {
      toast({
        title: "⚠️ Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    // Validation des notes (sur 5)
    const fields = [
      { value: formData.presentationVisuelle, name: 'Présentation visuelle' },
      { value: formData.verbalCommunication, name: 'Communication verbale' },
      { value: formData.voiceQuality, name: 'Qualité de la voix' }
    ]

    for (const field of fields) {
      const val = parseFloat(field.value)
      if (isNaN(val) || val < 0 || val > 5) {
        toast({
          title: "⚠️ Note invalide",
          description: `${field.name} doit être entre 0 et 5`,
          variant: "destructive"
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      const score = calculateScore()
      const decisionFF = getFFDecision(score)

      console.log('Envoi des données:', {
        candidate_id: candidateId,
        presentation_visuelle: parseFloat(formData.presentationVisuelle),
        verbal_communication: parseFloat(formData.verbalCommunication),
        voice_quality: parseFloat(formData.voiceQuality),
        score: score,
        comments: formData.comments || null
      })

      const response = await fetch('/api/jury/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          presentation_visuelle: parseFloat(formData.presentationVisuelle),
          verbal_communication: parseFloat(formData.verbalCommunication),
          voice_quality: parseFloat(formData.voiceQuality),
          score: score,
          comments: formData.comments || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement')
      }

      toast({
        title: "✅ Évaluation enregistrée",
        description: `L'évaluation face-à-face de ${candidateName} a été enregistrée`,
      })

      setTimeout(() => {
        router.push('/jury/evaluations')
        router.refresh()
      }, 1500)

    } catch (error) {
      console.error('Error submitting evaluation:', error)
      toast({
        title: "❌ Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer l'évaluation",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentScore = calculateScore()
  const currentDecision = getFFDecision(currentScore)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          <strong>Évaluation Face-à-Face :</strong> Toutes les notes sont sur 5. 
          Une moyenne ≥ 3/5 donne un avis FAVORABLE.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Présentation Visuelle */}
        <div className="bg-white border-2 border-gray-100 rounded-xl p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Présentation Visuelle <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 mb-3">
            <p className="text-xs text-gray-600">• Tenue vestimentaire (propreté, élégance)</p>
            <p className="text-xs text-gray-600">• Tenue corporelle (gestuelle, aisance)</p>
          </div>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={formData.presentationVisuelle}
            onChange={(e) => setFormData({...formData, presentationVisuelle: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="0 - 5"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Qualité de la Voix */}
        <div className="bg-white border-2 border-gray-100 rounded-xl p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Qualité de la Voix <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 mb-3">
            <p className="text-xs text-gray-600">• Expression claire et aisée</p>
            <p className="text-xs text-gray-600">• Assurance dans la voix, débit normal</p>
            <p className="text-xs text-gray-600">• Attitude aimable et disponible</p>
          </div>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={formData.voiceQuality}
            onChange={(e) => setFormData({...formData, voiceQuality: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="0 - 5"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Communication Verbale */}
        <div className="bg-white border-2 border-gray-100 rounded-xl p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Communication Verbale <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 mb-3">
            <p className="text-xs text-gray-600">• Écoute active sans interruption</p>
            <p className="text-xs text-gray-600">• Capacité à poser des questions pertinentes</p>
            <p className="text-xs text-gray-600">• Présentation assurée des idées</p>
            <p className="text-xs text-gray-600">• Communication efficace avec le jury</p>
          </div>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={formData.verbalCommunication}
            onChange={(e) => setFormData({...formData, verbalCommunication: e.target.value})}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="0 - 5"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Score et Décision Calculés */}
      {formData.presentationVisuelle && formData.voiceQuality && formData.verbalCommunication && (
        <div className={`p-4 rounded-xl border-2 ${
          currentDecision === 'FAVORABLE' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-700">Résultat de l'évaluation :</p>
              <div className="flex items-center gap-6 mt-2">
                <div>
                  <p className="text-sm text-gray-600">Score moyen</p>
                  <p className="text-2xl font-bold text-gray-800">{currentScore.toFixed(2)} / 5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Décision</p>
                  <p className={`text-xl font-bold ${
                    currentDecision === 'FAVORABLE' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentDecision === 'FAVORABLE' ? '✅ FAVORABLE' : '❌ DÉFAVORABLE'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commentaires */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Commentaires et Observations
        </label>
        <Textarea
          value={formData.comments}
          onChange={(e) => setFormData({...formData, comments: e.target.value})}
          className="w-full min-h-[120px] border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors"
          placeholder="Ajoutez vos observations détaillées sur le candidat..."
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || !formData.presentationVisuelle || !formData.voiceQuality || !formData.verbalCommunication}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {existingScore ? 'Mettre à jour l\'évaluation' : 'Enregistrer l\'évaluation'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}