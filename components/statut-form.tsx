// ============================================================================
// FILE 5: components/statut-form.tsx (NOUVEAU FICHIER)
// ============================================================================
"use client"

import { useState } from 'react'
import { Statut } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCheck, UserX } from 'lucide-react'

interface StatutFormProps {
  candidateId: number
  currentStatut?: Statut | null
  currentComment?: string | null
  onSuccess?: () => void
}

export function StatutForm({ candidateId, currentStatut, currentComment, onSuccess }: StatutFormProps) {
  const router = useRouter()
  const [statut, setStatut] = useState<Statut>(currentStatut || 'ABSENT')
  const [commentaire, setCommentaire] = useState(currentComment || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation : commentaire obligatoire si absent
    if (statut === 'ABSENT' && !commentaire.trim()) {
      setError('Veuillez justifier l\'absence du candidat')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/scores/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut,
          statutCommentaire: commentaire.trim()
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      alert(`Statut mis à jour : ${statut === 'PRESENT' ? 'Présent' : 'Absent'}`)
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de mettre à jour le statut')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2 border-indigo-200 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-indigo-200">
        <CardTitle className="flex items-center gap-2 text-indigo-800">
          {statut === 'PRESENT' ? (
            <UserCheck className="w-5 h-5" />
          ) : (
            <UserX className="w-5 h-5" />
          )}
          Marquer la Présence/Absence
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="statut" className="text-gray-700 font-semibold">
              Statut du candidat *
            </Label>
            <Select value={statut} onValueChange={(value) => setStatut(value as Statut)}>
              <SelectTrigger className="border-2 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-200 rounded-xl p-3">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENT" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span>PRÉSENT</span>
                  </div>
                </SelectItem>
                <SelectItem value="ABSENT" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-600" />
                    <span>ABSENT</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="commentaire" className="text-gray-700 font-semibold">
              Commentaire {statut === 'ABSENT' && <span className="text-red-600">*</span>}
            </Label>
            <Textarea
              id="commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder={
                statut === 'ABSENT' 
                  ? "Veuillez justifier l'absence (obligatoire)..." 
                  : "Commentaire optionnel pour la présence..."
              }
              className="border-2 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-200 rounded-xl p-3 resize-none"
              rows={4}
              required={statut === 'ABSENT'}
            />
            {statut === 'ABSENT' && (
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Commentaire obligatoire pour justifier l'absence
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-6 py-3 font-semibold"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white border-0 shadow-lg rounded-xl px-6 py-3 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </div>
              ) : (
                `Confirmer : ${statut === 'PRESENT' ? 'Présent' : 'Absent'}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}