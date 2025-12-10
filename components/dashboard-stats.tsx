//components/dashboard-stats.tsx
'use client'

import { useState } from 'react'
import { Metier } from '@prisma/client'
import { 
  Users, 
  CheckCircle2, 
  Calendar, 
  UserCheck, 
  Clock,
  TrendingUp,
  BarChart3,
  Target,
  Award,
  Zap
} from 'lucide-react'

interface DashboardStatsProps {
  stats: {
    totalCandidates: number
    totalSessions: number
    activeSessions: number
    totalJuryMembers: number
    recruitedCount: number
    pendingEvaluations: number
    metierStats: Array<{
      metier: Metier
      count: number
      recruited: number
    }>
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month')

  // Calcul du taux de recrutement global
  const recruitmentRate = stats.totalCandidates > 0 
    ? (stats.recruitedCount / stats.totalCandidates) * 100 
    : 0

  // Formatage des métiers pour un affichage plus lisible
  const formatMetierName = (metier: Metier) => {
    return metier
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec filtre période */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Aperçu des Performances</h2>
          <p className="text-gray-600 mt-1">Statistiques globales du processus de recrutement</p>
        </div>
        
        <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
              selectedPeriod === 'week'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>7 jours</span>
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
              selectedPeriod === 'month'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>30 jours</span>
          </button>
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
              selectedPeriod === 'all'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Tout</span>
          </button>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Candidats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Candidats</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCandidates}</p>
              <p className="text-xs text-gray-500 mt-1">Toutes périodes confondues</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600 font-medium">+12% ce mois</span>
          </div>
        </div>

        {/* Candidats Recrutés */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Candidats Recrutés</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.recruitedCount}</p>
              <p className="text-xs text-gray-500 mt-1">Taux: {recruitmentRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
              style={{ width: `${recruitmentRate}%` }}
            ></div>
          </div>
        </div>

        {/* Sessions Actives */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sessions Actives</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeSessions}</p>
              <p className="text-xs text-gray-500 mt-1">Sur {stats.totalSessions} total</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-purple-600 font-medium">
              {((stats.activeSessions / stats.totalSessions) * 100).toFixed(0)}% d'activité
            </span>
          </div>
        </div>

        {/* Membres Jury */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Membres Jury</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalJuryMembers}</p>
              <p className="text-xs text-gray-500 mt-1">Évaluateurs actifs</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <Award className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-orange-600 font-medium">Équipe engagée</span>
          </div>
        </div>
      </div>

      {/* Deuxième ligne de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Évaluations en Attente */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Évaluations en Attente</h3>
              <p className="text-sm text-gray-600">À compléter par les jurys</p>
            </div>
          </div>
          
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-amber-600 mb-2">{stats.pendingEvaluations}</div>
            <p className="text-gray-600 mb-6">évaluations en attente</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">Phase 1 - Comportemental</span>
                  <span>65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-amber-500 h-3 rounded-full transition-all duration-1000" 
                    style={{ width: '65%' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">Phase 2 - Technique</span>
                  <span>35%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-1000" 
                    style={{ width: '35%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphique de performance simplifié */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance par Métier</h3>
              <p className="text-sm text-gray-600">Taux de recrutement</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {stats.metierStats.slice(0, 4).map((metierStat, index) => {
              const rate = metierStat.count > 0 ? (metierStat.recruited / metierStat.count) * 100 : 0
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500']
              
              return (
                <div key={metierStat.metier} className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {formatMetierName(metierStat.metier)}
                      </span>
                      <span className="text-gray-600">{rate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${colors[index]}`}
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{metierStat.recruited} recrutés</span>
                      <span>sur {metierStat.count}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Statistiques détaillées par métier */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Répartition par Métier</h3>
            <p className="text-sm text-gray-600">Détail complet des candidatures</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.metierStats.map((metierStat, index) => {
            const rate = metierStat.count > 0 ? (metierStat.recruited / metierStat.count) * 100 : 0
            const colorClasses = [
              'bg-blue-50 border-blue-200',
              'bg-green-50 border-green-200', 
              'bg-purple-50 border-purple-200',
              'bg-orange-50 border-orange-200',
              'bg-red-50 border-red-200',
              'bg-cyan-50 border-cyan-200'
            ]
            
            return (
              <div 
                key={metierStat.metier} 
                className={`border rounded-xl p-4 hover:shadow-md transition-all duration-200 ${colorClasses[index % colorClasses.length]}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {formatMetierName(metierStat.metier)}
                  </h4>
                  <span className="bg-white text-gray-700 text-xs px-2 py-1 rounded-full font-medium border">
                    {metierStat.count}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recrutés:</span>
                    <span className="font-semibold text-emerald-600">{metierStat.recruited}</span>
                  </div>
                  
                  <div className="w-full bg-white rounded-full h-2 border">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${rate}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Taux de réussite</span>
                    <span className="font-medium text-orange-600">{rate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}