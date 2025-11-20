'use client'

import { useState } from 'react'
import { Metier, SessionStatus } from '@prisma/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SessionDetailsProps {
  session: {
    id: string
    metier: Metier
    date: Date
    jour: string
    status: SessionStatus
    description?: string | null
    location?: string | null
    candidates: Array<{
      id: number
      fullName: string
      email: string
      phone: string
      scores?: {
        finalDecision: string | null
        callStatus: string | null
      } | null
      faceToFaceScores: Array<{
        juryMember: {
          fullName: string
          roleType: string
        }
        phase: number
        score: any
      }>
    }>
    juryPresences: Array<{
      id: number
      juryMember: {
        id: number
        fullName: string
        roleType: string
        specialite: Metier | null
      }
      wasPresent: boolean
      absenceReason?: string | null
    }>
    _count: {
      candidates: number
      juryPresences: number
    }
  }
  availableJuryMembers?: Array<{
    id: number
    fullName: string
    roleType: string
    specialite: string | null
  }>
}

export function SessionDetails({ session, availableJuryMembers = [] }: SessionDetailsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'jury'>('overview')
  const [showJuryForm, setShowJuryForm] = useState(false)
  const [selectedJuryId, setSelectedJuryId] = useState<number | null>(null)
  const [wasPresent, setWasPresent] = useState(true)
  const [absenceReason, setAbsenceReason] = useState('')
  const [loading, setLoading] = useState(false)

  // Statistiques calculées
  const recruitedCount = session.candidates.filter(c => c.scores?.finalDecision === 'RECRUTE').length
  const contactedCount = session.candidates.filter(c => c.scores?.callStatus && c.scores.callStatus !== 'NON_CONTACTE').length
  const presentJuryCount = session.juryPresences.filter(jp => jp.wasPresent).length

  // Filtrer les jurys disponibles
  const currentJuryIds = session.juryPresences.map(jp => jp.juryMember.id)
  const availableToAdd = availableJuryMembers.filter(j => !currentJuryIds.includes(j.id))

  const handleAddJury = async () => {
    if (!selectedJuryId) {
      alert('Veuillez sélectionner un membre du jury')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/sessions/${session.id}/jury`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          juryMemberId: selectedJuryId,
          wasPresent,
          absenceReason: !wasPresent ? absenceReason : null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'ajout')
      }

      setSelectedJuryId(null)
      setWasPresent(true)
      setAbsenceReason('')
      setShowJuryForm(false)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveJury = async (presenceId: number) => {
    if (!confirm('Retirer ce membre du jury de cette session ?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/sessions/${session.id}/jury/${presenceId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur')
      }

      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePresence = async (presenceId: number, currentPresent: boolean) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sessions/${session.id}/jury/${presenceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wasPresent: !currentPresent,
          absenceReason: currentPresent ? 'Non précisée' : null
        })
      })

      if (!response.ok) throw new Error('Erreur')

      router.refresh()
    } catch (err) {
      alert('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'PLANIFIED': return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200'
      case 'IN_PROGRESS': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200'
      case 'COMPLETED': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-200'
      case 'CANCELLED': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200'
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-200'
    }
  }

  const getCallStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'CONFIRME': return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200'
      case 'REFUS': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200'
      case 'CONTACTE': return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200'
      case 'RESISTANT': return 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200'
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-200'
    }
  }

  const getDecisionColor = (decision: string | null | undefined) => {
    switch (decision) {
      case 'RECRUTE': return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200'
      case 'NON_RECRUTE': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200'
      default: return 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DRH': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'EPC': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'REPRESENTANT_METIER': return 'bg-emerald-100 text-emerald-700 border-emerald-300'
      case 'WFM_JURY': return 'bg-purple-100 text-purple-700 border-purple-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {session.metier}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-orange-700">
                <div className="flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(session.date).toLocaleDateString('fr-FR')} ({session.jour})
                </div>
                {session.location && (
                  <div className="flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {session.location}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 ${getStatusColor(session.status)}`}>
              {session.status}
            </span>
            <div className="flex gap-2">
              <Link
                href={`/wfm/sessions/${session.id}/edit`}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </Link>
              <Link
                href={`/api/export/session/${session.id}`}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter
              </Link>
            </div>
          </div>
        </div>

        {session.description && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-orange-200">
            <p className="text-orange-800">{session.description}</p>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 text-center border-2 border-blue-200 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{session._count.candidates}</div>
          <div className="text-sm text-blue-700 font-medium mt-1">Candidats</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 text-center border-2 border-emerald-200 shadow-sm">
          <div className="text-3xl font-bold text-emerald-600">{recruitedCount}</div>
          <div className="text-sm text-emerald-700 font-medium mt-1">Recrutés</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 text-center border-2 border-purple-200 shadow-sm">
          <div className="text-3xl font-bold text-purple-600">{contactedCount}</div>
          <div className="text-sm text-purple-700 font-medium mt-1">Contactés</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 text-center border-2 border-orange-200 shadow-sm">
          <div className="text-3xl font-bold text-orange-600">{presentJuryCount}</div>
          <div className="text-sm text-orange-700 font-medium mt-1">Jurys Présents</div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-lg overflow-hidden">
        <div className="border-b-2 border-orange-100">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 py-4 px-6 text-center border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-500 hover:text-orange-700 hover:bg-orange-50/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Aperçu
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`flex items-center gap-2 py-4 px-6 text-center border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'candidates'
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-500 hover:text-orange-700 hover:bg-orange-50/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Candidats ({session.candidates.length})
            </button>
            <button
              onClick={() => setActiveTab('jury')}
              className={`flex items-center gap-2 py-4 px-6 text-center border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'jury'
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-500 hover:text-orange-700 hover:bg-orange-50/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Jury ({session.juryPresences.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Onglet Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-orange-800 mb-4">Progression des Évaluations</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border-2 border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Évaluations Face à Face
                    </h4>
                    <div className="space-y-3">
                      {session.candidates.map(candidate => {
                        const evaluatedPhases = new Set(candidate.faceToFaceScores.map(s => s.phase))
                        return (
                          <div key={candidate.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-200">
                            <span className="font-medium text-gray-900">{candidate.fullName}</span>
                            <span className="text-blue-600 font-bold">
                              {evaluatedPhases.size > 0 ? `Phase ${Array.from(evaluatedPhases).join(', ')}` : 'Aucune'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border-2 border-emerald-200">
                    <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Décisions Finales
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-emerald-200">
                        <span className="font-medium">Recrutés</span>
                        <span className="text-emerald-600 font-bold text-lg">{recruitedCount}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-red-200">
                        <span className="font-medium">Non recrutés</span>
                        <span className="text-red-600 font-bold text-lg">
                          {session.candidates.length - recruitedCount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-amber-200">
                        <span className="font-medium">En attente</span>
                        <span className="text-amber-600 font-bold text-lg">
                          {session.candidates.filter(c => !c.scores?.finalDecision).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Candidats */}
          {activeTab === 'candidates' && (
            <div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                <h3 className="text-xl font-bold text-orange-800">Liste des Candidats</h3>
                <Link
                  href="/wfm/candidates/new"
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un Candidat
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                        Candidat
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                        Statut Appel
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800 uppercase tracking-wider">
                        Décision
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-orange-800 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {session.candidates.map(candidate => (
                      <tr key={candidate.id} className="hover:bg-orange-50/50 transition-all duration-200">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{candidate.fullName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-gray-900">{candidate.email}</div>
                            <div className="text-orange-600">{candidate.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getCallStatusColor(candidate.scores?.callStatus)}`}>
                            {candidate.scores?.callStatus || 'Non contacté'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getDecisionColor(candidate.scores?.finalDecision)}`}>
                            {candidate.scores?.finalDecision || 'En attente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Link
                              href={`/wfm/candidates/${candidate.id}`}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Voir
                            </Link>
                            <Link
                              href={`/wfm/candidates/${candidate.id}/consolidation`}
                              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 text-sm font-medium transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Scores
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Onglet Jury - NOUVEAU */}
          {activeTab === 'jury' && (
            <div className="space-y-6">
              {/* En-tête */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-orange-800">Composition du Jury</h3>
                {availableToAdd.length > 0 && (
                  <button
                    onClick={() => setShowJuryForm(!showJuryForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg font-semibold"
                  >
                    {showJuryForm ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Annuler
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Ajouter un Jury
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Formulaire d'ajout */}
              {showJuryForm && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter un membre du jury
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Membre du jury *
                      </label>
                      <select
                        value={selectedJuryId || ''}
                        onChange={(e) => setSelectedJuryId(Number(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-200 bg-white"
                        disabled={loading}
                      >
                        <option value="">Sélectionnez un membre</option>
                        {availableToAdd.map(jury => (
                          <option key={jury.id} value={jury.id}>
                            {jury.fullName} - {jury.roleType}
                            {jury.specialite && ` (${jury.specialite})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-purple-200">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wasPresent}
                          onChange={(e) => setWasPresent(e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-purple-300 text-purple-600 focus:ring-purple-500"
                          disabled={loading}
                        />
                        <span className="font-medium text-gray-700">
                          Marquer comme présent
                        </span>
                      </label>
                    </div>

                    {!wasPresent && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Raison de l'absence
                        </label>
                        <input
                          type="text"
                          value={absenceReason}
                          onChange={(e) => setAbsenceReason(e.target.value)}
                          placeholder="Ex: Congé, Mission, Autre engagement..."
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                          disabled={loading}
                        />
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => {
                          setShowJuryForm(false)
                          setSelectedJuryId(null)
                        }}
                        className="flex-1 px-4 py-3 border-2 border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 font-semibold transition-all"
                        disabled={loading}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleAddJury}
                        disabled={loading || !selectedJuryId}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Ajout...
                          </div>
                        ) : (
                          'Ajouter'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des jurys */}
              {session.juryPresences.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun jury assigné</h3>
                  <p className="text-gray-500">
                    Ajoutez les membres du jury qui participeront à cette session
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {session.juryPresences.map((presence) => (
                    <div
                      key={presence.id}
                      className={`rounded-2xl p-5 border-2 shadow-sm transition-all hover:shadow-md ${
                        presence.wasPresent
                          ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
                          : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {presence.juryMember.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm">
                              {presence.juryMember.fullName}
                            </h4>
                            <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold border ${getRoleColor(presence.juryMember.roleType)}`}>
                              {presence.juryMember.roleType}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveJury(presence.id)}
                          disabled={loading}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Retirer de la session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {presence.juryMember.specialite && (
                        <div className="text-xs text-gray-600 mb-3 flex items-center gap-1">
                          <span className="font-medium">Spécialité:</span>
                          <span>{presence.juryMember.specialite}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleTogglePresence(presence.id, presence.wasPresent)}
                          disabled={loading}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            presence.wasPresent
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {presence.wasPresent ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Présent
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Absent
                            </>
                          )}
                        </button>
                      </div>

                      {!presence.wasPresent && presence.absenceReason && (
                        <div className="mt-3 p-2 bg-white rounded-lg border border-red-200">
                          <p className="text-xs text-red-700">
                            <span className="font-semibold">Raison:</span> {presence.absenceReason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Statistiques */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <div className="text-2xl font-bold text-gray-800">{session.juryPresences.length}</div>
                  <div className="text-sm text-gray-600">Total membres</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-600">
                    {session.juryPresences.filter(p => p.wasPresent).length}
                  </div>
                  <div className="text-sm text-emerald-700">Présents</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {session.juryPresences.filter(p => !p.wasPresent).length}
                  </div>
                  <div className="text-sm text-red-700">Absents</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}