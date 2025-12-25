// components/role-switcher.tsx
'use client'

import { Target, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RoleSwitcherProps {
  activeRole: 'WFM' | 'JURY'
  onRoleSwitch: (role: 'WFM' | 'JURY') => void
}

export function RoleSwitcher({ activeRole, onRoleSwitch }: RoleSwitcherProps) {
  const router = useRouter()

  const handleSwitch = (role: 'WFM' | 'JURY') => {
    onRoleSwitch(role)
    
    // Rediriger vers le dashboard correspondant
    if (role === 'WFM') {
      router.push('/wfm/dashboard')
    } else {
      router.push('/jury/dashboard')
    }
    
    // Rafraîchir la page pour mettre à jour la navigation
    router.refresh()
  }

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
      <button
        onClick={() => handleSwitch('WFM')}
        className={`
          flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
          ${activeRole === 'WFM'
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
          }
        `}
      >
        <Users className="w-3.5 h-3.5" />
        <span>WFM</span>
      </button>
      
      <button
        onClick={() => handleSwitch('JURY')}
        className={`
          flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
          ${activeRole === 'JURY'
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
          }
        `}
      >
        <Target className="w-3.5 h-3.5" />
        <span>JURY</span>
      </button>
    </div>
  )
}