'use client'

import { useState, useMemo } from 'react'
import { Metier, SessionStatus } from '@prisma/client'
import { toast } from 'react-hot-toast'

// ========================================
// UTILITAIRE DE GESTION D'ERREURS
// ========================================
class ApiErrorHandler {
  static getErrorMessage(status: number, defaultMessage?: string): string {
    const errorMessages: Record<number, string> = {
      400: "❌ Les données envoyées sont invalides. Veuillez vérifier votre saisie.",
      401: "🔒 Vous n'êtes pas connecté. Veuillez vous reconnecter.",
      403: "⛔ Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
      404: "🔍 Aucune donnée trouvée avec les critères sélectionnés.",
      409: "⚠️ Un conflit s'est produit. Cette donnée existe déjà.",
      422: "❌ Les données fournies ne sont pas valides.",
      429: "⏳ Trop de requêtes. Veuillez patienter quelques instants.",
      500: "🔧 Une erreur serveur s'est produite. Nos équipes ont été notifiées.",
      502: "🌐 Le serveur est temporairement indisponible. Veuillez réessayer.",
      503: "⚙️ Le service est en maintenance. Veuillez réessayer dans quelques minutes.",
      504: "⏱️ Le serveur met trop de temps à répondre. Veuillez réessayer."
    }

    return errorMessages[status] || defaultMessage || "❌ Une erreur inattendue s'est produite."
  }

  static async handleResponse(response: Response): Promise<{ ok: boolean; data?: any; error?: string }> {
    if (response.ok) {
      return { ok: true }
    }

    let errorMessage: string

    try {
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        const errorData = await response.json()
        errorMessage = this.getErrorMessage(response.status, errorData?.error || errorData?.message)
      } else if (contentType?.includes('text/')) {
        const textError = await response.text()
        errorMessage = this.getErrorMessage(response.status, textError)
      } else {
        errorMessage = this.getErrorMessage(response.status)
      }
    } catch (e) {
      errorMessage = this.getErrorMessage(response.status)
    }

    return { ok: false, error: errorMessage }
  }
}

// ========================================
// INTERFACES
// ========================================
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
type SelectedMetier = Metier | 'all'

export function ExportPanel({ sessions, metiers }: ExportPanelProps) {
  
  const [exportType, setExportType] = useState<ExportType>('session')
  const [loading, setLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState('')
  const [selectedMetier, setSelectedMetier] = useState<SelectedMetier>('all')
  const [selectedStatus, setSelectedStatus] = useState<SessionStatus | 'all'>('all')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' })

  // ========================================
  // SESSIONS FILTRÉES
  // ========================================
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (selectedStatus !== 'all' && session.status !== selectedStatus) return false
      if (selectedMetier !== 'all' && session.metier !== selectedMetier) return false
      return true
    })
  }, [sessions, selectedStatus, selectedMetier])

  // ========================================
  // FONCTION D'EXPORT PRINCIPALE
  // ========================================
  const handleExport = async () => {
    setLoading(true)
    const loadingToast = toast.loading('⏳ Préparation de l\'export...')
    
    try {
      const params = new URLSearchParams()

      // Déterminer l'URL de l'API en fonction du type d'export
      let apiUrl = '/api/export/excel'

      // ========================================
      // VALIDATION DES CHAMPS REQUIS
      // ========================================
      if (exportType === 'excel') {
        // Pour l'export Excel consolidé ou par session
        if (selectedSession) {
          params.append('sessionId', selectedSession)
        } else {
          // Export consolidé avec filtres
          if (selectedStatus !== 'all') {
            params.append('status', selectedStatus)
          }
          if (selectedMetier !== 'all') {
            params.append('metier', selectedMetier)
          }
          if (selectedMonth) {
            params.append('month', selectedMonth)
          }
        }
      } else if (exportType === 'session') {
        // Export CSV par session
        if (!selectedSession) {
          toast.dismiss(loadingToast)
          toast.error('⚠️ Veuillez sélectionner une session', { duration: 4000 })
          return
        }
        params.append('sessionId', selectedSession)
        apiUrl = '/api/export' // Utiliser l'API CSV pour l'export par session
      }

      const url = `${apiUrl}?${params.toString()}`
      console.log('🌐 URL export:', url)

      // ========================================
      // APPEL API AVEC GESTION D'ERREURS
      // ========================================
      const response = await fetch(url)
      
      // Gérer les erreurs HTTP
      const result = await ApiErrorHandler.handleResponse(response)
      
      if (!result.ok) {
        toast.dismiss(loadingToast)
        toast.error(result.error || 'Une erreur est survenue', { 
          duration: 6000,
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            border: '2px solid #DC2626',
            padding: '16px',
            fontSize: '14px'
          }
        })
        return
      }

      // ========================================
      // TÉLÉCHARGEMENT DU FICHIER
      // ========================================
      const blob = await response.blob()
      
      // Vérifier que le blob n'est pas vide
      if (blob.size === 0) {
        toast.dismiss(loadingToast)
        toast.error('❌ Le fichier généré est vide. Aucune donnée à exporter.', { duration: 5000 })
        return
      }

      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      
      // Récupérer le nom de fichier depuis les headers
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = exportType === 'excel' ? 'export_consolide.xlsx' : 'export.csv'
      
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

      toast.dismiss(loadingToast)
      toast.success('✅ Export terminé avec succès !', { 
        duration: 4000,
        style: {
          background: '#D1FAE5',
          color: '#065F46',
          border: '2px solid #10B981',
          padding: '16px',
          fontSize: '14px'
        }
      })

    } catch (error) {
      console.error('❌ Export error:', error)
      toast.dismiss(loadingToast)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : '❌ Une erreur inattendue s\'est produite lors de l\'export.'
      
      toast.error(errorMessage, { 
        duration: 6000,
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          border: '2px solid #DC2626',
          padding: '16px',
          fontSize: '14px'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 shadow-lg space-y-6">
      {/* Sélection du type d'export */}
      <div>
        <h3 className="text-xl font-bold text-orange-800 mb-4">Type d'Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[
            { value: 'session' as ExportType, label: 'Par Session', desc: 'Export CSV par session' },
            { value: 'excel' as ExportType, label: 'Excel Consolidé', desc: 'Export Excel avec filtres' },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setExportType(type.value)
                // Réinitialiser les sélections si on change de type
                if (type.value === 'excel') {
                  setSelectedSession('')
                }
              }}
              className={`p-4 border-2 rounded-xl text-left transition-all cursor-pointer duration-200 ${
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
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="PLANIFIED">Planifié</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="COMPLETED">Terminé</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>

        {/* Sélection du métier */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Filtrer par Métier</label>
          <select
            value={selectedMetier}
            onChange={(e) => setSelectedMetier(e.target.value as SelectedMetier)}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors cursor-pointer"
          >
            <option value="all">Tous les métiers</option>
            {metiers.map(metier => (
              <option key={metier.metier} value={metier.metier}>
                {metier.metier} ({metier._count.id} candidats)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sélecteur de session */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700">
          Sélectionner la session
          {selectedSession && (
            <span className="ml-2 text-xs text-green-600 font-normal">
              (Exporte uniquement les candidats recrutés)
            </span>
          )}
        </label>
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors cursor-pointer"
        >
          <option value="">Choisir une session...</option>
          {filteredSessions.map(session => {
            const sessionDate = new Date(session.date)
            const formattedDate = sessionDate.toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })
            return (
              <option key={session.id} value={session.id}>
                {session.metier} - {formattedDate} ({session.candidatCount} candidats) - {session.status}
              </option>
            )
          })}
        </select>
        {selectedSession && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ Cette session contient {filteredSessions.find(s => s.id === selectedSession)?.candidatCount || 0} candidats.
              L'export inclura uniquement les candidats marqués comme <strong>RECRUTÉS</strong>.
            </p>
          </div>
        )}
      </div>

      {/* Bouton d'export */}
      <div className="flex justify-end pt-4 border-t border-orange-200">
        <button
          onClick={handleExport}
          disabled={loading || !selectedSession}
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
              {exportType === 'excel' ? 'Exporter la Session en Excel' : 'Exporter la Session en CSV'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}