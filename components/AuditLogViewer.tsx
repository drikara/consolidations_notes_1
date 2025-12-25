// components/AuditLogViewer.tsx 

'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Download, Clock, User, Activity } from 'lucide-react'

const AuditLogViewer = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    startDate: '',
    endDate: '',
    search: '',
    page: 1,
    limit: 50
  })

  // Actions et entités disponibles
  const actions = [
    { value: 'CREATE', label: 'Création', color: 'bg-green-100 text-green-800' },
    { value: 'READ', label: 'Lecture', color: 'bg-gray-100 text-gray-800' },
    { value: 'UPDATE', label: 'Modification', color: 'bg-blue-100 text-blue-800' },
    { value: 'DELETE', label: 'Suppression', color: 'bg-red-100 text-red-800' },
    { value: 'EXPORT', label: 'Export', color: 'bg-purple-100 text-purple-800' },
    { value: 'LOGIN', label: 'Connexion', color: 'bg-green-100 text-green-800' },
    { value: 'LOGOUT', label: 'Déconnexion', color: 'bg-gray-100 text-gray-800' },
    { value: 'ASSIGN', label: 'Attribution', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'UNASSIGN', label: 'Retrait', color: 'bg-orange-100 text-orange-800' },
    { value: 'APPROVE', label: 'Approbation', color: 'bg-teal-100 text-teal-800' },
    { value: 'REJECT', label: 'Rejet', color: 'bg-red-100 text-red-800' }
  ]

  const entities = [
    { value: 'SESSION', label: 'Session' },
    { value: 'CANDIDATE', label: 'Candidat' },
    { value: 'JURY_MEMBER', label: 'Membre Jury' },
    { value: 'SCORE', label: 'Score' },
    { value: 'USER', label: 'Utilisateur' },
    { value: 'USER_ROLE', label: 'Rôle Utilisateur' },
    { value: 'USER_EMAIL', label: 'Email Utilisateur' },
    { value: 'USER_PASSWORD', label: 'Mot de passe' },
    { value: 'PRESENCE', label: 'Présence' },
    { value: 'EXPORT', label: 'Export' }
  ]

  useEffect(() => {
    loadLogs()
    loadStats()
  }, [filters.action, filters.entity, filters.startDate, filters.endDate, filters.page])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: filters.limit.toString(),
        offset: ((filters.page - 1) * filters.limit).toString(),
      })

      if (filters.action) params.append('action', filters.action)
      if (filters.entity) params.append('entity', filters.entity)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      console.log('🔍 Fetching logs with params:', params.toString())
      
      const response = await fetch(`/api/admin/audit-logs?${params}`)
      const data = await response.json()

      console.log('📦 Response:', data)

      if (data.success) {
        setLogs(data.data || [])
      } else {
        console.error('❌ Error from API:', data.error)
        setLogs([])
      }
    } catch (error) {
      console.error('❌ Erreur chargement logs:', error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/audit-stats?period=week')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error)
    }
  }

  const getActionBadge = (action: string) => {
    const actionConfig = actions.find(a => a.value === action)
    return actionConfig || { label: action, color: 'bg-gray-100 text-gray-800' }
  }

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(date))
  }

  const exportLogs = () => {
    if (logs.length === 0) {
      alert('Aucun log à exporter')
      return
    }

    const csv = [
      ['Date', 'Utilisateur', 'Email', 'Action', 'Entité', 'Description', 'IP'].join(','),
      ...logs.map(log => [
        formatDate(log.createdAt),
        log.userName,
        log.userEmail,
        log.action,
        log.entity,
        `"${log.description}"`,
        log.ipAddress
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Historique des Actions
          </h1>
          <p className="text-gray-600">
            Suivi complet de toutes les actions effectuées dans le système
          </p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Total Actions</div>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalActions}</div>
              <div className="text-xs text-gray-500 mt-1">Cette semaine</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Créations</div>
                <div className="w-5 h-5 rounded bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">+</div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.actionStats.CREATE || 0}</div>
              <div className="text-xs text-green-600 mt-1">↑ Sessions, candidats</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Modifications</div>
                <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">✎</div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.actionStats.UPDATE || 0}</div>
              <div className="text-xs text-blue-600 mt-1">Mises à jour</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Exports</div>
                <Download className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.actionStats.EXPORT || 0}</div>
              <div className="text-xs text-purple-600 mt-1">Fichiers générés</div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({...filters, action: e.target.value, page: 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Toutes</option>
                {actions.map(action => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entité
              </label>
              <select
                value={filters.entity}
                onChange={(e) => setFilters({...filters, entity: e.target.value, page: 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Toutes</option>
                {entities.map(entity => (
                  <option key={entity.value} value={entity.value}>
                    {entity.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value, page: 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value, page: 1})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setFilters({
                action: '',
                entity: '',
                startDate: '',
                endDate: '',
                search: '',
                page: 1,
                limit: 50
              })}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Réinitialiser
            </button>
            <button
              onClick={exportLogs}
              disabled={logs.length === 0}
              className="ml-auto px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* Liste des logs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col justify-center items-center gap-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
                        <p className="text-sm text-gray-500">Chargement des logs...</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Activity className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">Aucune action trouvée</p>
                        <p className="text-sm text-gray-400">Essayez de modifier les filtres</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const actionBadge = getActionBadge(log.action)
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {log.userName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.userEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${actionBadge.color}`}>
                            {actionBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entities.find(e => e.value === log.entity)?.label || log.entity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                          {log.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {log.ipAddress}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-700">
                Page <span className="font-medium">{filters.page}</span>
                {logs.length === filters.limit && <span className="text-gray-500 ml-1">(il y a peut-être plus de résultats)</span>}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilters({...filters, page: Math.max(1, filters.page - 1)})}
                  disabled={filters.page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Précédent
                </button>
                <button 
                  onClick={() => setFilters({...filters, page: filters.page + 1})}
                  disabled={logs.length < filters.limit}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuditLogViewer