'use client'

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Metier, Disponibilite, NiveauEtudes, RecruitmentStatut } from "@prisma/client"
import { useToast } from "@/hooks/use-toast"

export function CandidateEditForm({ candidate, sessions = [] }: { candidate: any; sessions?: any[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // ⭐ CORRECTION 1 : Gérer correctement le sessionId (peut être null ou undefined)
  const [formData, setFormData] = useState({
    nom: candidate?.nom || "",
    prenom: candidate?.prenom || "",
    phone: candidate?.phone || "",
    birthDate: candidate?.birthDate ? new Date(candidate.birthDate).toISOString().split('T')[0] : "",
    email: candidate?.email || "",
    location: candidate?.location || "",
    diploma: candidate?.diploma || "",
    niveauEtudes: candidate?.niveauEtudes || "BAC_PLUS_2" as NiveauEtudes,
    institution: candidate?.institution || "",
    metier: candidate?.metier || "CALL_CENTER" as Metier,
    availability: candidate?.availability || "OUI" as Disponibilite,
    statutRecruitment: candidate?.statutRecruitment || "STAGE" as RecruitmentStatut,
    smsSentDate: candidate?.smsSentDate ? new Date(candidate.smsSentDate).toISOString().split('T')[0] : "",
    interviewDate: candidate?.interviewDate ? new Date(candidate.interviewDate).toISOString().split('T')[0] : "",
    // ⭐ CORRECTION : sessionId peut être null, donc on utilise "none" s'il est null/undefined
    sessionId: candidate?.sessionId ? candidate.sessionId : "none",
    notes: candidate?.notes || ""
  })

  const [age, setAge] = useState<number | null>(candidate?.age || null)

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

  // ⭐ AJOUT : Afficher les données dans la console pour déboguer
  useEffect(() => {
    console.log("📋 Données du formulaire:", formData)
    console.log("📋 Données du candidat original:", candidate)
  }, [formData, candidate])

  const handleNomChange = (value: string) => {
    setFormData(prev => ({ ...prev, nom: value.toUpperCase() }))
  }

  const handlePrenomChange = (value: string) => {
    if (!value) {
      setFormData(prev => ({ ...prev, prenom: "" }))
      return
    }
    const formatted = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    setFormData(prev => ({ ...prev, prenom: formatted }))
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!formData.nom.trim()) errors.push("Le nom est obligatoire")
    if (!formData.prenom.trim()) errors.push("Le prénom est obligatoire")
    if (!formData.phone.trim()) errors.push("Le téléphone est obligatoire")
    if (!formData.birthDate) errors.push("La date de naissance est obligatoire")
    if (!formData.diploma.trim()) errors.push("Le diplôme est obligatoire")
    if (!formData.institution.trim()) errors.push("L'institution est obligatoire")
    if (!formData.location.trim()) errors.push("La localisation est obligatoire")
    if (!formData.smsSentDate) errors.push("La date d'envoi SMS est obligatoire")
    if (!formData.interviewDate) errors.push("La date d'entretien est obligatoire")
    if (!formData.availability) errors.push("La disponibilité est obligatoire")
    if (!formData.metier) errors.push("Le métier est obligatoire")
    if (!formData.niveauEtudes) errors.push("Le niveau d'études est obligatoire")
    if (!formData.statutRecruitment) errors.push("Le statut de recrutement est obligatoire")

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
      // ⭐ CORRECTION 2 : Préparer le payload avec les données correctes
      const payload = {
        nom: formData.nom,
        prenom: formData.prenom,
        phone: formData.phone,
        age: age || 0,
        diploma: formData.diploma,
        niveauEtudes: formData.niveauEtudes,
        institution: formData.institution,
        location: formData.location,
        metier: formData.metier,
        availability: formData.availability,
        statutRecruitment: formData.statutRecruitment,
        birthDate: new Date(formData.birthDate).toISOString(),
        smsSentDate: new Date(formData.smsSentDate).toISOString(),
        interviewDate: new Date(formData.interviewDate).toISOString(),
        // ⭐ CORRECTION : envoyer null si "none", sinon l'UUID de la session
        sessionId: formData.sessionId === "none" ? null : formData.sessionId,
        email: formData.email || null,
        notes: formData.notes || null
      }

      console.log("📤 Payload envoyé à l'API:", payload)

      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error("❌ Erreur API:", data)
        throw new Error(data.error || "Erreur lors de la mise à jour")
      }

      const updatedCandidate = await response.json()
      console.log("✅ Réponse API:", updatedCandidate)

      toast({
        title: "Succès",
        description: "Candidat mis à jour avec succès",
        variant: "default"
      })

      router.push("/wfm/candidates")
      router.refresh()
    } catch (err) {
      console.error("❌ Erreur complète:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    console.log(`📝 Changement ${field}: ${value}`)
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const niveauEtudesOptions = [
    { value: "BAC_PLUS_2", label: "BAC+2" },
    { value: "BAC_PLUS_3", label: "BAC+3" },
    { value: "BAC_PLUS_4", label: "BAC+4" },
    { value: "BAC_PLUS_5", label: "BAC+5" }
  ]

  const disponibiliteOptions = [
    { value: "OUI", label: "OUI" },
    { value: "NON", label: "NON" }
  ]

  const metierOptions = [
    { value: "CALL_CENTER", label: "Call Center" },
    { value: "AGENCES", label: "Agences" },
    { value: "BO_RECLAM", label: "BO Réclam" },
    { value: "TELEVENTE", label: "Télévente" },
    { value: "RESEAUX_SOCIAUX", label: "Réseaux Sociaux" },
    { value: "SUPERVISION", label: "Supervision" },
    { value: "BOT_COGNITIVE_TRAINER", label: "Bot Cognitive Trainer" },
    { value: "SMC_FIXE", label: "SMC Fixe" },
    { value: "SMC_MOBILE", label: "SMC Mobile" }
  ]

  const statutRecrutementOptions = [
    { value: "STAGE", label: "Stage" },
    { value: "INTERIM", label: "Intérim" },
    { value: "CDI", label: "CDI" },
    { value: "CDD", label: "CDD" },
    { value: "AUTRE", label: "Autre" }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
          <CardTitle className="text-2xl font-bold text-blue-800">
            Modifier le Candidat
          </CardTitle>
          <p className="text-blue-600">
            Tous les champs marqués d'un * sont obligatoires
          </p>
          {/* ⭐ AJOUT : Affichage de l'ID du candidat pour débogage */}
          <p className="text-sm text-gray-500 mt-1">
            ID du candidat: {candidate?.id}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-gray-700 font-medium">
                    Prénoms *
                  </Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handlePrenomChange(e.target.value)}
                    placeholder="Première lettre en majuscule"
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">
                    Téléphone *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="0707070707"
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    required
                  />
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email 
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@exemple.com"
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-700 font-medium">
                    Lieu d'habitation *
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="Orange village"
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
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution" className="text-gray-700 font-medium">
                    Université *
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
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availability" className="text-gray-700 font-medium">
                    Disponibilité pour l'entretien *
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
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.availability === "NON" && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      ⚠️ Le candidat sera automatiquement non recruté
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statutRecruitment" className="text-gray-700 font-medium">
                    Statut de recrutement *
                  </Label>
                  <Select
                    value={formData.statutRecruitment}
                    onValueChange={(value) => handleChange("statutRecruitment", value)}
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {statutRecrutementOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

              {/* CORRECTION : Section Session de recrutement avec meilleure gestion */}
              <div className="space-y-2">
                <Label htmlFor="sessionId" className="text-gray-700 font-medium">
                  Session de recrutement 
                  {formData.sessionId !== "none" && (
                    <span className="ml-2 text-sm text-blue-600">
                      (Actuellement sélectionnée)
                    </span>
                  )}
                </Label>
                <Select
                  value={formData.sessionId}
                  onValueChange={(value) => {
                    console.log("Session sélectionnée:", value)
                    handleChange("sessionId", value)
                  }}
                >
                  <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3">
                    <SelectValue placeholder="Sélectionner une session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune session</SelectItem>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.metier} - {new Date(session.date).toLocaleDateString('fr-FR')}
                        {session.description && ` - ${session.description}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.sessionId === "none" 
                    ? "Le candidat n'est associé à aucune session" 
                    : "Sélectionnez 'Aucune session' pour dissocier"}
                </p>
              </div>
            </div>

          

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
                    Mise à jour en cours...
                  </div>
                ) : (
                  "Mettre à jour le candidat"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}