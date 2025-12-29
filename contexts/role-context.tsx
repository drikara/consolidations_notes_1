// contexts/role-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

type ViewMode = 'WFM' | 'JURY'

interface RoleContextType {
  viewMode: ViewMode
  isWFMJury: boolean
  canSwitchRole: boolean
  switchToWFM: () => Promise<void>
  switchToJury: () => Promise<void>
  isLoading: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

interface RoleProviderProps {
  children: ReactNode
  userRole: string
  juryRoleType: string | null
}

// ✅ Fonction helper pour lire les cookies côté client
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

export function RoleProvider({ children, userRole, juryRoleType }: RoleProviderProps) {
  const router = useRouter()
  const isWFMJury = userRole === 'WFM' && juryRoleType === 'WFM_JURY'
  const canSwitchRole = isWFMJury

  // ✅ État pour le mode actif - priorité au cookie
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'WFM'
    
    // 1. Lire depuis le cookie en priorité
    const cookieValue = getCookie('viewMode') as ViewMode | null
    if (cookieValue && (cookieValue === 'WFM' || cookieValue === 'JURY')) {
      console.log('🍪 ViewMode depuis cookie:', cookieValue)
      // Synchroniser localStorage avec le cookie
      localStorage.setItem('viewMode', cookieValue)
      return cookieValue
    }
    
    // 2. Fallback sur localStorage
    const stored = localStorage.getItem('viewMode') as ViewMode | null
    if (stored && (stored === 'WFM' || stored === 'JURY')) {
      console.log('💾 ViewMode depuis localStorage:', stored)
      return stored
    }
    
    // 3. Default pour WFM_JURY
    if (isWFMJury) {
      return 'WFM'
    }
    
    // 4. Default général
    return userRole === 'JURY' ? 'JURY' : 'WFM'
  })

  const [isLoading, setIsLoading] = useState(false)

  // ✅ Synchroniser avec le serveur via cookie
  const syncWithServer = useCallback(async (mode: ViewMode) => {
    try {
      setIsLoading(true)
      
      console.log(`🔄 Tentative de synchronisation mode: ${mode}`)
      
      const response = await fetch('/api/auth/switch-mode', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important pour envoyer et recevoir les cookies
        body: JSON.stringify({ viewMode: mode })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Erreur API switch-mode:', data)
        throw new Error(data.error || 'Erreur lors de la synchronisation')
      }

      console.log(`✅ Mode ${mode} synchronisé avec le serveur`, data)
      
      // ✅ Attendre un peu que le cookie soit bien défini
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // ✅ Vérifier que le cookie a bien été défini
      const cookieValue = getCookie('viewMode')
      console.log('🍪 Cookie après sync:', cookieValue)
      
      if (cookieValue !== mode) {
        console.warn('⚠️ Le cookie ne correspond pas au mode demandé')
      }
      
      return true
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du changement de mode')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const switchToWFM = useCallback(async () => {
    if (!canSwitchRole) {
      console.warn('⚠️ Utilisateur ne peut pas basculer de rôle')
      toast.error('Vous ne pouvez pas basculer de rôle')
      return
    }
    
    console.log('🔄 Bascule vers WFM')
    toast.loading('Basculement vers le mode WFM...')
    
    setViewMode('WFM')
    localStorage.setItem('viewMode', 'WFM')
    
    const success = await syncWithServer('WFM')
    toast.dismiss()
    
    if (success) {
      toast.success('Mode WFM activé')
      router.push('/wfm/dashboard')
      router.refresh()
    }
  }, [canSwitchRole, syncWithServer, router])

  const switchToJury = useCallback(async () => {
    if (!canSwitchRole) {
      console.warn('⚠️ Utilisateur ne peut pas basculer de rôle')
      toast.error('Vous ne pouvez pas basculer de rôle')
      return
    }
    
    console.log('🔄 Bascule vers JURY')
    toast.loading('Basculement vers le mode JURY...')
    
    setViewMode('JURY')
    localStorage.setItem('viewMode', 'JURY')
    
    const success = await syncWithServer('JURY')
    toast.dismiss()
    
    if (success) {
      toast.success('Mode JURY activé')
      router.push('/jury/dashboard')
      router.refresh()
    }
  }, [canSwitchRole, syncWithServer, router])

  // ✅ Synchroniser au montage si WFM_JURY
  useEffect(() => {
    if (canSwitchRole) {
      // Vérifier si le cookie existe déjà
      const cookieValue = getCookie('viewMode')
      
      if (!cookieValue) {
        console.log('🔄 Aucun cookie viewMode - Synchronisation initiale:', viewMode)
        syncWithServer(viewMode)
      } else {
        console.log('✅ Cookie viewMode déjà présent:', cookieValue)
        // S'assurer que l'état local correspond au cookie
        if (cookieValue !== viewMode && (cookieValue === 'WFM' || cookieValue === 'JURY')) {
          console.log(`🔄 Mise à jour du state local: ${viewMode} → ${cookieValue}`)
          setViewMode(cookieValue)
          localStorage.setItem('viewMode', cookieValue)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <RoleContext.Provider
      value={{
        viewMode,
        isWFMJury,
        canSwitchRole,
        switchToWFM,
        switchToJury,
        isLoading
      }}
    >
      {children}
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