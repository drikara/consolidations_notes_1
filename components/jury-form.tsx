"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

type JuryFormProps = {
  juryMember?: any
  availableUsers: Array<{ id: string; name: string; email: string }>
}

export function JuryForm({ juryMember, availableUsers }: JuryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    user_id: juryMember?.user_id || "",
    full_name: juryMember?.full_name || "",
    role_type: juryMember?.role_type || "",
  })

  const roleTypes = ["DRH", "EPC", "Représentant du Métier", "WFM"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const url = juryMember ? `/api/jury/${juryMember.id}` : "/api/jury"
      const method = juryMember ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement")
      }

      router.push("/wfm/jury")
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
          <div className="space-y-2">
            <Label htmlFor="user_id" className="text-foreground">
              Utilisateur <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.user_id}
              onValueChange={(value) => handleChange("user_id", value)}
              required
              disabled={!!juryMember}
            >
              <SelectTrigger className="border-border focus:ring-primary">
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {juryMember && (
              <p className="text-xs text-muted-foreground">L'utilisateur ne peut pas être modifié après création</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-foreground">
              Nom Complet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              required
              placeholder="Ex: Dr. Jean Dupont"
              className="border-border focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role_type" className="text-foreground">
              Rôle dans le Jury <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.role_type} onValueChange={(value) => handleChange("role_type", value)} required>
              <SelectTrigger className="border-border focus:ring-primary">
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {roleTypes.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Présence obligatoire : Représentant du Métier et WFM</p>
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
              {loading ? "Enregistrement..." : juryMember ? "Mettre à Jour" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
