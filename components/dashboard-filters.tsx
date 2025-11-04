// components/dashboard-filters.tsx
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardFiltersProps {
  years: number[]
  selectedYear?: string
  selectedMonth?: string
  selectedMetier?: string
}

// Utilisez les valeurs EXACTES de votre enum Metier avec les labels en français
const metiers = [
  { value: "CALL_CENTER", label: "Call Center" },
  { value: "AGENCES", label: "Agences" },
  { value: "BO_RECLAM", label: "Bo Réclam" },
  { value: "TELEVENTE", label: "Télévente" },
  { value: "RESEAUX_SOCIAUX", label: "Réseaux Sociaux" },
  { value: "SUPERVISION", label: "Supervision" },
  { value: "BOT_COGNITIVE_TRAINER", label: "Bot Cognitive Trainer" },
  { value: "SMC_FIXE", label: "SMC Fixe" },
  { value: "SMC_MOBILE", label: "SMC Mobile" }
]

const months = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" }
]

export function DashboardFilters({ years, selectedYear, selectedMonth, selectedMetier }: DashboardFiltersProps) {
  const router = useRouter()

  const updateFilters = (updates: { year?: string; month?: string; metier?: string }) => {
    const params = new URLSearchParams()
    
    const newYear = updates.year !== undefined ? updates.year : selectedYear
    const newMonth = updates.month !== undefined ? updates.month : selectedMonth
    const newMetier = updates.metier !== undefined ? updates.metier : selectedMetier

    if (newYear && newYear !== "current") params.set('year', newYear)
    if (newMonth && newMonth !== "all") params.set('month', newMonth)
    if (newMetier && newMetier !== "all") params.set('metier', newMetier)

    router.push(`/wfm/dashboard?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/wfm/dashboard')
  }

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filtres</h3>
        <Button variant="outline" onClick={clearFilters} className="cursor-pointer">
          Réinitialiser
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Année</label>
          <Select 
            value={selectedYear || new Date().getFullYear().toString()} 
            onValueChange={(value) => updateFilters({ year: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner l'année"  />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()} className="cursor-pointer">
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Mois</label>
          <Select 
            value={selectedMonth || "all"} 
            onValueChange={(value) => updateFilters({ month: value === "all" ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les mois" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mois</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value} className="cursor-pointer">
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Périmètres</label>
          <Select 
            value={selectedMetier || "all"} 
            onValueChange={(value) => updateFilters({ metier: value === "all" ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les périmètres"  />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les périmètres</SelectItem>
              {metiers.map((metier) => (
                <SelectItem key={metier.value} value={metier.value} className="cursor-pointer">
                  {metier.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button 
            onClick={clearFilters}
            variant="outline" 
            className="w-full cursor-pointer"
          >
            Effacer les filtres
          </Button>
        </div>
      </div>
    </div>
  )
}