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
  const [isInitialized, setIsInitialized] = useState(false)

  // État initial – sera rempli par le useEffect
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    phone: "",
    birthDate: "",
    email: "",
    location: "",
    diploma: "",
    niveauEtudes: "BAC_PLUS_2" as NiveauEtudes,
    institution: "",
    metier: "CALL_CENTER" as Metier,
    availability: "OUI" as Disponibilite,
    statutRecruitment: "STAGE" as RecruitmentStatut,
    smsSentDate: "",
    interviewDate: "",
    signingDate: "",          
    sessionId: "none",
    notes: ""
  })

  const [age, setAge] = useState<number | null>(null)

  // Initialisation unique – utilise DIRECTEMENT les valeurs déjà formatées
  useEffect(() => {
    if (candidate && !isInitialized) {
      console.log("🚀 CandidateEditForm - Données reçues :", candidate)
      console.log("   → signingDate brute :", candidate.signingDate)
      console.log("   → sessionId :", candidate.sessionId)
      console.log("   → sessions disponibles :", sessions)

      setFormData({
        nom: candidate.nom || "",
        prenom: candidate.prenom || "",
        phone: candidate.phone || "",
        birthDate: candidate.birthDate || "",          
        email: candidate.email || "",
        location: candidate.location || "",
        diploma: candidate.diploma || "",
        niveauEtudes: candidate.niveauEtudes || "BAC_PLUS_2",
        institution: candidate.institution || "",
        metier: candidate.metier || "CALL_CENTER",
        availability: candidate.availability || "OUI",
        statutRecruitment: candidate.statutRecruitment || "STAGE",
        smsSentDate: candidate.smsSentDate || "",       
        interviewDate: candidate.interviewDate || "",   
        signingDate: candidate.signingDate || "",       
        sessionId: candidate.sessionId || "none",
        notes: candidate.notes || ""
      })

      if (candidate.age) setAge(candidate.age)
      setIsInitialized(true)
    }
  }, [candidate, isInitialized, sessions])

  // Recalcul de l'âge à chaque changement de date de naissance
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

  // Handlers
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Validation du formulaire
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

  // Soumission du formulaire
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
        signingDate: formData.signingDate ? new Date(formData.signingDate).toISOString() : null,
        sessionId: formData.sessionId === "none" ? null : formData.sessionId,
        email: formData.email || null,
        notes: formData.notes || null
      }

      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la mise à jour")
      }

      toast({
        title: "Succès",
        description: "Candidat mis à jour avec succès",
        variant: "default"
      })

      router.push("/wfm/candidates")
      router.refresh()
    } catch (err) {
      console.error("❌ Erreur lors de la soumission :", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
   
  }

  // Affichage du chargement
  if (!isInitialized) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement des données du candidat...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Options pour les selecteurs
  const niveauEtudesOptions = Object.values(NiveauEtudes).map(value => ({ value, label: value.replace(/_/g, ' ') }))
  const disponibiliteOptions = Object.values(Disponibilite).map(value => ({ value, label: value }))
  const metierOptions = Object.values(Metier).map(value => ({ value, label: value.replace(/_/g, ' ') }))
  const statutRecrutementOptions = Object.values(RecruitmentStatut).map(value => ({ value, label: value }))

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="border-2 border-blue-200 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
          <CardTitle className="text-2xl font-bold text-blue-800">
            Modifier le Candidat
          </CardTitle>
          <p className="text-blue-600">
            Tous les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires
          </p>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations Personnelles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Informations Personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
                  <Input id="nom" value={formData.nom} onChange={(e) => handleNomChange(e.target.value)} className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénoms <span className="text-red-500">*</span></Label>
                  <Input id="prenom" value={formData.prenom} onChange={(e) => handlePrenomChange(e.target.value)} className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone <span className="text-red-500">*</span></Label>
                  <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">
                    Date de naissance <span className="text-red-500">*</span>
                    {age !== null && <span className="ml-2 text-blue-600 font-bold">({age} ans)</span>}
                  </Label>
                  <Input id="birthDate" type="date" value={formData.birthDate} onChange={(e) => handleChange("birthDate", e.target.value)} className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lieu d'habitation <span className="text-red-500">*</span></Label>
                  <Input id="location" value={formData.location} onChange={(e) => handleChange("location", e.target.value)} className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3" required />
                </div>
              </div>
            </div>

            {/*  Formation et Études */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Formation et Études</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diploma">Diplôme obtenu <span className="text-red-500">*</span></Label>
                  <Input id="diploma" value={formData.diploma} onChange={(e) => handleChange("diploma", e.target.value)} className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="niveauEtudes">Niveau d'études <span className="text-red-500">*</span></Label>
                  <Select value={formData.niveauEtudes} onValueChange={(v) => handleChange("niveauEtudes", v)}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {niveauEtudesOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Université <span className="text-red-500">*</span></Label>
                  <Input id="institution" value={formData.institution} onChange={(e) => handleChange("institution", e.target.value)} className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3" required />
                </div>
              </div>
            </div>

            {/* Informations de Recrutement  */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Informations de Recrutement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metier">Métier <span className="text-red-500">*</span></Label>
                  <Select value={formData.metier} onValueChange={(v) => handleChange("metier", v)}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {metierOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Disponibilité <span className="text-red-500">*</span></Label>
                  <Select value={formData.availability} onValueChange={(v) => handleChange("availability", v)}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3">
                      <SelectValue placeholder="OUI/NON" />
                    </SelectTrigger>
                    <SelectContent>
                      {disponibiliteOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.availability === "NON" && (
                    <p className="text-xs text-red-600 font-medium mt-1">⚠️ Le candidat sera automatiquement non recruté</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statutRecruitment">Statut de recrutement <span className="text-red-500">*</span></Label>
                  <Select value={formData.statutRecruitment} onValueChange={(v) => handleChange("statutRecruitment", v)}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {statutRecrutementOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smsSentDate">Date d'envoi SMS <span className="text-red-500">*</span></Label>
                  <Input id="smsSentDate" type="date" value={formData.smsSentDate} onChange={(e) => handleChange("smsSentDate", e.target.value)} className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interviewDate">Date d'entretien <span className="text-red-500">*</span></Label>
                  <Input id="interviewDate" type="date" value={formData.interviewDate} onChange={(e) => handleChange("interviewDate", e.target.value)} className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3" required />
                </div>
                {/*  Date de signature du contrat */}
                <div className="space-y-2">
                  <Label htmlFor="signingDate">
                    Date de signature du contrat 
                  </Label>
                  <Input
                    id="signingDate"
                    type="date"
                    value={formData.signingDate}
                    onChange={(e) => handleChange("signingDate", e.target.value)}
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3"
                    
                  />
                </div>
              </div>

              {/*  Session de recrutement */}
              <div className="space-y-2">
                <Label htmlFor="sessionId">
                  Session de recrutement <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.sessionId} onValueChange={(v) => handleChange("sessionId", v)}>
                  <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-xl p-3 w-full">
                    <SelectValue placeholder="Sélectionner une session" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[500px] md:max-w-[600px]">
                    <SelectItem value="none">Aucune session</SelectItem>
                    {sessions.map((s) => {
                      const label = `${s.metier} - ${new Date(s.date).toLocaleDateString('fr-FR')} ${s.description ? `- ${s.description}` : ''}`
                      return (
                        <SelectItem key={s.id} value={s.id} title={label}>
                          <span className="block max-w-[350px] md:max-w-[450px] truncate">
                            {label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.sessionId === "none"
                    ? "Candidat non associé à une session"
                    : "Sélectionnez 'Aucune session' pour dissocier"}
                </p>
              </div>
            </div>

            {/* Erreur */}
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

            {/* Boutons d'action */}
            <div className="flex gap-4 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-6 py-3 font-semibold">
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg rounded-xl px-6 py-3 font-semibold">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mise à jour...
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