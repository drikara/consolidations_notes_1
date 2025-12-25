
//components/advanced-export-panel.tsx

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-hot-toast"

// Mapping entre les noms affichés et les valeurs Prisma Enum
const METIER_MAPPING: Record<string, string> = {
  "Call Center": "CALL_CENTER",
  "Agences": "AGENCES",
  "Bo Réclam": "BO_RECLAM",
  "Télévente": "TELEVENTE",
  "Réseaux Sociaux": "RESEAUX_SOCIAUX",
  "Supervision": "SUPERVISION",
  "Bot Cognitive Trainer": "BOT_COGNITIVE_TRAINER",
  "SMC Fixe": "SMC_FIXE",
  "SMC Mobile": "SMC_MOBILE",
}

export function AdvancedExportPanel() {
  const [year, setYear] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [selectedMetiers, setSelectedMetiers] = useState<string[]>([])
  const [status, setStatus] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)

  const metiers = [
    "Call Center",
    "Agences",
    "Bo Réclam",
    "Télévente",
    "Réseaux Sociaux",
    "Supervision",
    "Bot Cognitive Trainer",
    "SMC Fixe",
    "SMC Mobile",
  ]

  const currentYear = new Date().getFullYear()
  // Générer les années depuis 2025 jusqu'à l'année courante
  const startYear = 2025
  const yearsCount = currentYear - startYear + 1
  const years = Array.from({ length: yearsCount }, (_, i) => startYear + i).reverse()

  const statuses = [
    { value: "all", label: "Tous les statuts" },
    { value: "RECRUTE", label: "Recrutés" },
    { value: "NON_RECRUTE", label: "Non Recrutés" },
    { value: "EN_COURS", label: "En cours" },
  ]

  const toggleMetier = (metier: string) => {
    setSelectedMetiers(prev =>
      prev.includes(metier)
        ? prev.filter(m => m !== metier)
        : [...prev, metier]
    )
  }

  const selectAllMetiers = () => {
    setSelectedMetiers(metiers)
  }

  const deselectAllMetiers = () => {
    setSelectedMetiers([])
  }

  // Prévisualisation du nombre de candidats
  const fetchPreview = async () => {
    try {
      const params = new URLSearchParams()
      if (year !== "all") params.append("year", year)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      
      // Convertir les noms de métiers en valeurs enum
      if (selectedMetiers.length > 0) {
        const enumMetiers = selectedMetiers.map(m => METIER_MAPPING[m]).join(",")
        params.append("metiers", enumMetiers)
      }
      
      if (status !== "all") params.append("status", status)
      params.append("preview", "true")

      const response = await fetch(`/api/export/advanced?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPreviewCount(data.count)
      }
    } catch (error) {
      console.error("Erreur lors de la prévisualisation:", error)
    }
  }

  useEffect(() => {
    fetchPreview()
  }, [year, startDate, endDate, selectedMetiers, status])

  const handleExport = async () => {
    if (selectedMetiers.length === 0) {
      toast.error("⚠️ Veuillez sélectionner au moins un métier", { duration: 4000 })
      return
    }

    setIsLoading(true)
    const loadingToast = toast.loading('⏳ Préparation de l\'export...')
    
    try {
      const params = new URLSearchParams()
      if (year !== "all") params.append("year", year)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)
      
      // Convertir les noms de métiers en valeurs enum
      if (selectedMetiers.length > 0) {
        const enumMetiers = selectedMetiers.map(m => METIER_MAPPING[m]).join(",")
        params.append("metiers", enumMetiers)
      }
      
      if (status !== "all") params.append("status", status)

      const response = await fetch(`/api/export/advanced?${params.toString()}`)
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorMessage = "Erreur lors de l'export"
        
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } else if (contentType?.includes('text/')) {
          errorMessage = await response.text()
        }
        
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      
      if (blob.size === 0) {
        throw new Error("Le fichier généré est vide. Aucune donnée à exporter.")
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      
      // Nom du fichier selon les filtres
      let fileName = "export_candidats"
      if (year !== "all") fileName += `_${year}`
      if (selectedMetiers.length === 1) fileName += `_${selectedMetiers[0].replace(/\s+/g, '_')}`
      fileName += `_${new Date().toISOString().split('T')[0]}.xlsx`
      
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.dismiss(loadingToast)
      toast.success(`✅ Export réussi ! ${previewCount} candidat(s) exporté(s)`, { 
        duration: 4000,
        style: {
          background: '#D1FAE5',
          color: '#065F46',
          border: '2px solid #10B981',
          padding: '16px',
        }
      })
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
      toast.dismiss(loadingToast)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Une erreur inattendue s\'est produite lors de l\'export.'
      
      toast.error(`❌ ${errorMessage}`, { 
        duration: 6000,
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          border: '2px solid #DC2626',
          padding: '16px',
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-6">
      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Année */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Année</label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="border-2 border-gray-200 focus:border-orange-500 rounded-xl">
              <SelectValue placeholder="Sélectionner l'année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les années</SelectItem>
              {years.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date de début */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date de début</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-2 border-gray-200 focus:border-orange-500 rounded-xl"
          />
        </div>

        {/* Date de fin */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date de fin</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-2 border-gray-200 focus:border-orange-500 rounded-xl"
          />
        </div>

        {/* Statut */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Statut de décision</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="border-2 border-gray-200 focus:border-orange-500 rounded-xl">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sélection des métiers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Métiers ({selectedMetiers.length} sélectionné{selectedMetiers.length > 1 ? 's' : ''})
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAllMetiers}
              className="text-xs"
            >
              Tout sélectionner
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={deselectAllMetiers}
              className="text-xs"
            >
              Tout désélectionner
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {metiers.map(metier => (
            <div
              key={metier}
              className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-colors cursor-pointer"
              onClick={() => toggleMetier(metier)}
            >
              <Checkbox
                id={metier}
                checked={selectedMetiers.includes(metier)}
                onCheckedChange={() => toggleMetier(metier)}
              />
              <label
                htmlFor={metier}
                className="text-sm font-medium leading-none cursor-pointer flex-1"
              >
                {metier}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Prévisualisation */}
      {previewCount !== null && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {previewCount} candidat{previewCount > 1 ? 's' : ''} à exporter
              </p>
              <p className="text-sm text-gray-600">
                Selon les critères sélectionnés
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bouton d'export */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleExport}
          disabled={isLoading || selectedMetiers.length === 0 || previewCount === 0}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Export en cours...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter en Excel
            </>
          )}
        </Button>
      </div>
    </div>
  )
}