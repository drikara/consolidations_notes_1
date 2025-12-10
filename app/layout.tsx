// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Système de Recrutement',
  description: 'Plateforme de gestion du recrutement',
  icons:{
    icon:[
      {
        url : "/orange-logo.png",
        href : "/orange-logo.png"
        
      }, 
      {
        url : "/orange.png",
        href :"/orange.png"
      }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}