// app/wfm/export/page.tsx
import { DashboardHeader } from '@/components/dashboard-header'
import { ToastProvider } from '@/components/toast-provider'
import { ExportPanel } from '@/components/export-panel'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Metier } from '@prisma/client'

// Fonction pour récupérer les sessions de recrutement
async function getRecruitmentSessions() {
  try {
    const sessions = await prisma.recruitmentSession.findMany({
      include: {
        candidates: {
          include: {
            scores: true,
            faceToFaceScores: {
              include: {
                juryMember: true
              }
            }
          }
        },
        juryPresences: {
          include: {
            juryMember: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return sessions.map(session => ({
      id: session.id,
      metier: session.metier,
      jour: session.jour,
      date: session.date.toISOString(),
      location: session.location || '',
      status: session.status,
      candidatCount: session.candidates.length
    }))
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return []
  }
}

// Fonction pour récupérer les métiers avec le nombre de candidats
async function getMetiers() {
  try {
    // Récupérer tous les métiers distincts depuis les candidats
    const metiersFromCandidates = await prisma.candidate.groupBy({
      by: ['metier'],
      _count: {
        id: true
      }
    })

    return metiersFromCandidates.map(m => ({
      metier: m.metier as Metier,
      _count: {
        id: m._count.id
      }
    }))
  } catch (error) {
    console.error('Error fetching metiers:', error)
    return []
  }
}

export default async function ExportPage() {
  // Récupérer la session avec Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Non authentifié</h1>
          <p className="text-gray-600 mt-2">Veuillez vous connecter pour accéder à cette page.</p>
        </div>
        
        {/* Footer avec copyright même en cas d'erreur */}
        <footer className="border-t mt-8 py-4 absolute bottom-0 w-full">
          <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Orange Code d'Ivoire. Développé par okd_dev. Tous droits réservés.
          </div>
        </footer>
      </div>
    )
  }

  // Vérifier le rôle
  const userRole = (session.user as any).role
  if (userRole !== "WFM") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Accès non autorisé</h1>
          <p className="text-gray-600 mt-2">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
        
        {/* Footer avec copyright même en cas d'erreur */}
        <footer className="border-t mt-8 py-4 absolute bottom-0 w-full">
          <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Orange Code d'Ivoire. Développé par okd_dev. Tous droits réservés.
          </div>
        </footer>
      </div>
    )
  }

  // Récupérer les données en parallèle
  const [sessions, metiers] = await Promise.all([
    getRecruitmentSessions(),
    getMetiers()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <ToastProvider />
      <main className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Export des Données</h1>
          <p className="text-gray-600 mt-2">
            Générer des rapports Excel pour l'analyse des résultats et audits
          </p>
        </div>

        <ExportPanel sessions={sessions} metiers={metiers} />
      </main>

      {/* Footer avec copyright */}
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
           © {new Date().getFullYear()}  Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}