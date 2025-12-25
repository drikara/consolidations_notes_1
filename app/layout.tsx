// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ReactNode } from 'react'
import { getCurrentSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { RoleProvider } from '@/contexts/role-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Système de Recrutement',
  description: 'Plateforme de gestion du recrutement',
  icons: {
    icon: [
      {
        url: "/orange-logo.png",
        href: "/orange-logo.png"
      }, 
      {
        url: "/orange.png",
        href: "/orange.png"
      }
    ]
  }
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  // Récupérer la session et les infos utilisateur
  const session = await getCurrentSession()
  
  let userRole = 'JURY'
  let juryRoleType = null
  
  if (session?.user) {
    try {
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
        
        console.log('🔐 Layout - User info:', {
          userId: user.id,
          email: user.email,
          role: userRole,
          juryRoleType,
          isWFMJury: userRole === 'WFM' && juryRoleType === 'WFM_JURY'
        })
      }
    } catch (error) {
      console.error('❌ Layout - Erreur récupération user:', error)
    }
  }

  return (
    <html lang="fr">
      <body className={inter.className}>
        <RoleProvider userRole={userRole} juryRoleType={juryRoleType}>
          {children}
        </RoleProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </body>
    </html>
  )
}