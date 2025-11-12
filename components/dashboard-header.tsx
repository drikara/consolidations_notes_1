// components/dashboard-header.tsx
'use client'

import { signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  X,
  ClipboardList
} from 'lucide-react'

interface DashboardHeaderProps {
  user: {
    name: string
    email: string
    role?: string | null
  }
  role: string | null
}

export function DashboardHeader({ user, role }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const displayRole = role || "Utilisateur"

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
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

  // Icônes pour chaque lien
  const getNavigationLinks = () => {
    const baseLinks = [
      { 
        href: '/wfm/dashboard', 
        label: 'Tableau de bord', 
        icon: <LayoutDashboard className="w-4 h-4" />
      },
      
    ]

    if (displayRole === 'WFM') {
      return [
        ...baseLinks,
        { 
          href: '/wfm/jury', 
          label: 'Jury', 
          icon: <Target className="w-4 h-4" />
        },
        { 
          href: '/wfm/sessions', 
          label: 'Sessions', 
          icon: <Calendar className="w-4 h-4" />
        },

        { 
          href: '/wfm/scores', 
          label: 'Notes', 
          icon: <ClipboardList className="w-4 h-4" />
        },
        
        { 
          href: '/wfm/export', 
          label: 'Exports', 
          icon: <Download className="w-4 h-4" />
        },
        { 
        href: '/wfm/candidates', 
        label: 'Candidats', 
        icon: <Users className="w-4 h-4" />
      },

      ]
    }

    if (displayRole === 'JURY') {
      return [
        ...baseLinks,
        { 
          href: '/jury/evaluations', 
          label: 'Évaluations', 
          icon: <Star className="w-4 h-4" />
        },
        
       
      ]
    }

    return baseLinks
  }

  const navigationLinks = getNavigationLinks()

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Partie gauche : Logo et navigation desktop */}
            <div className="flex items-center">
              {/* Logo */}
              <Link 
                href="/dashboard" 
                className="flex items-center space-x-3 group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg tracking-tight">R</span>
                </div>
                <div className="hidden lg:block">
                  <div className="text-sm font-semibold text-gray-900">Recruitement</div>
                  <div className="text-xs text-gray-500">Consolidation</div>
                </div>
              </Link>

              {/* Navigation desktop */}
              <nav className="hidden lg:flex items-center space-x-1 ml-8">
                {navigationLinks.map((link) => {
                  const isActive = isActiveLink(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${isActive 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                        }
                      `}
                    >
                      <div className={isActive ? 'text-white' : 'text-gray-400'}>
                        {link.icon}
                      </div>
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Partie droite : Menu utilisateur */}
            <div className="flex items-center space-x-4">
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
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-xs font-semibold">
                      {getUserInitials(user.name)}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{displayRole.toLowerCase()}</p>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isProfileOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Dropdown menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-12 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-200/80 backdrop-blur-sm py-2 z-50 animate-in fade-in-80">
                    {/* Header du dropdown */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white text-sm font-semibold">
                            {getUserInitials(user.name)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <div className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium mt-1">
                            {displayRole}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Liens du dropdown */}
                    {/* <div className="py-2">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                      >
                        <User className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        <span>Mon profil</span>
                      </Link>
                      
                      <Link
                        href="/change-password"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                      >
                        <Settings className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        <span>Changer mot de passe</span>
                      </Link>
                    </div> */}

                    {/* Séparateur */}
                    <div className="border-t border-gray-100 my-1" />

                    {/* Déconnexion */}
                    <button
                      onClick={() => {
                        setIsProfileOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full group"
                    >
                      <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
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
          <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="px-4 py-3 space-y-1">
              {navigationLinks.map((link) => {
                const isActive = isActiveLink(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className={isActive ? 'text-white' : 'text-gray-400'}>
                      {link.icon}
                    </div>
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* Overlay pour mobile */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}