'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Metier } from '@prisma/client'

interface JuryMember {
  id: number
  userId: string
  fullName: string
  roleType: string
  specialite: Metier | null
  department: string | null
  phone: string | null
  isActive: boolean
  user: {
    email: string
    name: string
    role: string
    isActive: boolean
    lastLogin: Date | null
  }
  stats: {
    evaluationsCount: number
    presencesCount: number
  }
}

interface JuryManagementProps {
  juryMembers: JuryMember[]
  users: Array<{
    id: string
    name: string
    email: string
    role: string
  }>
}

export function JuryManagement({ juryMembers, users }: JuryManagementProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    full_name: '',
    role_type: '',
    specialite: '',
    department: '',
    phone: '',
    notes: ''
  })

  const roleTypes = ['DRH', 'EPC', 'REPRESENTANT_METIER', 'WFM_JURY']

  const availableUsers = users.filter(user => 
    user.role === 'JURY' && 
    !juryMembers.some(jury => jury.userId === user.id)
  )

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setFormData(prev => ({
        ...prev,
        user_id: userId,
        full_name: user.name
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/jury', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          user_id: '',
          full_name: '',
          role_type: '',
          specialite: '',
          department: '',
          phone: '',
          notes: ''
        })
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating jury member:', error)
      alert('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (juryId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/jury/${juryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating jury member:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DRH':
        return 'bg-linear-to-r from-orange-500 to-amber-500 text-white'
      case 'EPC':
        return 'bg-linear-to-r from-blue-500 to-cyan-500 text-white'
      case 'REPRESENTANT_METIER':
        return 'bg-linear-to-r from-emerald-500 to-green-500 text-white'
      case 'WFM_JURY':
        return 'bg-linear-to-r from-purple-500 to-pink-500 text-white'
      default:
        return 'bg-linear-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête élégant */}
      <div className="bg-linear-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Gestion des Membres du Jury
              </h1>
              <p className="text-orange-700">
                {juryMembers.length} membre{juryMembers.length > 1 ? 's' : ''} du jury
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un Membre
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-orange-800">Nouveau Membre du Jury</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sélection de l'utilisateur */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Utilisateur <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => handleUserSelect(e.target.value)}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  required
                >
                  <option value="">Sélectionnez un utilisateur</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 mt-2">
                    Aucun utilisateur disponible (tous sont déjà membres du jury ou ont le rôle WFM)
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
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  required
                  placeholder="Ex: Dr. Jean Dupont"
                />
              </div>

              {/* Type de rôle */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Type de rôle <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, role_type: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  required
                >
                  <option value="">Sélectionnez un rôle</option>
                  {roleTypes.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Spécialité */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Spécialité (métier)
                </label>
                <select
                  value={formData.specialite}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialite: e.target.value }))}
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
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
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  placeholder="Ex: RH, Commercial, Technique..."
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
                  className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
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
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors resize-none"
                placeholder="Informations supplémentaires..."
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-4 justify-end pt-4 border-t border-orange-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 rounded-xl font-semibold transition-all duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Créer le Membre
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des membres du jury */}
      <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-linear-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                  Spécialité
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                  Statistiques
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-orange-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {juryMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-orange-600 font-medium text-lg">Aucun membre du jury</p>
                      <p className="text-orange-500 text-sm mt-1">
                        Commencez par ajouter un membre du jury
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                juryMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-orange-50/50 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                          {member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                            {member.fullName}
                          </div>
                          <div className="text-sm text-orange-600">{member.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${getRoleColor(member.roleType)} shadow-sm`}>
                        {member.roleType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.specialite ? (
                        <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                          {member.specialite}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{member.stats.evaluationsCount}</div>
                          <div className="text-xs text-orange-500 font-medium">Évaluations</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{member.stats.presencesCount}</div>
                          <div className="text-xs text-blue-500 font-medium">Présences</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(member.id, member.isActive)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                          member.isActive
                            ? 'bg-linear-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200 hover:from-emerald-200 hover:to-green-200'
                            : 'bg-linear-to-r from-red-100 to-pink-100 text-red-700 border-red-200 hover:from-red-200 hover:to-pink-200'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {member.isActive ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/wfm/jury/${member.id}`}>
                          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl text-sm font-semibold border-2 border-blue-200 transition-all duration-200 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Profil
                          </button>
                        </Link>
                        <Link href={`/wfm/jury/${member.id}/edit`}>
                          <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded-xl text-sm font-semibold border-2 border-orange-200 transition-all duration-200 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Modifier
                          </button>
                        </Link>
                        <Link href={`/wfm/jury/${member.id}/delete/confirmation`}>
                          <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl text-sm font-semibold border-2 border-red-200 transition-all duration-200 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Supprimer
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}