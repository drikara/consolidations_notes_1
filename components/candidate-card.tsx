// components/candidate-card.tsx
'use client'

import Link from 'next/link'
import { Metier } from '@prisma/client'

interface CandidateCardProps {
  candidate: {
    id: number
    fullName: string
    email: string
    phone: string
    metier: Metier
    location: string
    age: number
    scores?: {
      callStatus: string
      finalDecision?: string
    }
    session?: {
      metier: string
      date: Date
      jour: string
    }
  }
  showActions?: boolean
}

export function CandidateCard({ candidate, showActions = true }: CandidateCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ADMIS':
        return 'bg-green-100 text-green-800'
      case 'NON_ADMIS':
        return 'bg-red-100 text-red-800'
      case 'CONTACTE':
        return 'bg-blue-100 text-blue-800'
      case 'NON_CONTACTE':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* En-tête */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{candidate.fullName}</h3>
          <p className="text-sm text-gray-600">{candidate.email}</p>
        </div>
        {candidate.scores?.finalDecision && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.scores.finalDecision)}`}>
            {candidate.scores.finalDecision}
          </span>
        )}
      </div>

      {/* Informations */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Métier</span>
          <span className="text-sm font-medium">{candidate.metier}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Téléphone</span>
          <span className="text-sm font-medium">{candidate.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Localisation</span>
          <span className="text-sm font-medium">{candidate.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Âge</span>
          <span className="text-sm font-medium">{candidate.age} ans</span>
        </div>
        {candidate.session && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Session</span>
            <span className="text-sm font-medium">
              {new Date(candidate.session.date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Statut d'appel */}
      {candidate.scores?.callStatus && (
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Statut appel</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.scores.callStatus)}`}>
              {candidate.scores.callStatus}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <Link
            href={`/wfm/candidates/${candidate.id}`}
            className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Voir détails
          </Link>
          <Link
            href={`/wfm/candidates/${candidate.id}/consolidation`}
            className="flex-1 bg-green-600 text-white text-center py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Consolidation
          </Link>
        </div>
      )}
    </div>
  )
}