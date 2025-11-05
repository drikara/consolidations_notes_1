import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DashboardHeader } from "@/components/dashboard-header"

export const metadata: Metadata = {
  title: "Consolidation des Notes de Recrutement",
  description: "Application de consolidation des notes de recrutement",
  generator: 'Next.js',
  applicationName: 'Consolidation des Notes de Recrutement',
  keywords: ['Recrutement', 'Consolidation', 'Notes', 'WFM', 'JURY'],
  authors: [{ name: 'Votre Nom ou Organisation', url: 'https://votre-site.com' }],
  colorScheme: 'light dark',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
       
         
          {children}
        
      </body>
    </html>
  )
}