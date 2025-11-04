// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ⭐ AJOUTEZ cette fonction pour résoudre les problèmes Decimal
export function transformPrismaData(data: any): any {
  if (data === null || data === undefined) return data
  
  if (typeof data === 'object') {
    // Vérifier si c'est un Decimal de Prisma
    if (data && typeof data === 'object' && 'toNumber' in data) {
      return Number(data.toNumber())
    }
    
    // Si c'est un Date, le laisser tel quel
    if (data instanceof Date) {
      return data
    }
    
    // Si c'est un tableau, transformer chaque élément
    if (Array.isArray(data)) {
      return data.map(item => transformPrismaData(item))
    }
    
    // Si c'est un objet, transformer chaque propriété
    const transformed: any = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        transformed[key] = transformPrismaData(data[key])
      }
    }
    return transformed
  }
  
  return data
}