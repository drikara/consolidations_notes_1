// components/protected-layout.tsx
import { ReactNode } from 'react'
import { RoleProvider } from '@/contexts/role-context'
import { getCurrentSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

interface ProtectedLayoutProps {
  children: ReactNode
}

export async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await getCurrentSession()
  
  let userRole = 'JURY'
  let juryRoleType = null
  
  if (session?.user) {
    // Récupérer les infos complètes de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        juryMember: {
          select: {
            roleType: true,
            isActive: true
          }
        }
      }
    })
    
    if (user) {
      userRole = user.role
      juryRoleType = user.juryMember?.roleType || null
      
      console.log('🔐 ProtectedLayout:', {
        userId: user.id,
        userRole,
        juryRoleType,
        canSwitch: userRole === 'WFM' && juryRoleType === 'WFM_JURY'
      })
    }
  }
  
  return (
    <RoleProvider userRole={userRole} juryRoleType={juryRoleType}>
      {children}
    </RoleProvider>
  )
}