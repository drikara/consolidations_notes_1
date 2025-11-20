'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Metier, JuryRoleType } from '@prisma/client'

interface JuryFormProps {
  juryMember?: {
    id: number
    userId: string
    fullName: string
    roleType: JuryRoleType
    specialite: Metier | null
    department: string | null
    phone: string | null
    notes: string | null
  }
  availableUsers: Array<{
    id: string
    name: string
    email: string
  }>
  availableSessions?: Array<{
    id: string
    metier: string
    date: string
    jour: string
    status: string
  }>
}

export function JuryForm({ juryMember, availableUsers, availableSessions = [] }: JuryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    user_id: juryMember?.userId || '',
    full_name: juryMember?.fullName || '',
    role_type: juryMember?.roleType || '' as JuryRoleType | '',
    specialite: juryMember?.specialite || '',
    department: juryMember?.department || '',
    phone: juryMember?.phone || '',
    notes: juryMember?.notes || '',
    // ✅ NOUVEAU: Sélection de sessions
    sessions: [] as string[],
    wasPresent: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Créer ou modifier le membre du jury
      const juryUrl = juryMember 
        ? `/api/jury-members/${juryMember.id}` 
        : '/api/jury-members'
      
      const juryMethod = juryMember ? 'PUT' : 'POST'

      const juryPayload = {
        user_id: formData.user_id,
        full_name: formData.full_name,
        role_type: formData.role_type,
        specialite: formData.specialite || null,
        department: formData.department || null,
        phone: formData.phone || null,
        notes: formData.notes || null,
      }

      const juryResponse = await fetch(juryUrl, {
        method: juryMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(juryPayload),
      })

      if (!juryResponse.ok) {
        const errorData = await juryResponse.json()
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde')
      }

      const savedJury = await juryResponse.json()

      // 2. ✅ NOUVEAU: Ajouter le jury aux sessions sélectionnées (seulement à la création)
      if (!juryMember && formData.sessions.length > 0) {
        console.log('📋 Ajout du jury aux sessions:', formData.sessions)
        
        const sessionPromises = formData.sessions.map(sessionId =>
          fetch(`/api/sessions/${sessionId}/jury`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              juryMemberId: savedJury.id,
              wasPresent: formData.wasPresent,
              absenceReason: null
            })
          })
        )

        const results = await Promise.allSettled(sessionPromises)
        
        // Vérifier les erreurs
        const errors = results.filter(r => r.status === 'rejected')
        if (errors.length > 0) {
          console.warn('⚠️ Certaines sessions n\'ont pas pu être ajoutées:', errors)
        }

        console.log('✅ Jury ajouté à', results.filter(r => r.status === 'fulfilled').length, 'session(s)')
      }

      // Redirection
      router.push('/wfm/jury')
      router.refresh()
    } catch (err) {
      console.error('❌ Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleUserChange = (userId: string) => {
    const selectedUser = availableUsers.find(u => u.id === userId)
    setFormData(prev => ({
      ...prev,
      user_id: userId,
      full_name: selectedUser?.name || '',
    }))
  }

  const handleSessionToggle = (sessionId: string) => {
    setFormData(prev => ({
      ...prev,
      sessions: prev.sessions.includes(sessionId)
        ? prev.sessions.filter(id => id !== sessionId)
        : [...prev.sessions, sessionId]
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-red-800">Erreur</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sélection de l'utilisateur */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Utilisateur <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.user_id}
          onChange={(e) => handleUserChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-200 bg-white"
          required
          disabled={loading || !!juryMember}
        >
          <option value="">Sélectionnez un utilisateur</option>
          {availableUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
        {juryMember && (
          <p className="text-sm text-orange-600">
            L'utilisateur ne peut pas être modifié après la création
          </p>
        )}
      </div>

      {/* Nom complet */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Nom complet <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
          required
          disabled={loading}
        />
      </div>

      {/* Type de rôle */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Type de rôle <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.role_type}
          onChange={(e) => setFormData(prev => ({ ...prev, role_type: e.target.value as JuryRoleType }))}
          className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-200 bg-white"
          required
          disabled={loading}
        >
          <option value="">Sélectionnez un rôle</option>
          {Object.values(JuryRoleType).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      {/* Spécialité */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Spécialité
        </label>
        <select
          value={formData.specialite}
          onChange={(e) => setFormData(prev => ({ ...prev, specialite: e.target.value }))}
          className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-200 bg-white"
          disabled={loading}
        >
          <option value="">Aucune spécialité</option>
          {Object.values(Metier).map(metier => (
            <option key={metier} value={metier}>{metier}</option>
          ))}
        </select>
      </div>

      {/* Département */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Département
        </label>
        <input
          type="text"
          value={formData.department}
          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
          className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
          placeholder="Ex: Ressources Humaines"
          disabled={loading}
        />
      </div>

      {/* Téléphone */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Téléphone
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
          placeholder="Ex: +225 07 XX XX XX XX"
          disabled={loading}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-200 resize-none"
          placeholder="Informations complémentaires..."
          disabled={loading}
        />
      </div>

      {/* ✅ NOUVEAU: Sélection des sessions (seulement à la création) */}
      {!juryMember && availableSessions.length > 0 && (
        <div className="space-y-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-purple-800">
                Assigner aux sessions
              </h3>
              <p className="text-sm text-purple-600">
                Sélectionnez les sessions auxquelles ce jury participera
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableSessions.map(session => (
              <label
                key={session.id}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.sessions.includes(session.id)
                    ? 'bg-purple-100 border-purple-400 shadow-md'
                    : 'bg-white border-purple-200 hover:border-purple-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.sessions.includes(session.id)}
                  onChange={() => handleSessionToggle(session.id)}
                  className="w-5 h-5 rounded border-2 border-purple-300 text-purple-600 focus:ring-purple-500"
                  disabled={loading}
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{session.metier}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(session.date).toLocaleDateString('fr-FR')} - {session.jour}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  session.status === 'PLANIFIED' 
                    ? 'bg-blue-100 text-blue-700' 
                    : session.status === 'IN_PROGRESS'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {session.status}
                </span>
              </label>
            ))}
          </div>

          {formData.sessions.length > 0 && (
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-purple-700">
                  {formData.sessions.length} session(s) sélectionnée(s)
                </span>
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.wasPresent}
                  onChange={(e) => setFormData(prev => ({ ...prev, wasPresent: e.target.checked }))}
                  className="w-4 h-4 rounded border-2 border-purple-300 text-purple-600"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">Marquer comme présent par défaut</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Boutons */}
      <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
        <button
          type="button"
          onClick={() => router.push('/wfm/jury')}
          disabled={loading}
          className="flex-1 px-6 py-3 border-2 border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 font-semibold transition-all disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sauvegarde...
            </div>
          ) : (
            juryMember ? 'Modifier le membre' : 'Créer le membre'
          )}
        </button>
      </div>
    </form>
  )
}