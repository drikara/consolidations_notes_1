// hooks/use-role-switcher.ts
'use client'

import { useRole } from '@/contexts/role-context'

/**
 * Hook simplifié qui utilise le contexte
 * Compatible avec l'ancien code
 */
export function useRoleSwitcher() {
  const context = useRole()
  
  return {
    activeRole: context.viewMode,
    effectiveRole: context.viewMode,
    canSwitchRole: context.canSwitchRole,
    switchRole: (role: 'WFM' | 'JURY') => {
      if (role === 'WFM') {
        context.switchToWFM()
      } else {
        context.switchToJury()
      }
    },
    isWfmJury: context.isWFMJury
  }
}

export type UserRole = 'WFM' | 'JURY'