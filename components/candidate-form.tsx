"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

type CandidateFormProps = {
  candidate?: any
}

export function CandidateForm({ candidate }: CandidateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    full_name: candidate?.full_name || "",
    phone: candidate?.phone || "",
    birth_date: candidate?.birth_date || "",
    diploma: candidate?.diploma || "",
    institution: candidate?.institution || "",
    email: candidate?.email || "",
    location: candidate?.location || "",
    sms_sent_date: candidate?.sms_sent_date || "",
    availability: candidate?.availability || "",
    interview_date: candidate?.interview_date || "",
    metier: candidate?.metier || "",
  })

  const metiers = [
    "Call Center",
    "Agences",
    "Bo Réclam",
    "Télévente",
    "Réseaux Sociaux",
    "Supervision",
    "Bot Cognitive Trainer",
    "SMC Fixe & Mobile",
  ]

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
      const age = calculateAge(formData.birth_date)
      const url = candidate ? `/api/candidates/${candidate.id}` : "/api/candidates"
      const method = candidate ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, age }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement")
      }

      router.push("/wfm/candidates")
      router.refresh()
    } catch (err) {
      setError("Une erreur est survenue")
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="border-2 border-border">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-foreground">
                Nom et Prénom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                required
                className="border-border focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">
                Numéro de Téléphone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
                className="border-border focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date" className="text-foreground">
                Date de Naissance <span className="text-destructive">*</span>
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange("birth_date", e.target.value)}
                required
                className="border-border focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                className="border-border focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diploma" className="text-foreground">
                Diplôme <span className="text-destructive">*</span>
              </Label>
              <Input
                id="diploma"
                value={formData.diploma}
                onChange={(e) => handleChange("diploma", e.target.value)}
                required
                className="border-border focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution" className="text-foreground">
                Établissement Fréquenté <span className="text-destructive">*</span>
              </Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => handleChange("institution", e.target.value)}
                required
                className="border-border focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-foreground">
                Lieu d'Habitation <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                required
                className="border-border focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metier" className="text-foreground">
                Métier <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.metier} onValueChange={(value) => handleChange("metier", value)} required>
                <SelectTrigger className="border-border focus:ring-primary">
                  <SelectValue placeholder="Sélectionner un métier" />
                </SelectTrigger>
                <SelectContent>
                  {metiers.map((metier) => (
                    <SelectItem key={metier} value={metier}>
                      {metier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability" className="text-foreground">
                Disponibilité <span className="text-destructive">*</span>
              </Label>
              <Input
                id="availability"
                value={formData.availability}
                onChange={(e) => handleChange("availability", e.target.value)}
                required
                placeholder="Ex: Immédiate, Dans 2 semaines..."
                className="border-border focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sms_sent_date" className="text-foreground">
                Date Envoi SMS
              </Label>
              <Input
                id="sms_sent_date"
                type="date"
                value={formData.sms_sent_date}
                onChange={(e) => handleChange("sms_sent_date", e.target.value)}
                className="border-border focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interview_date" className="text-foreground">
                Date Présence Entretien
              </Label>
              <Input
                id="interview_date"
                type="date"
                value={formData.interview_date}
                onChange={(e) => handleChange("interview_date", e.target.value)}
                className="border-border focus:ring-primary"
              />
            </div>
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-border hover:bg-muted"
            >
              Annuler
            </Button>
            <Button type="submit" className="bg-primary hover:bg-accent text-primary-foreground" disabled={loading}>
              {loading ? "Enregistrement..." : candidate ? "Mettre à Jour" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
