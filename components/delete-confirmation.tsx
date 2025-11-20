// components/delete-confirmation.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function DeleteConfirmation({ juryMember }: { juryMember: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement ce membre du jury ? Cette action est irréversible.")) {
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log(`🗑️ Suppression du membre jury ID: ${juryMember.id}`)
      
      // ⭐ CORRECTION: Utiliser la bonne URL API
      const response = await fetch(`/api/jury/${juryMember.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la suppression")
      }

      console.log("✅ Suppression réussie:", result)
      router.push("/wfm/jury")
      router.refresh()

    } catch (err: any) {
      console.error("❌ Erreur suppression:", err)
      setError(err.message || "Erreur lors de la suppression")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* En-tête d'avertissement */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Confirmation de Suppression
            </h1>
            <p className="text-red-700">
              Vous êtes sur le point de supprimer définitivement un membre du jury
            </p>
          </div>
        </div>
      </div>

      {/* Détails du membre */}
      <Card className="border-2 border-red-100 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-semibold">
                {juryMember.fullName.split(' ').map((n: any[]) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{juryMember.fullName}</h3>
                <p className="text-sm text-red-600">{juryMember.user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Rôle:</span>
                <span className="ml-2 text-gray-900">{juryMember.roleType}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Spécialité:</span>
                <span className="ml-2 text-gray-900">{juryMember.specialite || "Aucune"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Évaluations:</span>
                <span className="ml-2 text-gray-900">{juryMember.faceToFaceScores.length}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Présences:</span>
                <span className="ml-2 text-gray-900">{juryMember.juryPresences.length}</span>
              </div>
            </div>

            {/* Avertissements */}
            {juryMember.faceToFaceScores.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-amber-800">Attention</p>
                    <p className="text-amber-700 text-sm">
                      {juryMember.faceToFaceScores.length} évaluation(s) seront également supprimées.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-800">Erreur</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-end pt-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 rounded-xl px-6 h-12 font-semibold transition-all duration-200"
          disabled={loading}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleDelete}
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl rounded-xl px-8 h-12 font-semibold transition-all duration-200 disabled:opacity-50" 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Suppression...
            </div>
          ) : (
            "Confirmer la Suppression"
          )}
        </Button>
      </div>
    </div>
  )
}