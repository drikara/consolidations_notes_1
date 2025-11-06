"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Metier } from "@prisma/client"

type JuryFormProps = {
  juryMember?: any
  availableUsers: Array<{ id: string; name: string; email: string }>
}

export function JuryForm({ juryMember, availableUsers }: JuryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    user_id: juryMember?.userId || "",
    full_name: juryMember?.fullName || "",
    role_type: juryMember?.roleType || "",
    specialite: juryMember?.specialite || "",
    department: juryMember?.department || "",
    phone: juryMember?.phone || "",
    notes: juryMember?.notes || "",
  })

  const roleTypes = [
    { value: "DRH", label: "DRH" },
    { value: "EPC", label: "EPC" },
    { value: "REPRESENTANT_METIER", label: "Représentant du Métier" },
    { value: "WFM_JURY", label: "WFM Jury" }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("🔄 Envoi des données vers /api/jury:", formData)
      
      const url = juryMember ? `/api/jury/${juryMember.id}` : "/api/jury"
      const method = juryMember ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'enregistrement")
      }

      console.log("✅ Succès:", result)
      router.push("/wfm/jury")
      router.refresh()

    } catch (err: any) {
      console.error("❌ Erreur:", err)
      setError(err.message || "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="bg-linear-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              {juryMember ? "Modifier le membre" : "Nouveau membre du jury"}
            </h1>
            <p className="text-orange-700">
              {juryMember ? "Modifiez les informations du membre" : "Ajoutez un nouveau membre au jury"}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <Card className="border-2 border-orange-100 shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Utilisateur */}
            <div className="space-y-3">
              <Label htmlFor="user_id" className="text-gray-700 font-semibold text-sm">
                Utilisateur <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) => handleChange("user_id", value)}
                required
                disabled={!!juryMember}
              >
                <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl h-12 bg-white">
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {juryMember && (
                <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  L'utilisateur ne peut pas être modifié après création
                </p>
              )}
            </div>

            {/* Nom complet */}
            <div className="space-y-3">
              <Label htmlFor="full_name" className="text-gray-700 font-semibold text-sm">
                Nom Complet <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                required
                placeholder="Ex: Dr. Jean Dupont"
                className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl h-12 bg-white"
              />
            </div>

            {/* Rôle */}
            <div className="space-y-3">
              <Label htmlFor="role_type" className="text-gray-700 font-semibold text-sm">
                Rôle dans le Jury <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.role_type} 
                onValueChange={(value) => handleChange("role_type", value)} 
                required
              >
                <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl h-12 bg-white">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roleTypes.map((role) => (
                    <SelectItem key={role.value} value={role.value} className="rounded-lg">
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                Rôles disponibles: DRH, EPC, Représentant du Métier, WFM Jury
              </p>
            </div>

            {/* Spécialité */}
            <div className="space-y-3">
              <Label htmlFor="specialite" className="text-gray-700 font-semibold text-sm">
                Spécialité (métier)
              </Label>
              <Select 
                value={formData.specialite} 
                onValueChange={(value) => handleChange("specialite", value)}
              >
                <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl h-12 bg-white">
                  <SelectValue placeholder="Sélectionner une spécialité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune spécialité</SelectItem>
                  {Object.values(Metier).map((metier) => (
                    <SelectItem key={metier} value={metier} className="rounded-lg">
                      {metier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Département */}
            <div className="space-y-3">
              <Label htmlFor="department" className="text-gray-700 font-semibold text-sm">
                Département
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleChange("department", e.target.value)}
                placeholder="Ex: RH, Commercial, Technique..."
                className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl h-12 bg-white"
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-gray-700 font-semibold text-sm">
                Téléphone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+33 1 23 45 67 89"
                className="border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl h-12 bg-white"
              />
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-gray-700 font-semibold text-sm">
                Notes
              </Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors resize-none"
                placeholder="Informations supplémentaires..."
              />
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">Erreur</p>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-end pt-6 border-t border-orange-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 rounded-xl px-6 h-12 font-semibold transition-all duration-200"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg hover:shadow-xl rounded-xl px-8 h-12 font-semibold transition-all duration-200 disabled:opacity-50" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </div>
                ) : juryMember ? (
                  "Mettre à Jour"
                ) : (
                  "Enregistrer le Membre"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}