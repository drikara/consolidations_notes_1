//components/jury-profile.tsx
'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Edit,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react'

interface JuryProfileProps {
  juryMember: any
  stats: {
    totalEvaluations: number
    phase1Evaluations: number
    phase2Evaluations: number
    totalPresences: number
    presenceRate: number
    lastActivity: Date | null
  }
}

export function JuryProfile({ juryMember, stats }: JuryProfileProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DRH':
        return 'bg-orange-500 text-white'
      case 'EPC':
        return 'bg-blue-500 text-white'
      case 'REPRESENTANT_METIER':
        return 'bg-emerald-500 text-white'
      case 'WFM_JURY':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Déterminer si l'utilisateur est actuellement en ligne (connecté dans les dernières 15 minutes)
  const isCurrentlyOnline = juryMember.user.lastLogin && 
    (new Date().getTime() - new Date(juryMember.user.lastLogin).getTime()) < 15 * 60 * 1000

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/wfm/jury">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Profil du Membre du Jury</h1>
            <p className="text-gray-600">Détails et statistiques</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/wfm/jury/${juryMember.id}/edit`}>
            <Button className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Informations personnelles */}
        <div className="lg:col-span-1 space-y-6">
          {/* Carte profil */}
          <Card className="border-2 border-orange-100">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
                  {juryMember.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">{juryMember.fullName}</h2>
                <Badge className={`${getRoleColor(juryMember.roleType)} mb-4`}>
                  {juryMember.roleType}
                </Badge>
                
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{juryMember.user.email}</span>
                  </div>
                  
                  {juryMember.phone && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{juryMember.phone}</span>
                    </div>
                  )}
                  
                  {juryMember.department && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Building className="w-4 h-4" />
                      <span className="text-sm">{juryMember.department}</span>
                    </div>
                  )}
                  
                  {juryMember.specialite && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Award className="w-4 h-4" />
                      <span className="text-sm">Spécialité: {juryMember.specialite}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statut utilisateur - CORRIGÉ */}
          <Card className="border-2 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <User className="w-5 h-5" />
                Statut du Compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Statut actuel:</span>
                <Badge variant={isCurrentlyOnline ? "default" : "secondary"} 
                      className={isCurrentlyOnline ? "bg-green-100 text-green-700 border-green-200" : ""}>
                  {isCurrentlyOnline ? 'En ligne' : 'Hors ligne'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dernière connexion:</span>
                <span className="text-sm text-gray-600 text-right">
                  {juryMember.user.lastLogin ? 
                    formatDateTime(juryMember.user.lastLogin) : 
                    'Jamais connecté'
                  }
                </span>
              </div>
              {stats.lastActivity && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernière activité:</span>
                  <span className="text-sm text-gray-600 text-right">
                    {formatDateTime(stats.lastActivity)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Membre depuis:</span>
                <span className="text-sm text-gray-600 text-right">
                  {formatDate(juryMember.user.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Statut compte:</span>
                <Badge variant={juryMember.user.isActive ? "default" : "secondary"}>
                  {juryMember.user.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {juryMember.notes && (
            <Card className="border-2 border-amber-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Edit className="w-5 h-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">{juryMember.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne droite - Statistiques et activités */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">{stats.totalEvaluations}</div>
                <div className="text-sm text-orange-600">Évaluations</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{stats.phase1Evaluations}</div>
                <div className="text-sm text-blue-600">Phase 1</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">{stats.phase2Evaluations}</div>
                <div className="text-sm text-green-600">Phase 2</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700">{stats.totalPresences}</div>
                <div className="text-sm text-purple-600">Sessions</div>
              </CardContent>
            </Card>
          </div>

          {/* Dernières évaluations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Dernières Évaluations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {juryMember.faceToFaceScores.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune évaluation</p>
              ) : (
                <div className="space-y-3">
                  {juryMember.faceToFaceScores.map((score: any) => (
                    <div key={score.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{score.candidate.fullName}</div>
                        <div className="text-sm text-gray-600">{score.candidate.metier}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">Phase {score.phase}: {score.score}/5</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(score.evaluatedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dernières présences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Dernières Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {juryMember.juryPresences.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune participation à une session</p>
              ) : (
                <div className="space-y-3">
                  {juryMember.juryPresences.map((presence: any) => (
                    <div key={presence.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">Session {presence.session.metier}</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(presence.session.date)} • {presence.session.location || 'Non spécifié'}
                        </div>
                      </div>
                      <div className="text-right">
                        {presence.wasPresent ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Présent
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Absent
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}