
// app/api/admin/audit-stats/route.ts 

import { NextRequest, NextResponse } from 'next/server'
import { AuditService } from '@/lib/audit-service'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.role !== 'WFM') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    const period = (searchParams.get('period') || 'week') as 'day' | 'week' | 'month'

    const stats = await AuditService.getStats(userId, period)

    // Pas besoin d'audit pour consulter les stats (lecture seule)
    
    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Erreur récupération stats audit:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}