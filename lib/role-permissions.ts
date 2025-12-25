// lib/role-permissions.ts
/**
 * Obtenir le rôle actif pour un utilisateur WFM_JURY
 * depuis le localStorage côté client
 */
export function getActiveRole(userRole: string | null): string {
  if (typeof window === 'undefined') {
    // Côté serveur, retourner le rôle tel quel
    return userRole || 'JURY'
  }

  // Si l'utilisateur a le rôle WFM_JURY, récupérer le rôle actif
  if (userRole === 'WFM_JURY') {
    const activeRole = localStorage.getItem('activeRole')
    return activeRole || 'WFM' // Par défaut WFM
  }

  return userRole || 'JURY'
}

/**
 * Vérifier si un utilisateur a accès à une route spécifique
 * en fonction de son rôle actif
 */
export function hasRouteAccess(pathname: string, userRole: string | null): boolean {
  const effectiveRole = getActiveRole(userRole)

  // Routes WFM
  if (pathname.startsWith('/wfm/')) {
    return effectiveRole === 'WFM' || userRole === 'WFM_JURY'
  }

  // Routes JURY
  if (pathname.startsWith('/jury/')) {
    return effectiveRole === 'JURY' || userRole === 'WFM_JURY'
  }

  // Routes communes
  return true
}

/**
 * Obtenir l'URL de redirection par défaut selon le rôle
 */
export function getDefaultDashboardUrl(userRole: string | null): string {
  const effectiveRole = getActiveRole(userRole)

  if (effectiveRole === 'WFM' || userRole === 'WFM') {
    return '/wfm/dashboard'
  }

  if (effectiveRole === 'JURY' || userRole === 'JURY') {
    return '/jury/dashboard'
  }

  return '/wfm/dashboard'
}