'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CallTracking } from './call-tracking'

interface CallStatusFormProps {
  candidate: {
    id: number
    fullName: string
    phone: string
    email: string
    metier: string
  }
  scores: any
}

export function CallStatusForm({ candidate, scores }: CallStatusFormProps) {
  return (
    <Card className="border-0 shadow-xl bg-linear-to-br from-white to-orange-50/50 backdrop-blur-sm">
      <CardHeader className="bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-t-lg p-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              Gestion des Appels
            </CardTitle>
            <p className="text-orange-100 mt-1">
              Mettez à jour le statut d'appel de {candidate.fullName}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Informations du candidat */}
        <div className="bg-orange-50 rounded-2xl p-4 border-2 border-orange-200 mb-6">
          <h3 className="font-semibold text-orange-800 mb-3">Informations du Candidat</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-orange-600 font-medium">Nom:</span>
              <p className="font-semibold text-orange-800">{candidate.fullName}</p>
            </div>
            <div>
              <span className="text-orange-600 font-medium">Téléphone:</span>
              <p className="font-semibold text-orange-800">{candidate.phone}</p>
            </div>
            <div>
              <span className="text-orange-600 font-medium">Métier:</span>
              <p className="font-semibold text-orange-800">{candidate.metier}</p>
            </div>
          </div>
        </div>

        {/* Votre composant CallTracking existant */}
        <CallTracking 
          candidateId={candidate.id}
          currentStatus={scores?.callStatus}
          currentAttempts={scores?.callAttempts}
          lastCallDate={scores?.lastCallDate}
          callNotes={scores?.callNotes}
        />
      </CardContent>
    </Card>
  )
}