// components/results-table.tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type Result = {
  id: number
  full_name: string
  metier: string
  email: string
  phone: string
  final_decision?: string
  typing_speed?: number
  typing_accuracy?: number
  excel_test?: number
  dictation?: number
}

export function ResultsTable({ results }: { results: Result[] }) {
  const [search, setSearch] = useState("")
  const [metierFilter, setMetierFilter] = useState("all")
  const [decisionFilter, setDecisionFilter] = useState("all")
  const [exporting, setExporting] = useState(false)

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

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.full_name.toLowerCase().includes(search.toLowerCase()) ||
      result.email.toLowerCase().includes(search.toLowerCase())
    const matchesMetier = metierFilter === "all" || result.metier === metierFilter
    const matchesDecision = decisionFilter === "all" || result.final_decision === decisionFilter
    return matchesSearch && matchesMetier && matchesDecision
  })

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const response = await fetch("/api/export/excel")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `consolidation_notes_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("Erreur lors de l'export")
      }
    } catch (error) {
      alert("Erreur lors de l'export")
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async (candidateId: number, candidateName: string) => {
    try {
      const response = await fetch(`/api/export/pdf/${candidateId}`)
      if (response.ok) {
        const html = await response.text()
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          printWindow.document.write(html)
          printWindow.document.close()
          setTimeout(() => {
            printWindow.print()
          }, 500)
        }
      } else {
        alert("Erreur lors de la génération du PDF")
      }
    } catch (error) {
      alert("Erreur lors de la génération du PDF")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border-2 border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl"
        />
        <Select value={metierFilter} onValueChange={setMetierFilter}>
          <SelectTrigger className="w-full sm:w-48 border-2 border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl">
            <SelectValue placeholder="Métier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les métiers</SelectItem>
            {metiers.map((metier) => (
              <SelectItem key={metier} value={metier}>
                {metier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={decisionFilter} onValueChange={setDecisionFilter}>
          <SelectTrigger className="w-full sm:w-48 border-2 border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl">
            <SelectValue placeholder="Décision" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les décisions</SelectItem>
            <SelectItem value="RECRUTE">Recruté</SelectItem>
            <SelectItem value="NON_RECRUTE">Non Recruté</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleExportExcel}
          disabled={exporting}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 border-2 border-orange-500"
        >
          {exporting ? "Export..." : "Exporter Excel"}
        </Button>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider">
                  Candidat
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider">
                  Métier
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider">
                  Décision
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucun résultat trouvé
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-orange-25 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{result.full_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-2 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg">
                        {result.metier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800">{result.email}</p>
                      <p className="text-sm text-gray-600">{result.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      {result.final_decision ? (
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            result.final_decision === "RECRUTE"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {result.final_decision}
                        </span>
                      ) : (
                        <span className="px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                          En cours
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/wfm/scores/${result.id}`}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-2 border-gray-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 rounded-lg transition-all duration-200"
                        >
                          Détails
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 border-gray-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 rounded-lg transition-all duration-200"
                        onClick={() => handleExportPDF(result.id, result.full_name)}
                      >
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-orange-25 p-6 rounded-xl border-2 border-orange-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-2">Total Candidats</p>
            <p className="text-3xl font-bold text-gray-800">{filteredResults.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Recrutés</p>
            <p className="text-3xl font-bold text-green-600">
              {filteredResults.filter((r) => r.final_decision === "RECRUTE").length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Non Recrutés</p>
            <p className="text-3xl font-bold text-red-600">
              {filteredResults.filter((r) => r.final_decision === "NON_RECRUTE").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}