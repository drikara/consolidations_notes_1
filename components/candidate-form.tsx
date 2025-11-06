"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Metier } from "@prisma/client"
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

type CandidateFormProps = {
  candidate?: {
    id?: number
    fullName: string
    phone: string
    birthDate: string
    age: number
    diploma: string
    institution: string
    email: string
    location: string
    smsSentDate?: string
    availability: string
    interviewDate?: string
    metier: string
    sessionId?: string
  }
  sessions?: Array<{
    id: string
    metier: Metier
    date: Date
    jour: string
    status: string
  }>
}

export function CandidateForm({ candidate, sessions = [] }: CandidateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    fullName: candidate?.fullName || "",
    phone: candidate?.phone || "",
    birthDate: candidate?.birthDate || "",
    diploma: candidate?.diploma || "",
    institution: candidate?.institution || "",
    email: candidate?.email || "",
    location: candidate?.location || "",
    smsSentDate: candidate?.smsSentDate || "",
    availability: candidate?.availability || "",
    interviewDate: candidate?.interviewDate || "",
    metier: candidate?.metier || "",
    sessionId: candidate?.sessionId || "",
  })

  // Utilisez l'enum Metier de Prisma pour la cohérence
  const metiers = Object.values(Metier).map(metier => ({
    value: metier,
    label: metier.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }))

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0
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
      const age = calculateAge(formData.birthDate)
      
      // 🔍 CORRECTION : Les données doivent correspondre exactement à l'API
      const apiData = {
        fullName: formData.fullName,
        phone: formData.phone,
        birthDate: formData.birthDate,
        age: age,
        diploma: formData.diploma,
        institution: formData.institution,
        email: formData.email,
        location: formData.location,
        smsSentDate: formData.smsSentDate || null,
        availability: formData.availability,
        interviewDate: formData.interviewDate || null,
        metier: formData.metier,
        sessionId: formData.sessionId || null,
        notes: "" // Ajout du champ notes qui est requis dans l'API
      }

      console.log('🔍 Données envoyées à l\'API:', apiData)

      const url = candidate?.id ? `/api/candidates/${candidate.id}` : "/api/candidates"
      const method = candidate?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'enregistrement")
      }

      router.push("/wfm/candidates")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
        {/* En-tête avec gradient */}
        <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg p-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <User className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {candidate?.id ? "Modifier le Candidat" : "Nouveau Candidat"}
              </CardTitle>
              <p className="text-orange-100 mt-1">
                {candidate?.id 
                  ? "Mettez à jour les informations du candidat" 
                  : "Ajoutez un nouveau candidat au système"
                }
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
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Nom et Prénoms <span className="text-red-500">*</span></span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    required
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                    disabled={loading}
                    placeholder="John Doe"
                  />
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
                  <Label htmlFor="birthDate" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Date de Naissance <span className="text-red-500">*</span></span>
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange("birthDate", e.target.value)}
                    required
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email <span className="text-red-500">*</span></span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                    disabled={loading}
                    placeholder="john.doe@example.com"
                  />
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
                  <p className="text-xs text-gray-500 mt-1">
                    {metiers.length} métiers disponibles
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="availability" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Disponibilité <span className="text-red-500">*</span></span>
                  </Label>
                  <Input
                    id="availability"
                    value={formData.availability}
                    onChange={(e) => handleChange("availability", e.target.value)}
                    required
                    placeholder="Ex: Immédiate, Dans 2 semaines..."
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="smsSentDate" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Date Envoi SMS</span>
                  </Label>
                  <Input
                    id="smsSentDate"
                    type="date"
                    value={formData.smsSentDate}
                    onChange={(e) => handleChange("smsSentDate", e.target.value)}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="interviewDate" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Date Entretien</span>
                  </Label>
                  <Input
                    id="interviewDate"
                    type="date"
                    value={formData.interviewDate}
                    onChange={(e) => handleChange("interviewDate", e.target.value)}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Sélecteur de session */}
              {sessions.length > 0 && (
                <div className="space-y-3">
                  <Label htmlFor="sessionId" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Session de Recrutement </span>
                  </Label>
                  <select 
                    id="sessionId"
                    value={formData.sessionId} 
                    onChange={(e) => handleChange("sessionId", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors h-11 bg-white"
                    disabled={loading}
                  >
                    <option value="">Aucune session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.metier} - {session.jour} {new Date(session.date).toLocaleDateString('fr-FR')} ({session.status})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {sessions.length} session(s) disponible(s)
                  </p>
                </div>
              )}
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
                onClick={() => router.back()}
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
                    {candidate?.id ? "Mise à jour..." : "Création..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {candidate?.id ? "Mettre à Jour" : "Créer le Candidat"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}