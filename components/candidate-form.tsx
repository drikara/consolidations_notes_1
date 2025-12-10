"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Metier, Disponibilite, NiveauEtudes, Statut } from "@prisma/client"
import { useToast } from "@/hooks/use-toast"

export function CandidateForm({ sessions = [] }: { sessions?: any[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    // Nom et prénom séparés
    nom: "",
    prenom: "",
    
    // Coordonnées
    phone: "",
    birthDate: "",
    email: "", // Optionnel
    location: "",
    
    // Études
    diploma: "",
    niveauEtudes: NiveauEtudes.BAC_PLUS_2,
    institution: "",
    
    // Recrutement
    metier: Metier.CALL_CENTER,
    availability: Disponibilite.OUI,
    smsSentDate: "",
    interviewDate: "",
    
    // Statut de présence (NOUVEAU)
    statut: Statut.ABSENT,
    statutCommentaire: "",
    
    sessionId: "",
    notes: ""
  })

  const [age, setAge] = useState<number | null>(null)

  // Calculer l'âge automatiquement
  useEffect(() => {
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      let calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--
      }
      
      setAge(calculatedAge)
    }
  }, [formData.birthDate])

  // Formatage automatique des noms
  const handleNomChange = (value: string) => {
    setFormData(prev => ({ ...prev, nom: value.toUpperCase() }))
  }

  const handlePrenomChange = (value: string) => {
    const formatted = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    setFormData(prev => ({ ...prev, prenom: formatted }))
  }

  // Validation des champs obligatoires
  const validateForm = () => {
    const errors: string[] = []

    if (!formData.nom.trim()) errors.push("Le nom est obligatoire")
    if (!formData.prenom.trim()) errors.push("Le prénom est obligatoire")
    if (!formData.phone.trim()) errors.push("Le téléphone est obligatoire")
    if (!formData.birthDate) errors.push("La date de naissance est obligatoire")
    if (!formData.diploma.trim()) errors.push("Le diplôme est obligatoire")
    if (!formData.institution.trim()) errors.push("L'institution est obligatoire")
    if (!formData.location.trim()) errors.push("La localisation est obligatoire")
    
    // Dates obligatoires
    if (!formData.smsSentDate) errors.push("La date d'envoi SMS est obligatoire")
    if (!formData.interviewDate) errors.push("La date d'entretien est obligatoire")
    
    // Si absent, commentaire obligatoire
    if (formData.statut === Statut.ABSENT && !formData.statutCommentaire.trim()) {
      errors.push("Un commentaire est obligatoire pour justifier l'absence")
    }

    // Validation des dates
    if (formData.smsSentDate && formData.interviewDate) {
      const smsDate = new Date(formData.smsSentDate)
      const interviewDate = new Date(formData.interviewDate)
      
      if (interviewDate < smsDate) {
        errors.push("La date d'entretien ne peut pas être avant la date d'envoi SMS")
      }
    }

    if (age !== null && age < 18) {
      errors.push("Le candidat doit avoir au moins 18 ans")
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    const errors = validateForm()
    if (errors.length > 0) {
      setError(errors.join(". "))
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        age: age || 0,
        // Convertir les dates
        birthDate: new Date(formData.birthDate).toISOString(),
        smsSentDate: new Date(formData.smsSentDate).toISOString(),
        interviewDate: new Date(formData.interviewDate).toISOString(),
        // Session optionnelle
        sessionId: formData.sessionId || null,
        // Email optionnel
        email: formData.email || null
      }

      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la création")
      }

      toast({
        title: "Succès",
        description: "Candidat créé avec succès",
        variant: "default"
      })

      router.push("/wfm/candidates")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Options pour les selects
  const niveauEtudesOptions = [
    { value: NiveauEtudes.BAC_PLUS_2, label: "BAC+2" },
    { value: NiveauEtudes.BAC_PLUS_3, label: "BAC+3" },
    { value: NiveauEtudes.BAC_PLUS_4, label: "BAC+4" },
    { value: NiveauEtudes.BAC_PLUS_5, label: "BAC+5" }
  ]

  const disponibiliteOptions = [
    { value: Disponibilite.OUI, label: "OUI" },
    { value: Disponibilite.NON, label: "NON" }
  ]

  const metierOptions = [
    { value: Metier.CALL_CENTER, label: "Call Center" },
    { value: Metier.AGENCES, label: "Agences" },
    { value: Metier.BO_RECLAM, label: "BO Réclam" },
    { value: Metier.TELEVENTE, label: "Télévente" },
    { value: Metier.RESEAUX_SOCIAUX, label: "Réseaux Sociaux" },
    { value: Metier.SUPERVISION, label: "Supervision" },
    { value: Metier.BOT_COGNITIVE_TRAINER, label: "Bot Cognitive Trainer" },
    { value: Metier.SMC_FIXE, label: "SMC Fixe" },
    { value: Metier.SMC_MOBILE, label: "SMC Mobile" }
  ]

  const statutOptions = [
    { value: Statut.ABSENT, label: "ABSENT" },
    { value: Statut.PRESENT, label: "PRÉSENT" }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
          <CardTitle className="text-2xl font-bold text-blue-800">
            Nouveau Candidat
          </CardTitle>
          <p className="text-blue-600">
            Tous les champs marqués d'un * sont obligatoires
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section Informations Personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Informations Personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nom */}
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-gray-700 font-medium">
                    Nom *
                  </Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleNomChange(e.target.value)}
                    placeholder="Saisi en MAJUSCULES automatiquement"
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required
                  />
                  <p className="text-xs text-gray-500">Sera automatiquement mis en MAJUSCULES</p>
                </div>

                {/* Prénom */}
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-gray-700 font-medium">
                    Prénom *
                  </Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handlePrenomChange(e.target.value)}
                    placeholder="Première lettre en majuscule"
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required
                  />
                  <p className="text-xs text-gray-500">Première lettre automatiquement majuscule</p>
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">
                    Téléphone *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required
                  />
                </div>

                {/* Date de naissance */}
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-gray-700 font-medium">
                    Date de naissance *
                    {age !== null && (
                      <span className="ml-2 text-blue-600 font-bold">
                        ({age} ans)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange("birthDate", e.target.value)}
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required
                  />
                </div>

                {/* Email (optionnel) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email (optionnel)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@exemple.com"
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                  />
                  <p className="text-xs text-gray-500">Certains candidats n'ont pas d'email</p>
                </div>

                {/* Localisation */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-700 font-medium">
                    Localisation *
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="Ville, Région"
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section Études */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Formation et Études
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Diplôme */}
                <div className="space-y-2">
                  <Label htmlFor="diploma" className="text-gray-700 font-medium">
                    Diplôme obtenu *
                  </Label>
                  <Input
                    id="diploma"
                    value={formData.diploma}
                    onChange={(e) => handleChange("diploma", e.target.value)}
                    placeholder="Ex: Licence en Informatique"
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required
                  />
                </div>

                {/* Niveau d'études */}
                <div className="space-y-2">
                  <Label htmlFor="niveauEtudes" className="text-gray-700 font-medium">
                    Niveau d'études *
                  </Label>
                  <Select
                    value={formData.niveauEtudes}
                    onValueChange={(value) => handleChange("niveauEtudes", value)}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3">
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      {niveauEtudesOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Institution */}
                <div className="space-y-2">
                  <Label htmlFor="institution" className="text-gray-700 font-medium">
                    Institution *
                  </Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => handleChange("institution", e.target.value)}
                    placeholder="Ex: Université Paris-Saclay"
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section Recrutement */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Informations de Recrutement
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Métier */}
                <div className="space-y-2">
                  <Label htmlFor="metier" className="text-gray-700 font-medium">
                    Métier *
                  </Label>
                  <Select
                    value={formData.metier}
                    onValueChange={(value) => handleChange("metier", value)}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3">
                      <SelectValue placeholder="Sélectionner un métier" />
                    </SelectTrigger>
                    <SelectContent>
                      {metierOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Disponibilité */}
                <div className="space-y-2">
                  <Label htmlFor="availability" className="text-gray-700 font-medium">
                    Disponibilité *
                  </Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value) => handleChange("availability", value)}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3">
                      <SelectValue placeholder="OUI ou NON" />
                    </SelectTrigger>
                    <SelectContent>
                      {disponibiliteOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.availability === Disponibilite.NON && (
                    <p className="text-xs text-red-600 font-medium">
                      ⚠️ Le candidat sera automatiquement non recruté
                    </p>
                  )}
                </div>

                {/* Date SMS */}
                <div className="space-y-2">
                  <Label htmlFor="smsSentDate" className="text-gray-700 font-medium">
                    Date d'envoi SMS *
                  </Label>
                  <Input
                    id="smsSentDate"
                    type="date"
                    value={formData.smsSentDate}
                    onChange={(e) => handleChange("smsSentDate", e.target.value)}
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required
                  />
                </div>

                {/* Date entretien */}
                <div className="space-y-2">
                  <Label htmlFor="interviewDate" className="text-gray-700 font-medium">
                    Date d'entretien *
                  </Label>
                  <Input
                    id="interviewDate"
                    type="date"
                    value={formData.interviewDate}
                    onChange={(e) => handleChange("interviewDate", e.target.value)}
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required
                  />
                </div>
              </div>

              {/* Session optionnelle */}
              <div className="space-y-2">
                <Label htmlFor="sessionId" className="text-gray-700 font-medium">
                  Session de recrutement (optionnel)
                </Label>
                <Select
                  value={formData.sessionId}
                  onValueChange={(value) => handleChange("sessionId", value)}
                >
                  <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3">
                    <SelectValue placeholder="Sélectionner une session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune session</SelectItem>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.metier} - {new Date(session.date).toLocaleDateString('fr-FR')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section Statut */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Statut de Présence
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Statut */}
                <div className="space-y-2">
                  <Label htmlFor="statut" className="text-gray-700 font-medium">
                    Statut *
                  </Label>
                  <Select
                    value={formData.statut}
                    onValueChange={(value) => handleChange("statut", value)}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {statutOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Commentaire statut */}
                <div className="space-y-2">
                  <Label htmlFor="statutCommentaire" className="text-gray-700 font-medium">
                    Commentaire {formData.statut === Statut.ABSENT && "*"}
                  </Label>
                  <Input
                    id="statutCommentaire"
                    value={formData.statutCommentaire}
                    onChange={(e) => handleChange("statutCommentaire", e.target.value)}
                    placeholder={formData.statut === Statut.ABSENT ? 
                      "Justification obligatoire de l'absence" : 
                      "Commentaire optionnel pour présence"}
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required={formData.statut === Statut.ABSENT}
                  />
                  {formData.statut === Statut.ABSENT && (
                    <p className="text-xs text-red-600 font-medium">
                      Commentaire obligatoire pour justifier l'absence
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-700 font-medium">
                Notes additionnelles
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Remarques complémentaires..."
                rows={3}
                className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3 resize-none"
              />
            </div>

            {/* Messages d'erreur */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-6 py-3 font-semibold"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg rounded-xl px-6 py-3 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Création en cours...
                  </div>
                ) : (
                  "Créer le candidat"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}