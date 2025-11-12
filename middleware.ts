// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const allowedOrigins = [
  'https://consolidations-notes-1-eppvmf8mj.vercel.app',
  'https://consolidations-notes-1-g5qh3cu3u.vercel.app',
  'http://localhost:3000'
]

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  if (origin && allowedOrigins.includes(origin)) {
    const response = NextResponse.next()
    
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with')
    response.headers.set('Access-Control-Allow-Credentials', 'true')

    // Gestion des requêtes OPTIONS (preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200,
        headers: Object.fromEntries(response.headers)
      })
    }
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}