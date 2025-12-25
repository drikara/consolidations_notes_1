// app/api/admin/audit-logs/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { AuditService, AuditAction, AuditEntity } from '@/lib/audit-service'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /api/admin/audit-logs appelée')
    
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.role !== 'WFM') {
      console.log('❌ Accès refusé - Role:', session?.user?.role)
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    console.log('✅ Authentification OK:', session.user.email)

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') as AuditAction | undefined
    const entity = searchParams.get('entity') as AuditEntity | undefined
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const startDate = startDateStr ? new Date(startDateStr) : undefined
    const endDate = endDateStr ? new Date(endDateStr) : undefined

    console.log('📊 Paramètres de recherche:', {
      action,
      entity,
      startDate,
      endDate,
      limit,
      offset
    })

    // Récupérer les logs depuis le service
    const result = await AuditService.getLogs({
      action,
      entity,
      startDate,
      endDate,
      limit,
      offset
    })

    console.log(`✅ ${result.logs.length} logs trouvés (total: ${result.total})`)

    return NextResponse.json({
      success: true,
      data: result.logs,
      total: result.total,
      page: Math.floor(offset / limit) + 1,
      limit
    })

  } catch (error) {
    console.error('❌ Erreur récupération logs audit:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}


