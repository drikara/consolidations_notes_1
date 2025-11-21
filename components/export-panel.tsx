'use client'

import { useState, useMemo } from 'react'
import { Metier, SessionStatus } from '@prisma/client'
import { toast } from '@/lib/toast'
import { toast as hotToast } from 'react-hot-toast'

// Interfaces
interface Session {
  id: string
  metier: string
  jour: string
  date: string
  location?: string
  status: SessionStatus
  candidatCount: number
}

interface MetierWithCount {
  metier: Metier
  _count: {
    id: number
  }
}

interface ExportPanelProps {
  sessions: Session[]
  metiers: MetierWithCount[]
}

interface DateRange {
  start: string
  end: string
}

type ExportType = 'session' | 'metier' | 'month' | 'period' | 'all' | 'excel'

// Type pour le métier sélectionné qui peut être "all"
type SelectedMetier = Metier | 'all'

export function ExportPanel({ sessions, metiers }: ExportPanelProps) {
  // États
  const [exportType, setExportType] = useState<ExportType>('session')
  const [loading, setLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState('')
  const [selectedMetier, setSelectedMetier] = useState<SelectedMetier>('all')
  const [selectedStatus, setSelectedStatus] = useState<SessionStatus | 'all'>('all')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' })

  // Sessions filtrées
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (selectedStatus !== 'all' && session.status !== selectedStatus) return false
      return true
    })
  }, [sessions, selectedStatus])

  // Mois disponibles
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(
      sessions.map(session => {
        const date = new Date(session.date)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      })
    )).sort().reverse()
    
    return months
  }, [sessions])

  // Fonction d'export multiple
  const handleMultipleSessionsExport = async () => {
    setLoading(true)
    const loadingToast = toast.loading('Export multiple en cours...')
    
    try {
      const params = new URLSearchParams()
      
      // Ajouter les IDs des sessions sélectionnées
      filteredSessions.forEach(session => {
        params.append('sessionIds', session.id)
      })
      
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      const url = `/api/export/multiple?${params.toString()}`
      console.log('🌐 URL export multiple:', url)

      const response = await fetch(url)
      
      if (response.status === 404) {
        const message = await response.text()
        hotToast.dismiss(loadingToast)
        toast.error(message || 'Aucune donnée trouvée avec les critères sélectionnés')
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(errorData.error || 'Erreur lors de l\'export multiple')
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = 'sessions-export.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      hotToast.dismiss(loadingToast)
      toast.success(`Export multiple de ${filteredSessions.length} sessions terminé!`)

    } catch (error) {
      console.error('❌ Export multiple error:', error)
      hotToast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'export multiple')
    } finally {
      setLoading(false)
    }
  }

  // Fonction d'export principal
  const handleExport = async () => {
    setLoading(true)
    const loadingToast = toast.loading('Export en cours...')
    
    try {
      const params = new URLSearchParams()

      // Déterminer l'URL de l'API en fonction du type d'export
      let apiUrl = '/api/export'
      if (exportType === 'excel') {
        apiUrl = '/api/export/excel'
      }

      switch (exportType) {
        case 'session':
          if (!selectedSession) {
            hotToast.dismiss(loadingToast)
            toast.error('Veuillez sélectionner une session')
            return
          }
          params.append('sessionId', selectedSession)
          break
        
        case 'metier':
          if (selectedMetier === 'all') {
            hotToast.dismiss(loadingToast)
            toast.error('Veuillez sélectionner un métier')
            return
          }
          params.append('metier', selectedMetier)
          if (selectedStatus !== 'all') {
            params.append('status', selectedStatus)
          }
          break
        
        case 'month':
          if (!selectedMonth) {
            hotToast.dismiss(loadingToast)
            toast.error('Veuillez sélectionner un mois')
            return
          }
          params.append('month', selectedMonth)
          if (selectedStatus !== 'all') {
            params.append('status', selectedStatus)
          }
          break
        
        case 'period':
          if (!dateRange.start && !dateRange.end) {
            hotToast.dismiss(loadingToast)
            toast.error('Veuillez sélectionner au moins une date')
            return
          }
          if (dateRange.start) params.append('dateFrom', dateRange.start)
          if (dateRange.end) params.append('dateTo', dateRange.end)
          if (selectedStatus !== 'all') {
            params.append('status', selectedStatus)
          }
          break
        
        case 'all':
          if (selectedStatus !== 'all') {
            params.append('status', selectedStatus)
          }
          break
        
        case 'excel':
          // Pour l'export Excel consolidé, on utilise les mêmes paramètres
          if (selectedStatus !== 'all') {
            params.append('status', selectedStatus)
          }
          if (selectedMetier !== 'all') {
            params.append('metier', selectedMetier)
          }
          if (dateRange.start) params.append('dateFrom', dateRange.start)
          if (dateRange.end) params.append('dateTo', dateRange.end)
          if (selectedMonth) params.append('month', selectedMonth)
          break
      }

      const url = `${apiUrl}?${params.toString()}`
      console.log('🌐 URL export:', url)

      const response = await fetch(url)
      
      if (response.status === 404) {
        const message = await response.text()
        hotToast.dismiss(loadingToast)
        toast.error(message || 'Aucune donnée trouvée avec les critères sélectionnés')
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(errorData.error || 'Erreur lors de l\'export')
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      
      // Récupérer le nom de fichier depuis les headers
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = exportType === 'excel' ? 'export_consolide.csv' : 'export.csv'
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      hotToast.dismiss(loadingToast)
      toast.success('Export terminé avec succès!')

    } catch (error) {
      console.error('❌ Export error:', error)
      hotToast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'export')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 shadow-lg space-y-6">
      {/* Sélection du type d'export */}
      <div>
        <h3 className="text-xl font-bold text-orange-800 mb-4">Type d'Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[
            { value: 'session' as ExportType, label: 'Par Session', desc: 'Une session spécifique' },
            { value: 'metier' as ExportType, label: 'Par Métier', desc: 'Tous les candidats d\'un métier' },
            { value: 'month' as ExportType, label: 'Par Mois', desc: 'Toutes les sessions d\'un mois' },
            { value: 'period' as ExportType, label: 'Par Période', desc: 'Date de début et fin' },
            { value: 'all' as ExportType, label: 'Complet', desc: 'Toutes les données' },
            { value: 'excel' as ExportType, label: 'Excel Consolidé', desc: 'Avec colonnes par métier' },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setExportType(type.value)}
              className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                exportType === type.value
                  ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg'
                  : 'border-orange-200 bg-white hover:border-orange-300 hover:shadow-md'
              }`}
            >
              <div className="font-bold text-orange-700 text-sm">{type.label}</div>
              <div className="text-xs text-orange-600 mt-1">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Filtre statut session */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Statut des Sessions</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as SessionStatus | 'all')}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
          >
            <option value="all">Tous les statuts</option>
            <option value="PLANIFIED">Planifié</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="COMPLETED">Terminé</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>

        {/* Sélection du métier pour l'export Excel consolidé */}
        {exportType === 'excel' && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Filtrer par Métier (optionnel)</label>
            <select
              value={selectedMetier}
              onChange={(e) => setSelectedMetier(e.target.value as SelectedMetier)}
              className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
            >
              <option value="all">Tous les métiers</option>
              {metiers.map(metier => (
                <option key={metier.metier} value={metier.metier}>
                  {metier.metier} ({metier._count.id} candidats)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Options spécifiques selon le type d'export */}
      {exportType === 'session' && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Sélectionner une Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors cursor-pointer"
          >
            <option value="">Choisir une session...</option>
            {filteredSessions.map(session => (
              <option key={session.id} value={session.id}>
                {session.metier} - {session.jour} - {new Date(session.date).toLocaleDateString('fr-FR')} 
                {session.location && ` - ${session.location}`} - {session.status} ({session.candidatCount} candidats)
              </option>
            ))}
          </select>
        </div>
      )}

      {exportType === 'metier' && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Sélectionner un Métier</label>
          <select
            value={selectedMetier}
            onChange={(e) => setSelectedMetier(e.target.value as SelectedMetier)}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors cursor-pointer"
          >
            <option value="all">Choisir un métier...</option>
            {metiers.map(metier => (
              <option key={metier.metier} value={metier.metier}>
                {metier.metier} ({metier._count.id} candidats)
              </option>
            ))}
          </select>
        </div>
      )}

      {(exportType === 'month' || exportType === 'excel') && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Sélectionner un Mois</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors cursor-pointer"
          >
            <option value="">Choisir un mois (optionnel)...</option>
            {availableMonths.map(month => {
              const [year, monthNum] = month.split('-')
              const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
              return (
                <option key={month} value={month}>
                  {monthName}
                </option>
              )
            })}
          </select>
        </div>
      )}

      {(exportType === 'period' || exportType === 'excel') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Date de début (optionnel)</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Date de fin (optionnel)</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Information sur l'export Excel consolidé */}
      {/* {exportType === 'excel' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Export Excel Consolidé
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  • Inclut <strong>toutes les colonnes spécifiques à chaque métier</strong><br/>
                  • Colonnes vides pour les tests non applicables au métier<br/>
                  • Parfait pour l'analyse et les audits détaillés
                </p>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Boutons d'export */}
      <div className="flex justify-between pt-4 border-t border-orange-200">
        {/* <button
          onClick={handleMultipleSessionsExport}
          disabled={loading || filteredSessions.length === 0}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Exporter {filteredSessions.length} sessions (ZIP)
        </button> */}

        <button
          onClick={handleExport}
          disabled={loading || 
            (exportType === 'session' && !selectedSession) ||
            (exportType === 'month' && !selectedMonth) ||
            (exportType === 'period' && !dateRange.start && !dateRange.end)
          }
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Export en cours...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exportType === 'excel' ? 'Exporter Excel Consolidé' : 'Exporter les données'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}