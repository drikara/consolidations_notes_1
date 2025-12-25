// app/wfm/audit/page.tsx

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard-header'
import AuditLogViewer from '@/components/AuditLogViewer'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: 'Historique des Actions | WFM',
  description: 'Suivi et audit des actions administratives',
}

export default async function AuditPage() {
  // Vérifier l'authentification
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  // Vérifier que l'utilisateur est WFM
  if (session.user.role !== 'WFM') {
    redirect('/jury/dashboard')
  }

  // Récupérer le juryRoleType si l'utilisateur a un profil jury
  const juryMember = await prisma.juryMember.findUnique({
    where: { userId: session.user.id },
    select: { roleType: true }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role
        }}
        role={session.user.role}
        juryRoleType={juryMember?.roleType}
      />
      
      <AuditLogViewer />
    </div>
  )
}