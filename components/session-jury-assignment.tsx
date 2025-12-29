// components/session-jury-assignment.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, UserPlus, Users, CheckCircle, AlertCircle } from 'lucide-react'

interface JuryMember {
  id: number
  fullName: string
  roleType: string
  specialite: string | null
  isActive: boolean
}

interface AssignedJury {
  id: number
  juryMemberId: number
  wasPresent: boolean
  juryMember: {
    fullName: string
    roleType: string
    specialite: string | null
  }
}

interface SessionJuryAssignmentProps {
  sessionId: string
  sessionMetier: string
  onAssignmentChange?: () => void
}

export function SessionJuryAssignment({ 
  sessionId, 
  sessionMetier,
  onAssignmentChange 
}: SessionJuryAssignmentProps) {
  const [allJuryMembers, setAllJuryMembers] = useState<JuryMember[]>([])
  const [assignedJuries, setAssignedJuries] = useState<AssignedJury[]>([])
  const [selectedJuryIds, setSelectedJuryIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Charger tous les jurys disponibles
  useEffect(() => {
    const fetchJuryMembers = async () => {
      try {
        const response = await fetch('/api/jury')
        if (response.ok) {
          const data = await response.json()
          setAllJuryMembers(data.filter((j: JuryMember) => j.isActive))
        }
      } catch (error) {
        console.error('Erreur chargement jurys:', error)
      }
    }

    fetchJuryMembers()
  }, [])

  // Charger les jurys assignés à cette session
  useEffect(() => {
    const fetchAssignedJuries = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/jury`)
        if (response.ok) {
          const data = await response.json()
          setAssignedJuries(data)
        }
      } catch (error) {
        console.error('Erreur chargement jurys assignés:', error)
      }
    }

    if (sessionId) {
      fetchAssignedJuries()
    }
  }, [sessionId])

  const handleAssignJuries = async () => {
    if (selectedJuryIds.length === 0) {
      alert('Veuillez sélectionner au moins un jury')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/sessions/${sessionId}/jury`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ juryMemberIds: selectedJuryIds })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        
        // Rafraîchir la liste
        const refreshResponse = await fetch(`/api/sessions/${sessionId}/jury`)
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setAssignedJuries(data)
        }

        setSelectedJuryIds([])
        setShowModal(false)
        
        if (onAssignmentChange) {
          onAssignmentChange()
        }
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur assignation:', error)
      alert('Erreur lors de l\'assignation')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveJury = async (juryMemberId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce jury de la session ?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/jury?juryMemberId=${juryMemberId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        alert('Jury retiré avec succès')
        setAssignedJuries(prev => prev.filter(j => j.juryMemberId !== juryMemberId))
        
        if (onAssignmentChange) {
          onAssignmentChange()
        }
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur retrait jury:', error)
      alert('Erreur lors du retrait')
    }
  }

  const toggleJurySelection = (juryId: number) => {
    setSelectedJuryIds(prev => 
      prev.includes(juryId) 
        ? prev.filter(id => id !== juryId)
        : [...prev, juryId]
    )
  }

  // Filtrer les jurys déjà assignés
  const availableJuries = allJuryMembers.filter(
    jury => !assignedJuries.some(assigned => assigned.juryMemberId === jury.id)
  )

  const getRoleColor = (roleType: string) => {
    switch (roleType) {
      case 'DRH': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'EPC': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'REPRESENTANT_METIER': return 'bg-green-100 text-green-700 border-green-200'
      case 'WFM_JURY': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'FORMATEUR': return 'bg-pink-100 text-pink-700 border-pink-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Jurys Assignés</h3>
              <p className="text-indigo-600 font-medium">
                {assignedJuries.length} jury(s) assigné(s) à cette session
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all cursor-pointer"
          >
            <UserPlus className="w-5 h-5" />
            Assigner des Jurys
          </button>
        </div>
      </div>

      {/* Liste des jurys assignés */}
      <div className="space-y-3">
        {assignedJuries.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-gray-600 text-lg font-semibold mb-2">
              Aucun jury assigné
            </h3>
            <p className="text-gray-500 mb-4">
              Assignez des jurys à cette session pour commencer les évaluations
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
              Assigner des Jurys
            </button>
          </div>
        ) : (
          assignedJuries.map((assigned) => (
            <div 
              key={assigned.id}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {assigned.juryMember.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">
                      {assigned.juryMember.fullName}
                    </h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold border-2 ${getRoleColor(assigned.juryMember.roleType)}`}>
                        {assigned.juryMember.roleType}
                      </span>
                      
                      {assigned.juryMember.specialite && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-200">
                          Spécialité: {assigned.juryMember.specialite}
                        </span>
                      )}
                      
                      {assigned.wasPresent ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold bg-green-100 text-green-700 border-2 border-green-200">
                          <CheckCircle className="w-4 h-4" />
                          Présent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold bg-red-100 text-red-700 border-2 border-red-200">
                          <AlertCircle className="w-4 h-4" />
                          Absent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRemoveJury(assigned.juryMemberId)}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Retirer de la session"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal d'assignation */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* En-tête modal */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white">
                  Assigner des Jurys - {sessionMetier}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Contenu modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {availableJuries.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    Tous les jurys actifs sont déjà assignés à cette session
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Sélectionnez les jurys à assigner ({selectedJuryIds.length} sélectionné{selectedJuryIds.length > 1 ? 's' : ''})
                  </p>
                  
                  {availableJuries.map((jury) => (
                    <div
                      key={jury.id}
                      onClick={() => toggleJurySelection(jury.id)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedJuryIds.includes(jury.id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                          selectedJuryIds.includes(jury.id)
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedJuryIds.includes(jury.id) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                          {jury.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{jury.fullName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold border ${getRoleColor(jury.roleType)}`}>
                              {jury.roleType}
                            </span>
                            {jury.specialite && (
                              <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                {jury.specialite}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Annuler
              </button>
              
              <button
                onClick={handleAssignJuries}
                disabled={loading || selectedJuryIds.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Assignation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Assigner {selectedJuryIds.length} jury{selectedJuryIds.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}