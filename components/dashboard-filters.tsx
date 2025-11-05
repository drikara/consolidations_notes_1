"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Filter, 
  Calendar, 
  Users, 
  RotateCcw,
  ChevronDown,
  X
} from "lucide-react"

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

  const hasActiveFilters = selectedYear || selectedMonth || selectedMetier

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* En-tête avec gradient orange */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Filtres du Dashboard</h3>
              <p className="text-orange-100 text-sm">Filtrez les données par période et périmètre</p>
            </div>
          </div>
          
          {hasActiveFilters && (
            <Button 
              onClick={clearFilters}
              variant="ghost"
              className="text-white hover:bg-white/20 hover:text-white border border-white/30"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filtre Année */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span>Année</span>
            </label>
            <Select 
              value={selectedYear || new Date().getFullYear().toString()} 
              onValueChange={(value) => updateFilters({ year: value })}
            >
              <SelectTrigger className="h-11 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 hover:border-orange-300 transition-colors">
                <SelectValue placeholder="Sélectionner l'année" />
                
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                {years.map((year) => (
                  <SelectItem 
                    key={year} 
                    value={year.toString()} 
                    className="cursor-pointer text-gray-900 focus:bg-orange-50 focus:text-orange-900 transition-colors"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre Mois */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span>Mois</span>
            </label>
            <Select 
              value={selectedMonth || "all"} 
              onValueChange={(value) => updateFilters({ month: value === "all" ? undefined : value })}
            >
              <SelectTrigger className="h-11 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 hover:border-orange-300 transition-colors">
                <SelectValue placeholder="Tous les mois" />
               
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                <SelectItem 
                  value="all" 
                  className="cursor-pointer text-gray-900 focus:bg-orange-50 focus:text-orange-900 transition-colors"
                >
                  Tous les mois
                </SelectItem>
                {months.map((month) => (
                  <SelectItem 
                    key={month.value} 
                    value={month.value} 
                    className="cursor-pointer text-gray-900 focus:bg-orange-50 focus:text-orange-900 transition-colors"
                  >
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtre Périmètres */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-orange-600" />
              <span>Périmètres</span>
            </label>
            <Select 
              value={selectedMetier || "all"} 
              onValueChange={(value) => updateFilters({ metier: value === "all" ? undefined : value })}
            >
              <SelectTrigger className="h-11 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 hover:border-orange-300 transition-colors">
                <SelectValue placeholder="Tous les périmètres" />
               
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg max-h-60">
                <SelectItem 
                  value="all" 
                  className="cursor-pointer text-gray-900 focus:bg-orange-50 focus:text-orange-900 transition-colors"
                >
                  Tous les périmètres
                </SelectItem>
                {metiers.map((metier) => (
                  <SelectItem 
                    key={metier.value} 
                    value={metier.value} 
                    className="cursor-pointer text-gray-900 focus:bg-orange-50 focus:text-orange-900 transition-colors"
                  >
                    {metier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bouton d'action */}
          <div className="flex items-end">
            <Button 
              onClick={clearFilters}
              variant="outline" 
              className="w-full h-11 border-red-300 bg-orange-500 text-white hover:bg-orange-50 hover:text-gray-900 hover:border-gray-400 transition-colors font-medium cursor-pointer"
            >
              <X className="w-4 h-4 mr-2 " />
              Effacer tout
            </Button>
          </div>
        </div>

        {/* Indicateur de filtres actifs */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filtres actifs :</span>
              <div className="flex flex-wrap gap-2">
                {selectedYear && (
                  <span className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                    <Calendar className="w-3 h-3" />
                    <span>Année: {selectedYear}</span>
                  </span>
                )}
                {selectedMonth && selectedMonth !== "all" && (
                  <span className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                    <Calendar className="w-3 h-3" />
                    <span>Mois: {months.find(m => m.value === selectedMonth)?.label}</span>
                  </span>
                )}
                {selectedMetier && selectedMetier !== "all" && (
                  <span className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                    <Users className="w-3 h-3" />
                    <span>Périmètre: {metiers.find(m => m.value === selectedMetier)?.label}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}