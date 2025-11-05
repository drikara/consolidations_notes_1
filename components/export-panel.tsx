// components/export-panel.tsx
'use client'

import { useState } from 'react'
import { Metier } from '@prisma/client'

interface Session {
  id: string
  metier: Metier
  date: Date
  jour: string
  status: string
}

interface MetierStats {
  metier: Metier
  _count: {
    id: number
  }
}

interface ExportPanelProps {
  sessions: Session[]
  metiers: MetierStats[]
}

export function ExportPanel({ sessions, metiers }: ExportPanelProps) {
  const [exportType, setExportType] = useState<'session' | 'multiple' | 'global'>('session')
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [selectedMetier, setSelectedMetier] = useState<Metier | 'all'>('all')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSessionToggle = (sessionId: string) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      let url = '/api/export/'
      
      switch (exportType) {
        case 'session':
          if (selectedSessions.length !== 1) {
            alert('Veuillez sélectionner une seule session')
            return
          }
          url += `session/${selectedSessions[0]}`
          break
        
        case 'multiple':
          if (selectedSessions.length === 0) {
            alert('Veuillez sélectionner au moins une session')
            return
          }
          url += `sessions?sessionIds=${selectedSessions.join(',')}`
          break
        
        case 'global':
          const params = new URLSearchParams()
          if (selectedMetier !== 'all') params.append('metier', selectedMetier)
          if (dateRange.start) params.append('dateFrom', dateRange.start)
          if (dateRange.end) params.append('dateTo', dateRange.end)
          url += `global?${params.toString()}`
          break
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Erreur lors de l\'export')
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      
      let filename = 'export'
      if (exportType === 'session' && selectedSessions.length === 1) {
        const session = sessions.find(s => s.id === selectedSessions[0])
        if (session) {
          filename = `${session.metier}_Session_${session.jour}_${session.date.toISOString().split('T')[0]}`
        }
      } else if (exportType === 'global') {
        filename = `export_global_${new Date().toISOString().split('T')[0]}`
      } else {
        filename = `export_multiple_${new Date().toISOString().split('T')[0]}`
      }
      
      a.download = `${filename}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

    } catch (error) {
      console.error('Export error:', error)
      alert('Erreur lors de l\'export')
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (selectedMetier !== 'all' && session.metier !== selectedMetier) return false
    if (dateRange.start && new Date(session.date) < new Date(dateRange.start)) return false
    if (dateRange.end && new Date(session.date) > new Date(dateRange.end)) return false
    return true
  })

  return (
    <div className="bg-white rounded-2xl border-2 border-orange-100 p-6 shadow-lg space-y-6">
      {/* Sélection du type d'export */}
      <div>
        <h3 className="text-xl font-bold text-orange-800 mb-4">Type d'Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setExportType('session')}
            className={`p-6 border-2 rounded-2xl text-left transition-all duration-200 ${
              exportType === 'session'
                ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg'
                : 'border-orange-200 bg-white hover:border-orange-300 hover:shadow-md'
            }`}
          >
            <div className="font-bold text-orange-700">Session Unique</div>
            <div className="text-sm text-orange-600 mt-2">
              Fichier Excel pour une session spécifique
            </div>
          </button>

          <button
            onClick={() => setExportType('multiple')}
            className={`p-6 border-2 rounded-2xl text-left transition-all duration-200 ${
              exportType === 'multiple'
                ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg'
                : 'border-orange-200 bg-white hover:border-orange-300 hover:shadow-md'
            }`}
          >
            <div className="font-bold text-orange-700">Sessions Multiples</div>
            <div className="text-sm text-orange-600 mt-2">
              ZIP avec fichiers Excel par session
            </div>
          </button>

          <button
            onClick={() => setExportType('global')}
            className={`p-6 border-2 rounded-2xl text-left transition-all duration-200 ${
              exportType === 'global'
                ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg'
                : 'border-orange-200 bg-white hover:border-orange-300 hover:shadow-md'
            }`}
          >
            <div className="font-bold text-orange-700">Export Global</div>
            <div className="text-sm text-orange-600 mt-2">
              Toutes les données sur une période
            </div>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtre par métier */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Métier</label>
          <select
            value={selectedMetier}
            onChange={(e) => setSelectedMetier(e.target.value as Metier | 'all')}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
          >
            <option value="all">Tous les métiers</option>
            {metiers.map(metier => (
              <option key={metier.metier} value={metier.metier}>
                {metier.metier} ({metier._count.id})
              </option>
            ))}
          </select>
        </div>

        {/* Filtre date de début */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Date de début</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
          />
        </div>

        {/* Filtre date de fin */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Date de fin</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="w-full p-3 border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl bg-white transition-colors"
          />
        </div>
      </div>

      {/* Sélection des sessions */}
      {(exportType === 'session' || exportType === 'multiple') && (
        <div>
          <h4 className="font-bold text-orange-800 mb-3">
            Sélectionnez les sessions {exportType === 'session' ? '(1 seule)' : '(une ou plusieurs)'}
          </h4>
          <div className="max-h-60 overflow-y-auto border-2 border-orange-200 rounded-2xl">
            {filteredSessions.length === 0 ? (
              <div className="p-6 text-center text-orange-500">
                Aucune session correspondante
              </div>
            ) : (
              filteredSessions.map(session => (
                <label
                  key={session.id}
                  className="flex items-center p-4 border-b-2 border-orange-100 last:border-b-0 hover:bg-orange-50/50 transition-colors"
                >
                  <input
                    type={exportType === 'session' ? 'radio' : 'checkbox'}
                    name="sessions"
                    checked={selectedSessions.includes(session.id)}
                    onChange={() => {
                      if (exportType === 'session') {
                        setSelectedSessions([session.id])
                      } else {
                        handleSessionToggle(session.id)
                      }
                    }}
                    className="mr-3 h-4 w-4 text-orange-600 focus:ring-orange-500 border-orange-300"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{session.metier}</div>
                    <div className="text-sm text-orange-600">
                      {session.jour} - {new Date(session.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 ${
                    session.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    session.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                    'bg-blue-100 text-blue-700 border-blue-200'
                  }`}>
                    {session.status}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bouton d'export */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={loading || (exportType === 'session' && selectedSessions.length !== 1) || (exportType === 'multiple' && selectedSessions.length === 0)}
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
              Exporter {exportType === 'global' ? 'les données' : `(${selectedSessions.length}) sessions`}
            </>
          )}
        </button>
      </div>
    </div>
  )
}