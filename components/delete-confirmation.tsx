'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Calendar,
  Award,
  ArrowLeft,
  Trash2,
  Shield
} from 'lucide-react'

interface DeleteConfirmationProps {
  juryMember: {
    id: number
    fullName: string
    roleType: string
    specialite: string | null
    department: string | null
    phone: string | null
    user: {
      email: string
      name: string
    }
    faceToFaceScores: Array<{
      id: number
      candidate: {
        fullName: string
      }
    }>
    juryPresences: Array<{
      id: number
      session: {
        metier: string
        date: Date
      }
    }>
  }
}

export function DeleteConfirmation({ juryMember }: DeleteConfirmationProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    
    try {
      console.log('🗑️ Tentative de suppression du membre:', juryMember.id)
      
      // ✅ CORRECTION: Utiliser la bonne route API
      const response = await fetch(`/api/jury-members/${juryMember.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 Statut de la réponse:', response.status)

      if (response.ok) {
        console.log('✅ Suppression réussie')
        setIsDeleted(true)
        
        // Redirection automatique après 2 secondes
        setTimeout(() => {
          router.push('/wfm/jury')
          router.refresh()
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('❌ Erreur serveur:', errorData)
        setError(errorData.error || 'Erreur lors de la suppression')
        alert(`Erreur: ${errorData.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error)
      setError('Erreur de connexion au serveur')
      alert('Erreur lors de la suppression du membre du jury')
    } finally {
      setIsDeleting(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DRH':
        return 'bg-gradient-to-r from-orange-500 to-amber-500'
      case 'EPC':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500'
      case 'REPRESENTANT_METIER':
        return 'bg-gradient-to-r from-emerald-500 to-green-500'
      case 'WFM_JURY':
        return 'bg-gradient-to-r from-purple-500 to-pink-500'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  }

  if (isDeleted) {
    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="text-center">
          <Link href="/wfm/jury">
            <Button variant="outline" size="sm" className="mb-6 flex items-center gap-2 mx-auto">
              <ArrowLeft className="w-4 h-4" />
              Retour à la liste
            </Button>
          </Link>
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-800 mb-4">
            Suppression Confirmée
          </h1>
          <p className="text-lg text-emerald-700 max-w-2xl mx-auto">
            Le membre du jury <strong>{juryMember.fullName}</strong> a été supprimé avec succès.
          </p>
        </div>

        {/* Carte de confirmation */}
        <Card className="border-2 border-emerald-200 bg-emerald-50 max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
                <User className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                  {juryMember.fullName}
                </h3>
                <p className="text-emerald-700">
                  A été définitivement supprimé du système
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-sm text-emerald-600">
                  Redirection automatique vers la liste des membres dans 2 secondes...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/wfm/jury">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Retourner à la liste
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <Link href="/wfm/jury">
          <Button variant="outline" size="sm" className="mb-6 flex items-center gap-2 mx-auto">
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </Button>
        </Link>
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <AlertTriangle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-red-800 mb-4">
          Confirmation de Suppression
        </h1>
        <p className="text-lg text-red-700 max-w-2xl mx-auto">
          Vous êtes sur le point de supprimer définitivement un membre du jury. Cette action est irréversible.
        </p>
      </div>

      {/* Message d'erreur si présent */}
      {error && (
        <div className="max-w-2xl mx-auto bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3 text-red-800">
            <XCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Erreur de suppression</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations du membre */}
        <Card className="border-2 border-orange-200">
          <CardHeader className="bg-orange-50 border-b border-orange-200">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <User className="w-5 h-5" />
              Informations du Membre
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                  {juryMember.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{juryMember.fullName}</h3>
                  <Badge className={`${getRoleColor(juryMember.roleType)} text-white mt-1`}>
                    {juryMember.roleType}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{juryMember.user.email}</span>
                </div>
                
                {juryMember.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Shield className="w-4 h-4" />
                    <span>{juryMember.phone}</span>
                  </div>
                )}
                
                {juryMember.department && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Award className="w-4 h-4" />
                    <span>Département: {juryMember.department}</span>
                  </div>
                )}
                
                {juryMember.specialite && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Award className="w-4 h-4" />
                    <span>Spécialité: {juryMember.specialite}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact de la suppression */}
        <Card className="border-2 border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Impact de la Suppression
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3 text-red-800">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Attention: Action Irréversible</p>
                    <p className="text-sm mt-1">
                      Toutes les données associées à ce membre seront perdues définitivement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-orange-700 font-medium">Évaluations réalisées:</span>
                  <Badge variant="outline" className="bg-white text-orange-700">
                    {juryMember.faceToFaceScores.length}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-orange-700 font-medium">Sessions participées:</span>
                  <Badge variant="outline" className="bg-white text-orange-700">
                    {juryMember.juryPresences.length}
                  </Badge>
                </div>

                {juryMember.faceToFaceScores.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm font-medium">
                      ⚠️ Ce membre a des évaluations en cours. La suppression effacera également toutes ses notes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 border-t border-orange-200">
        <Link href="/wfm/jury" className="w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="w-full border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 h-12 text-lg font-semibold"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Annuler la Suppression
          </Button>
        </Link>
        
        <Button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-xl h-12 text-lg font-semibold"
        >
          {isDeleting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Suppression en cours...
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5 mr-2" />
              Confirmer la Suppression
            </>
          )}
        </Button>
      </div>
    </div>
  )
}