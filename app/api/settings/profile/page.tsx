// app/settings/profile/page.tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard-header'
import { ChangePasswordForm } from '@/components/change-password-form'
import { ChangeEmailForm } from '@/components/change-email-form'
import { User, Shield } from 'lucide-react'

export default async function ProfileSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardHeader user={session.user} role={session.user.role} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Paramètres du profile</h1>
              <p className="text-sm text-gray-500">Gérez vos informations personnelles et votre sécurité</p>
            </div>
          </div>
        </div>

        {/* Informations du profil */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Informations du profile</h2>
              <p className="text-sm text-gray-500">Vos informations actuelles</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nom complet</label>
              <p className="text-base text-gray-900 font-medium">{session.user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-base text-gray-900 font-medium">{session.user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Rôle</label>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mt-1">
                <Shield className="w-4 h-4 mr-1" />
                {session.user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Sécurité */}
        <div className="space-y-6">
          <ChangeEmailForm currentEmail={session.user.email} />
          <ChangePasswordForm />
        </div>
      </main>
    </div>
  )
}