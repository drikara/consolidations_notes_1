// contexts/role-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { LoadingOverlay } from '@/components/loading-overlay'

type ViewMode = 'WFM' | 'JURY'

interface RoleContextType {
  viewMode: ViewMode
  isWFMJury: boolean
  canSwitchRole: boolean
  switchToWFM: () => Promise<void>
  switchToJury: () => Promise<void>
  isLoading: boolean
  loadingMessage: string
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

interface RoleProviderProps {
  children: ReactNode
  userRole: string
  juryRoleType: string | null
}

export function RoleProvider({ children, userRole, juryRoleType }: RoleProviderProps) {
  const router = useRouter()
  const isWFMJury = userRole === 'WFM' && juryRoleType === 'WFM_JURY'
  const canSwitchRole = isWFMJury

  // État pour le mode actif
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'WFM'
    
    // Lire depuis localStorage en priorité
    const stored = localStorage.getItem('viewMode') as ViewMode | null
    return stored || 'WFM'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Chargement...')

  // Synchroniser avec le serveur via cookie
  const syncWithServer = useCallback(async (mode: ViewMode) => {
    try {
      setIsLoading(true)
      setLoadingMessage(`Basculement vers le mode ${mode}...`)
      
      const response = await fetch('/api/auth/switch-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ viewMode: mode })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la synchronisation')
      }

      console.log(`✅ Mode ${mode} synchronisé avec le serveur`, data)
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error)
      toast.error('Erreur lors du changement de mode')
      setIsLoading(false)
      throw error
    }
  }, [])

  const switchToWFM = useCallback(async () => {
    if (!canSwitchRole) {
      console.warn('⚠️ Utilisateur ne peut pas basculer de rôle')
      return
    }
    
    try {
      console.log('🔄 Bascule vers WFM')
      setViewMode('WFM')
      localStorage.setItem('viewMode', 'WFM')
      
      await syncWithServer('WFM')
      
      setLoadingMessage('Redirection vers le dashboard WFM...')
      
      // Petit délai pour l'effet visuel
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/wfm/dashboard')
      router.refresh()
    } catch (error) {
      setIsLoading(false)
    }
  }, [canSwitchRole, syncWithServer, router])

  const switchToJury = useCallback(async () => {
    if (!canSwitchRole) {
      console.warn('⚠️ Utilisateur ne peut pas basculer de rôle')
      return
    }
    
    try {
      console.log('🔄 Bascule vers JURY')
      setViewMode('JURY')
      localStorage.setItem('viewMode', 'JURY')
      
      await syncWithServer('JURY')
      
      setLoadingMessage('Redirection vers le dashboard Jury...')
      
      // Petit délai pour l'effet visuel
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/jury/dashboard')
      router.refresh()
    } catch (error) {
      setIsLoading(false)
    }
  }, [canSwitchRole, syncWithServer, router])

  // Synchroniser au montage (une seule fois)
  useEffect(() => {
    if (canSwitchRole) {
      console.log('🔄 Synchronisation initiale du viewMode:', viewMode)
      syncWithServer(viewMode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Volontairement vide pour n'exécuter qu'une fois

  return (
    <RoleContext.Provider
      value={{
        viewMode,
        isWFMJury,
        canSwitchRole,
        switchToWFM,
        switchToJury,
        isLoading,
        loadingMessage
      }}
    >
      {children}
      {isLoading && <LoadingOverlay message={loadingMessage} />}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole doit être utilisé dans un RoleProvider')
  }
  return context
}