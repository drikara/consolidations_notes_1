import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryForm } from "@/components/jury-form"

export default async function NewJuryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  // Récupérer les utilisateurs disponibles
  const users = await prisma.user.findMany({
    where: {
      role: 'JURY',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  // Exclure les utilisateurs déjà membres du jury
  const existingJuryUserIds = await prisma.juryMember.findMany({
    select: { userId: true }
  })
  
  const existingIds = new Set(existingJuryUserIds.map(j => j.userId))
  const availableUsers = users.filter(u => !existingIds.has(u.id))

  // ✅ NOUVEAU: Récupérer les sessions disponibles
  const availableSessions = await prisma.recruitmentSession.findMany({
    where: {
      status: {
        in: ['PLANIFIED', 'IN_PROGRESS'] // Seulement les sessions actives
      }
    },
    select: {
      id: true,
      metier: true,
      date: true,
      jour: true,
      status: true,
    },
    orderBy: {
      date: 'asc'
    }
  })

  // Formater les sessions pour le formulaire
  const formattedSessions = availableSessions.map(s => ({
    id: s.id,
    metier: s.metier,
    date: s.date.toISOString(),
    jour: s.jour,
    status: s.status
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Nouveau Membre du Jury</h1>
          <p className="text-gray-600 mt-2">
            Ajouter un membre du jury et l'assigner aux sessions
          </p>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <JuryForm 
            availableUsers={availableUsers}
            availableSessions={formattedSessions}
          />
        </div>

        {/* Informations */}
        <div className="mt-8 bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">À propos de l'ajout de jury</h3>
          <ul className="text-sm text-orange-800 space-y-3">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>Utilisateur requis :</strong> Seuls les utilisateurs avec le rôle "JURY" peuvent être ajoutés
              </div>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>Sessions :</strong> Vous pouvez assigner le jury à plusieurs sessions dès la création
              </div>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>Spécialité :</strong> La spécialité permet de filtrer les jurys par métier
              </div>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <strong>Modification ultérieure :</strong> Les sessions peuvent être ajoutées/retirées depuis la page de détails de la session
              </div>
            </li>
          </ul>
        </div>

        {availableUsers.length === 0 && (
          <div className="mt-8 bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-semibold text-red-800 text-lg">Aucun utilisateur disponible</p>
                <p className="text-red-700 mt-2">
                  Tous les utilisateurs avec le rôle "JURY" sont déjà membres du jury. 
                  Vous devez d'abord créer un nouvel utilisateur avec le rôle "JURY".
                </p>
              </div>
            </div>
          </div>
        )}

        {availableSessions.length === 0 && (
          <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-blue-800 text-lg">Aucune session disponible</p>
                <p className="text-blue-700 mt-2">
                  Il n'y a pas de sessions planifiées ou en cours. 
                  Vous pourrez assigner ce jury à des sessions ultérieurement.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    colorScheme: "light",
  }
}

export const metadata = {
  title: "Nouveau Jury - WFM",
  description: "Ajouter un nouveau membre du jury",
}