// lib/audit-service.ts

import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// ✅ Types mis à jour pour correspondre au schéma Prisma
export type AuditAction = 
  | 'CREATE' 
  | 'READ'      
  | 'UPDATE' 
  | 'DELETE' 
  | 'EXPORT' 
  | 'LOGIN' 
  | 'LOGOUT'
  | 'ASSIGN' 
  | 'UNASSIGN'
  | 'APPROVE' 
  | 'REJECT'

export type AuditEntity = 
  | 'SESSION' 
  | 'CANDIDATE' 
  | 'JURY_MEMBER' 
  | 'SCORE' 
  | 'USER' 
  | 'USER_ROLE'      
  | 'USER_EMAIL'     
  | 'USER_PASSWORD'  
  | 'PRESENCE'       
  | 'EXPORT' 
  

interface AuditLogData {
  userId: string
  userName: string
  userEmail: string
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

export class AuditService {
  /**
   * Enregistre une action dans l'historique
   */
  static async log(data: AuditLogData) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          description: data.description,
          metadata: data.metadata || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      })
      
      console.log(`✅ Audit: ${data.userName} - ${data.action} ${data.entity}`)
    } catch (error) {
      console.error('❌ Erreur audit log:', error)
      // Ne pas bloquer l'opération principale si l'audit échoue
    }
  }

  /**
   * Récupère l'historique avec filtres
   */
  static async getLogs(filters?: {
    userId?: string
    action?: AuditAction
    entity?: AuditEntity
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }) {
    const where: any = {}

    if (filters?.userId) where.userId = filters.userId
    if (filters?.action) where.action = filters.action
    if (filters?.entity) where.entity = filters.entity
    
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ])

    return { logs, total }
  }

  /**
   * Récupère les statistiques d'activité
   */
  static async getStats(userId?: string, period: 'day' | 'week' | 'month' = 'week') {
    const now = new Date()
    const startDate = new Date()
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const where: any = {
      createdAt: { gte: startDate }
    }
    if (userId) where.userId = userId

    const logs = await prisma.auditLog.findMany({ where })

    // Statistiques par action
    const actionStats = logs.reduce((acc: Record<string, number>, log: any) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Statistiques par entité
    const entityStats = logs.reduce((acc: Record<string, number>, log: any) => {
      acc[log.entity] = (acc[log.entity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalActions: logs.length,
      actionStats,
      entityStats,
      period,
      startDate,
      endDate: now,
    }
  }

  /**
   * Récupère l'historique d'une entité spécifique
   */
  static async getEntityHistory(entity: AuditEntity, entityId: string) {
    return prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}

/**
 * Extraire les informations de requête pour l'audit
 */
export function getRequestInfo(request: Request) {
  const headers = request.headers
  return {
    ipAddress: headers.get('x-forwarded-for')?.split(',')[0] || 
               headers.get('x-real-ip') || 
               'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
  }
}