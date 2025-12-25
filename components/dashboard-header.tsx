'use client'

import { signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Calendar,
  Download,
  Star,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  X,
  ClipboardList,
  UserCog,
  Shield,
  History,
  MoreHorizontal,
  FileSpreadsheet
} from 'lucide-react'
import { useRoleSwitcher } from '@/hooks/use-role-switcher'
import { RoleSwitcher } from './role-switcher'

interface DashboardHeaderProps {
  user: {
    name: string
    email: string
    role?: string | null
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  const { activeRole, effectiveRole, canSwitchRole, switchRole, isWfmJury } = useRoleSwitcher()

  const displayRole = effectiveRole || "Utilisateur"

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      localStorage.removeItem('activeRole')
      localStorage.removeItem('viewMode')
      
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/auth/login')
            router.refresh()
          },
          onError: () => {
            window.location.href = '/auth/login'
          }
        }
      })
    } catch (error) {
      console.error('Erreur déconnexion:', error)
      window.location.href = '/auth/login'
    }
  }

  const getNavigationLinks = () => {
    const baseLinks = [
      { 
        href: effectiveRole === 'WFM' ? '/wfm/dashboard' : '/jury/dashboard', 
        label: 'Dashboard', 
        icon: <LayoutDashboard className="w-4 h-4" />,
        priority: 'high'
      },
    ]

    if (effectiveRole === 'WFM') {
      return [
        ...baseLinks,
        { 
          href: '/wfm/sessions', 
          label: 'Sessions', 
          icon: <Calendar className="w-4 h-4" />,
          priority: 'high'
        },
        { 
          href: '/wfm/candidates', 
          label: 'Candidats', 
          icon: <Users className="w-4 h-4" />,
          priority: 'high'
        },
        { 
          href: '/wfm/scores', 
          label: 'Notes', 
          icon: <ClipboardList className="w-4 h-4" />,
          priority: 'medium'
        },
        { 
          href: '/wfm/jury', 
          label: 'Jury', 
          icon: <Target className="w-4 h-4" />,
          priority: 'medium'
        },
        { 
          href: '/wfm/users', 
          label: 'Users', 
          icon: <UserCog className="w-4 h-4" />,
          priority: 'low'
        },
        { 
          href: '/wfm/export', 
          label: 'Export Session', 
          icon: <Download className="w-4 h-4" />,
          priority: 'low'
        },
        { 
          href: '/wfm/export/advanced', 
          label: 'Export Avancé', 
          icon: <FileSpreadsheet className="w-4 h-4" />,
          priority: 'low'
        },
        { 
          href: '/wfm/audit', 
          label: 'Historique', 
          icon: <History className="w-4 h-4" />,
          priority: 'low'
        },
      ]
    }

    if (effectiveRole === 'JURY') {
      return [
        ...baseLinks,
        { 
          href: '/jury/evaluations', 
          label: 'Évaluations', 
          icon: <Star className="w-4 h-4" />,
          priority: 'high'
        },
      ]
    }

    return baseLinks
  }

  const navigationLinks = getNavigationLinks()
  const primaryLinks = navigationLinks.filter(link => link.priority === 'high')
  const secondaryLinks = navigationLinks.filter(link => link.priority === 'medium')
  const moreLinks = navigationLinks.filter(link => link.priority === 'low')

  const isActiveLink = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200/80 backdrop-blur-sm supports-backdrop-blur:bg-white/95 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <div className="flex items-center space-x-2 group">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-base">R</span>
                </div>
                <div className="hidden xl:block">
                  <div className="text-xs font-semibold text-gray-900">Recrutement</div>
                  <div className="text-[10px] text-gray-500">Consolidation</div>
                </div>
              </div>
            </div>

            {/* Navigation desktop - Optimisée */}
            <nav className="hidden lg:flex items-center space-x-0.5 flex-1 justify-center max-w-3xl">
              {/* Liens principaux */}
              {primaryLinks.map((link) => {
                const isActive = isActiveLink(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${isActive 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                )
              })}

              {/* Liens secondaires - cachés sur écrans moyens */}
              {secondaryLinks.map((link) => {
                const isActive = isActiveLink(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      hidden xl:flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${isActive 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                )
              })}

              {/* Menu "Plus" pour les liens supplémentaires */}
              {(moreLinks.length > 0 || secondaryLinks.length > 0) && (
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className={`
                      flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${moreLinks.some(link => isActiveLink(link.href)) || (secondaryLinks.some(link => isActiveLink(link.href)))
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    <span className="hidden xl:inline">Plus</span>
                  </button>

                  {isMoreMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                      {/* Liens secondaires sur écran moyen */}
                      {secondaryLinks.map((link) => {
                        const isActive = isActiveLink(link.href)
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMoreMenuOpen(false)}
                            className={`
                              xl:hidden flex items-center space-x-2 px-4 py-2 text-sm transition-colors
                              ${isActive 
                                ? 'bg-orange-50 text-orange-600 font-medium' 
                                : 'text-gray-700 hover:bg-gray-50'
                              }
                            `}
                          >
                            {link.icon}
                            <span>{link.label}</span>
                          </Link>
                        )
                      })}
                      
                      {/* Tous les liens "more" */}
                      {moreLinks.map((link) => {
                        const isActive = isActiveLink(link.href)
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMoreMenuOpen(false)}
                            className={`
                              flex items-center space-x-2 px-4 py-2 text-sm transition-colors
                              ${isActive 
                                ? 'bg-orange-50 text-orange-600 font-medium' 
                                : 'text-gray-700 hover:bg-gray-50'
                              }
                            `}
                          >
                            {link.icon}
                            <span>{link.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Partie droite */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Menu mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Profile dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-semibold">
                      {getUserInitials(user.name)}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize truncate">
                      {isWfmJury ? displayRole : displayRole.toLowerCase()}
                    </p>
                  </div>
                  <ChevronDown 
                    className={`hidden md:block w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isProfileOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {getUserInitials(user.name)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium mt-1">
                            {isWfmJury ? `Mode ${displayRole}` : displayRole}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isWfmJury && (
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-xs font-medium text-gray-500 mb-2">Changement de rôle</div>
                        <div className="space-y-1.5">
                          <button
                            onClick={() => {
                              switchRole('WFM')
                              setIsProfileOpen(false)
                            }}
                            className={`
                              w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all
                              ${activeRole === 'WFM'
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              <span>Mode WFM</span>
                            </div>
                            {activeRole === 'WFM' && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            )}
                          </button>
                          
                          <button
                            onClick={() => {
                              switchRole('JURY')
                              setIsProfileOpen(false)
                            }}
                            className={`
                              w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all
                              ${activeRole === 'JURY'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              <span>Mode JURY</span>
                            </div>
                            {activeRole === 'JURY' && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <Link
                      href="/settings/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Paramètres</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            {canSwitchRole && (
              <div className="px-4 py-3 border-b border-gray-200">
                <RoleSwitcher 
                  activeRole={activeRole}
                  onRoleSwitch={switchRole}
                />
              </div>
            )}
            
            <div className="px-4 py-3 space-y-1">
              {navigationLinks.map((link) => {
                const isActive = isActiveLink(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                      ${isActive 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}