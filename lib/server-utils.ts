// lib/server-utils.ts
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Type helper pour extraire le type sérialisé
 */
export type Serialized<T> = T extends Decimal
  ? number
  : T extends Date
  ? string
  : T extends Array<infer U>
  ? Array<Serialized<U>>
  : T extends object
  ? { [K in keyof T]: Serialized<T[K]> }
  : T

/**
 * Convertit un objet Decimal de Prisma en number
 */
function convertDecimal(value: any): number | null {
  if (value === null || value === undefined) return null
  if (value instanceof Decimal) return value.toNumber()
  if (typeof value === 'number') return value
  const num = Number(value)
  return isNaN(num) ? null : num
}

/**
 * Convertit récursivement tous les Decimal en number dans un objet
 */
function convertDecimalsInObject(obj: any): any {
  if (obj === null || obj === undefined) return obj
  
  // Si c'est un Decimal, le convertir
  if (obj instanceof Decimal) {
    return obj.toNumber()
  }
  
  // Si c'est une Date, la convertir en string ISO
  if (obj instanceof Date) {
    return obj.toISOString()
  }
  
  // Si c'est un tableau, traiter chaque élément
  if (Array.isArray(obj)) {
    return obj.map(item => convertDecimalsInObject(item))
  }
  
  // Si c'est un objet, traiter chaque propriété
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertDecimalsInObject(obj[key])
      }
    }
    return converted
  }
  
  // Sinon, retourner tel quel
  return obj
}

/**
 * Transforme les données Prisma pour les rendre compatibles avec les composants Client
 */
export function transformPrismaData(data: any): any {
  return convertDecimalsInObject(data)
}

/**
 * Transforme un tableau de données Prisma
 */
export function transformPrismaDataArray(data: any[]): any[] {
  if (!Array.isArray(data)) return []
  return data.map(item => convertDecimalsInObject(item))
}

/**
 * Sérialise les données pour les passer aux composants Client
 */
export function serializeForClient<T>(data: T): T {
  return JSON.parse(JSON.stringify(convertDecimalsInObject(data)))
}

/**
 * Fonction utilitaire pour formater une date pour l'affichage
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'long') {
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Fonction utilitaire pour formater une date et heure
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Fonction utilitaire pour calculer l'âge à partir d'une date de naissance
 */
export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}