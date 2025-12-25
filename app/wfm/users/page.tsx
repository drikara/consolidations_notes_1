import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardHeader } from '@/components/dashboard-header'
import { AdminUsersManagement } from '@/components/admin-users-management'
import { Settings, Users as UsersIcon, Shield } from 'lucide-react'

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== 'WFM') {
    redirect('/unauthorized')
  }

  // Récupérer tous les utilisateurs avec leurs informations ET juryMember
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      juryMember: {
        select: {
          roleType: true,
          isActive: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Statistiques
  const stats = {
    total: users.length,
    wfm: users.filter(u => u.role === 'WFM').length,
    jury: users.filter(u => u.role === 'JURY').length,
    wfmJury: users.filter(u => u.role === 'WFM' && u.juryMember?.roleType === 'WFM_JURY').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardHeader 
        user={{
          name: session.user?.name || 'Utilisateur',
          email: session.user?.email || '',
          role: session.user?.role
        }} 
        role={session.user.role} 
      />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
              <p className="text-sm text-gray-500">Gérez les comptes, rôles et accès des utilisateurs</p>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Administrateurs WFM</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.wfm}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Membres du Jury</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.jury}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">WFM + JURY</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.wfmJury}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Composant de gestion */}
        <AdminUsersManagement 
          users={users} 
          currentUserId={session.user.id}
        />
      </main>
    </div>
  )
}