// components/call-status-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CallStatusFormProps {
  candidate: {
    id: number
    fullName: string
    phone: string
    email: string
    metier: string
    availability: string
    scores?: {
      call_status?: string | null
      statusComment?: string | null
    } | null
  }
}

export function CallStatusForm({ candidate }: CallStatusFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    call_status: candidate.scores?.call_status || 'PRESENT',
    statusComment: candidate.scores?.statusComment || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation : si ABSENT, le commentaire est obligatoire
    if (formData.call_status === 'ABSENT' && !formData.statusComment.trim()) {
      alert('Veuillez fournir un commentaire pour justifier l\'absence')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/candidates/${candidate.id}/call-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      alert('Statut mis à jour avec succès')
      router.push('/wfm/candidates')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2 border-orange-200 shadow-lg rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
        <CardTitle className="text-orange-800">Statut de Présence</CardTitle>
        <p className="text-sm text-orange-600">
          Marquer la présence ou l'absence du candidat
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations candidat */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Téléphone:</span>
                <p className="font-semibold text-gray-900">{candidate.phone}</p>
              </div>
              <div>
                <span className="text-gray-600">Métier:</span>
                <p className="font-semibold text-gray-900">{candidate.metier}</p>
              </div>
              <div>
                <span className="text-gray-600">Disponibilité:</span>
                <p className="font-semibold text-gray-900">{candidate.availability}</p>
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="space-y-3">
            <Label htmlFor="call_status" className="text-gray-700 font-semibold">
              Statut <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.call_status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, call_status: value }))}
            >
              <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 rounded-xl p-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENT">Présent</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Commentaire (obligatoire si ABSENT) */}
          {formData.call_status === 'ABSENT' && (
            <div className="space-y-3 bg-red-50 p-4 rounded-xl border-2 border-red-200">
              <Label htmlFor="statusComment" className="text-gray-700 font-semibold">
                Justification de l'absence <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="statusComment"
                value={formData.statusComment}
                onChange={(e) => setFormData(prev => ({ ...prev, statusComment: e.target.value }))}
                rows={4}
                className="border-2 border-red-300 focus:border-red-400 rounded-xl"
                placeholder="Expliquez la raison de l'absence..."
                required
              />
              <p className="text-sm text-red-600">
                Ce champ est obligatoire lorsque le candidat est absent
              </p>
            </div>
          )}

          {formData.call_status === 'PRESENT' && (
            <div className="space-y-3">
              <Label htmlFor="statusComment" className="text-gray-700 font-semibold">
                Commentaire (optionnel)
              </Label>
              <Textarea
                id="statusComment"
                value={formData.statusComment}
                onChange={(e) => setFormData(prev => ({ ...prev, statusComment: e.target.value }))}
                rows={3}
                className="border-2 border-orange-200 focus:border-orange-400 rounded-xl"
                placeholder="Observations éventuelles..."
              />
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-2 border-gray-300 hover:bg-gray-50 rounded-xl px-6"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl px-6"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}