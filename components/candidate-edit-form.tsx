'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Metier, SessionStatus, Disponibilite, NiveauEtudes } from '@prisma/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  User, 
  Phone, 
  Calendar, 
  Mail, 
  GraduationCap, 
  MapPin, 
  Briefcase, 
  Clock,
  Send,
  Users,
  Save,
  ArrowLeft,
  Loader2
} from "lucide-react"

interface Session {
  id: string
  metier: Metier
  date: Date
  jour: string
  status: SessionStatus
  description?: string | null
  location?: string | null
}

interface CandidateEditFormProps {
  candidate: {
    id: number
    nom: string
    prenom: string
    phone: string
    birth_date: string
    age: number
    diploma: string
    niveau_etudes: NiveauEtudes
    institution: string
    email?: string | null
    location: string
    sms_sent_date?: string
    availability: Disponibilite
    interview_date?: string
    metier: Metier
    session_id?: string
    notes?: string
  }
  sessions: Session[]
}

export function CandidateEditForm({ candidate, sessions }: CandidateEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    nom: candidate.nom,
    prenom: candidate.prenom,
    phone: candidate.phone,
    birth_date: candidate.birth_date,
    diploma: candidate.diploma,
    niveau_etudes: candidate.niveau_etudes,
    institution: candidate.institution,
    email: candidate.email || '',
    location: candidate.location,
    sms_sent_date: candidate.sms_sent_date || '',
    availability: candidate.availability,
    interview_date: candidate.interview_date || '',
    metier: candidate.metier,
    session_id: candidate.session_id || 'none',
    notes: candidate.notes || ''
  })

  const metiers = Object.values(Metier).map(metier => ({
    value: metier,
    label: metier.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }))

  const niveauxEtudes = Object.values(NiveauEtudes).map(niveau => ({
    value: niveau,
    label: niveau.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }))

  const disponibilites = Object.values(Disponibilite).map(dispo => ({
    value: dispo,
    label: dispo
  }))

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return candidate.age
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const age = calculateAge(formData.birth_date)
      
      // Formater nom et prénom selon les règles
      const nomFormatted = formData.nom.toUpperCase().trim()
      const prenomFormatted = formData.prenom.trim().charAt(0).toUpperCase() + 
                             formData.prenom.trim().slice(1).toLowerCase()

      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: nomFormatted,
          prenom: prenomFormatted,
          phone: formData.phone,
          birthDate: formData.birth_date,
          age,
          diploma: formData.diploma,
          niveauEtudes: formData.niveau_etudes,
          institution: formData.institution,
          email: formData.email || null,
          location: formData.location,
          smsSentDate: formData.sms_sent_date,
          availability: formData.availability,
          interviewDate: formData.interview_date,
          metier: formData.metier,
          sessionId: formData.session_id === 'none' ? null : formData.session_id,
          notes: formData.notes
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de la modification")
      }

      router.push(`/wfm/candidates/${candidate.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la modification du candidat")
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg p-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <User className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              Modifier le Candidat
            </CardTitle>
            <p className="text-orange-100 mt-1">
              Mettez à jour les informations de {candidate.nom} {candidate.prenom}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section Informations Personnelles */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Informations Personnelles</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="nom" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Nom <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => handleChange("nom", e.target.value)}
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                  disabled={loading}
                  placeholder="DOE"
                  onBlur={(e) => {
                    if (e.target.value) {
                      handleChange("nom", e.target.value.toUpperCase())
                    }
                  }}
                />
                <p className="text-xs text-gray-500">Sera converti en majuscules</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="prenom" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Prénom <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => handleChange("prenom", e.target.value)}
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                  disabled={loading}
                  placeholder="John"
                  onBlur={(e) => {
                    if (e.target.value) {
                      const value = e.target.value.trim()
                      const formatted = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
                      handleChange("prenom", formatted)
                    }
                  }}
                />
                <p className="text-xs text-gray-500">Première lettre en majuscule</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Numéro de Téléphone <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                  disabled={loading}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="birth_date" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Date de Naissance <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleChange("birth_date", e.target.value)}
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                  disabled={loading}
                />
                {formData.birth_date && (
                  <p className="text-sm text-gray-500">
                    Âge calculé: {calculateAge(formData.birth_date)} ans
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                  disabled={loading}
                  placeholder="john.doe@example.com"
                />
                <p className="text-xs text-gray-500">Optionnel</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Lieu d'Habitation <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                  disabled={loading}
                  placeholder="Paris, France"
                />
              </div>
            </div>
          </div>

          {/* Section Formation */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Formation</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="diploma" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Diplôme <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="diploma"
                  value={formData.diploma}
                  onChange={(e) => handleChange("diploma", e.target.value)}
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                  disabled={loading}
                  placeholder="BAC +3 Informatique"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="niveau_etudes" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Niveau d'Études <span className="text-red-500">*</span></span>
                </Label>
                <Select
                  value={formData.niveau_etudes}
                  onValueChange={(value) => handleChange("niveau_etudes", value)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11">
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveauxEtudes.map((niveau) => (
                      <SelectItem key={niveau.value} value={niveau.value}>
                        {niveau.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="institution" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Établissement <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => handleChange("institution", e.target.value)}
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                  disabled={loading}
                  placeholder="Université Paris-Saclay"
                />
              </div>
            </div>
          </div>

          {/* Section Recrutement */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Recrutement</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="metier" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Métier <span className="text-red-500">*</span></span>
                </Label>
                <select 
                  id="metier"
                  value={formData.metier} 
                  onChange={(e) => handleChange("metier", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors h-11 bg-white"
                  required
                  disabled={loading}
                >
                  <option value="">Sélectionner un métier</option>
                  {metiers.map((metier) => (
                    <option key={metier.value} value={metier.value}>
                      {metier.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="availability" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Disponibilité <span className="text-red-500">*</span></span>
                </Label>
                <Select
                  value={formData.availability}
                  onValueChange={(value) => handleChange("availability", value)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11">
                    <SelectValue placeholder="Sélectionner une disponibilité" />
                  </SelectTrigger>
                  <SelectContent>
                    {disponibilites.map((dispo) => (
                      <SelectItem key={dispo.value} value={dispo.value}>
                        {dispo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.availability === 'NON' && (
                  <p className="text-xs text-red-500 font-medium">
                    ⚠️ Le candidat sera automatiquement marqué comme non recruté
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="sms_sent_date" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Date Envoi SMS <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="sms_sent_date"
                  type="date"
                  value={formData.sms_sent_date}
                  onChange={(e) => handleChange("sms_sent_date", e.target.value)}
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                  disabled={loading}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="interview_date" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Date Entretien <span className="text-red-500">*</span></span>
                </Label>
                <Input
                  id="interview_date"
                  type="date"
                  value={formData.interview_date}
                  onChange={(e) => handleChange("interview_date", e.target.value)}
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Sélecteur de session */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Session de Recrutement</span>
              </Label>
              <Select 
                value={formData.session_id} 
                onValueChange={(value) => handleChange("session_id", value)}
                disabled={loading}
              >
                <SelectTrigger className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11">
                  <SelectValue placeholder="Sélectionner une session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune session</SelectItem>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.metier} - {session.jour} {new Date(session.date).toLocaleDateString('fr-FR')} ({session.status === 'PLANIFIED' ? 'Planifiée' : 'En cours'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/wfm/candidates/${candidate.id}`)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors h-11 px-6 cursor-pointer"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-11 px-8 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Mettre à Jour
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}