"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type JuryScoreFormProps = {
  candidate: any
  juryMember: any
  existingScores: any[]
}

export function JuryScoreForm({ candidate, juryMember, existingScores }: JuryScoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const phase1Score = existingScores.find((s) => s.phase === 1)
  const phase2Score = existingScores.find((s) => s.phase === 2)

  const [formData, setFormData] = useState({
    phase1_score: phase1Score?.score?.toString() || "",
    phase2_score: phase2Score?.score?.toString() || "",
  })

  const handleSubmit = async (e: React.FormEvent, phase: 1 | 2) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const score = phase === 1 ? formData.phase1_score : formData.phase2_score

      if (!score || Number(score) < 0 || Number(score) > 5) {
        setError("La note doit être entre 0 et 5")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/jury/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidate.id,
          jury_member_id: juryMember.id,
          phase,
          score: Number(score),
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement")
      }

      router.refresh()
      alert(`Note Phase ${phase} enregistrée avec succès`)
    } catch (err) {
      setError("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Informations du Candidat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{candidate.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <p className="font-medium text-foreground">{candidate.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Diplôme</p>
              <p className="font-medium text-foreground">{candidate.diploma}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disponibilité</p>
              <p className="font-medium text-foreground">{candidate.availability}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 1 Evaluation */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Phase 1 - Entretien Initial</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, 1)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phase1_score" className="text-foreground">
                Note Face à Face (/5) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phase1_score"
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={formData.phase1_score}
                onChange={(e) => setFormData((prev) => ({ ...prev, phase1_score: e.target.value }))}
                required
                className="border-border focus:ring-primary"
                placeholder="Ex: 4.5"
              />
              <p className="text-xs text-muted-foreground">
                Évaluez la qualité de la communication et la présentation du candidat
              </p>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-accent text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : phase1Score ? "Mettre à Jour Phase 1" : "Enregistrer Phase 1"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Phase 2 Evaluation */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Phase 2 - Épreuves Techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, 2)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phase2_score" className="text-foreground">
                Note Face à Face (/5) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phase2_score"
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={formData.phase2_score}
                onChange={(e) => setFormData((prev) => ({ ...prev, phase2_score: e.target.value }))}
                required
                className="border-border focus:ring-primary"
                placeholder="Ex: 3.5"
              />
              <p className="text-xs text-muted-foreground">
                Évaluez la performance globale après les épreuves techniques
              </p>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-accent text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : phase2Score ? "Mettre à Jour Phase 2" : "Enregistrer Phase 2"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.back()} className="border-border hover:bg-muted">
          Retour à la Liste
        </Button>
      </div>
    </div>
  )
}
