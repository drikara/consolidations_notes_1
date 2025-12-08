"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Loader2,
} from "lucide-react"

type CandidateFormProps = {
  candidate?: {
    id?: number
    fullName: string
    phone: string
    birthDate: string
    age: number
    diploma: string
    niveauEtudes: string
    institution: string
    email: string
    location: string
    smsSentDate?: string
    availability: string
    interviewDate?: string
    metier: string
    sessionId?: string
    notes?: string
  }
  sessions?: Array<{
    id: string
    metier: Metier
    date: Date
    jour: string
    status: string
  }>
}

// Liste des niveaux d'études
const niveauxEtudes = [
  { value: "CEPE", label: "CEPE" },
  { value: "BEPC", label: "BEPC" },
  { value: "BAC", label: "BAC" },
  { value: "BAC+1", label: "BAC+1" },
  { value: "BAC+2", label: "BAC+2" },
  { value: "BAC+3", label: "BAC+3 (Licence)" },
  { value: "BAC+4", label: "BAC+4" },
  { value: "BAC+5", label: "BAC+5 (Master)" },
  { value: "BAC+8", label: "BAC+8 (Doctorat)" },
]

export function CandidateForm({ candidate, sessions = [] }: CandidateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    fullName: candidate?.fullName || "",
    phone: candidate?.phone || "",
    birthDate: candidate?.birthDate || "",
    diploma: candidate?.diploma || "",
    niveauEtudes: candidate?.niveauEtudes || "",
    institution: candidate?.institution || "",
    email: candidate?.email || "",
    location: candidate?.location || "",
    smsSentDate: candidate?.smsSentDate || "",
    availability: candidate?.availability || "",
    interviewDate: candidate?.interviewDate || "",
    metier: candidate?.metier || "",
    sessionId: candidate?.sessionId || "",
    notes: candidate?.notes || "",
  })

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

  // Fonction pour formater le nom en MAJUSCULES et le prénom avec première lettre en majuscule
  const formatName = (value: string) => {
    const parts = value.trim().split(' ')
    if (parts.length > 0) {
      // Le nom (premier mot) en majuscules
      const nom = parts[0].toUpperCase()
      // Les prénoms (les mots suivants) avec première lettre en majuscule
      const prenoms = parts.slice(1).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')
      return prenoms ? `${nom} ${prenoms}` : nom
    }
    return value
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validation : Date SMS et Date Entretien obligatoires
      if (!formData.smsSentDate) {
        throw new Error("La date d'envoi SMS est obligatoire")
      }
      if (!formData.interviewDate) {
        throw new Error("La date d'entretien est obligatoire")
      }

      const age = calculateAge(formData.birthDate)
      
      const apiData = {
        fullName: formatName(formData.fullName), // Formater le nom
        phone: formData.phone,
        birthDate: formData.birthDate,
        age: age,
        diploma: formData.diploma,
        niveauEtudes: formData.niveauEtudes,
        institution: formData.institution,
        email: formData.email || null, // Email peut être null
        location: formData.location,
        smsSentDate: formData.smsSentDate,
        availability: formData.availability,
        interviewDate: formData.interviewDate,
        metier: formData.metier,
        sessionId: formData.sessionId || null,
        notes: formData.notes || "",
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
                    placeholder="DUPONT Jean Marie"
                  />
                  <p className="text-xs text-gray-500">Le nom sera converti en MAJUSCULES et les prénoms auront une majuscule initiale</p>
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
                    placeholder="+225 07 XX XX XX XX"
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
                    <span>Email</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                    disabled={loading}
                    placeholder="john.doe@example.com (optionnel)"
                  />
                  <p className="text-xs text-gray-500">L'email n'est pas obligatoire</p>
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
                    placeholder="Abidjan, Cocody"
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
                  <Label htmlFor="niveauEtudes" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>Niveau d'Études <span className="text-red-500">*</span></span>
                  </Label>
                  <Select 
                    value={formData.niveauEtudes} 
                    onValueChange={(value) => handleChange("niveauEtudes", value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11">
                      <SelectValue placeholder="Sélectionner le niveau" />
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
                    placeholder="Licence en Informatique"
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
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
                    placeholder="Université Félix Houphouët-Boigny"
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
                  <Select 
                    value={formData.metier} 
                    onValueChange={(value) => handleChange("metier", value)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11">
                      <SelectValue placeholder="Sélectionner un métier" />
                    </SelectTrigger>
                    <SelectContent>
                      {metiers.map((metier) => (
                        <SelectItem key={metier.value} value={metier.value}>
                          {metier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectValue placeholder="Sélectionner la disponibilité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oui">Oui</SelectItem>
                      <SelectItem value="Non">Non</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.availability === "Non" && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ Attention : Si la disponibilité est "Non", le candidat sera automatiquement marqué comme "Non recruté"
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="smsSentDate" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Date Envoi SMS <span className="text-red-500">*</span></span>
                  </Label>
                  <Input
                    id="smsSentDate"
                    type="date"
                    value={formData.smsSentDate}
                    onChange={(e) => handleChange("smsSentDate", e.target.value)}
                    required
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="interviewDate" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Date Entretien <span className="text-red-500">*</span></span>
                  </Label>
                  <Input
                    id="interviewDate"
                    type="date"
                    value={formData.interviewDate}
                    onChange={(e) => handleChange("interviewDate", e.target.value)}
                    required
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors h-11"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Notes */}
              {/* <div className="space-y-3">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Notes (Optionnel)
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 transition-colors"
                  disabled={loading}
                  placeholder="Notes supplémentaires sur le candidat..."
                  rows={3}
                />
              </div> */}

              {/* Session de recrutement */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Session de Recrutement</span>
                </Label>
                <Select 
                  value={formData.sessionId} 
                  onValueChange={(value) => handleChange("sessionId", value)}
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
                <p className="text-xs text-gray-500 mt-1">
                  {sessions.length} session(s) disponible(s)
                </p>
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