// app/wfm/export/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { ExportPanel } from "@/components/export-panel"

export default async function ExportPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  const userRole = (session.user as any).role || "JURY"
  if (userRole !== "WFM") {
    redirect("/auth/login")
  }

  // Récupérer les sessions pour les filtres
  const sessions = await prisma.recruitmentSession.findMany({
    select: {
      id: true,
      metier: true,
      date: true,
      jour: true,
      status: true
    },
    orderBy: {
      date: 'desc'
    }
  })

  // Récupérer les métiers disponibles
  const metiers = await prisma.candidate.groupBy({
    by: ['metier'],
    _count: {
      id: true
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Export des Données</h1>
          <p className="text-gray-600 mt-2">
            Générer des rapports Excel pour l'analyse des résultats
          </p>
        </div>

        <ExportPanel sessions={sessions} metiers={metiers} />

        {/* Informations sur l'export */}
        <div className="mt-8 bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">Fonctionnalités d'Export</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-orange-800">
            <div>
              <h4 className="font-medium mb-3 text-orange-700">Types d'Export</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <strong>Par session</strong> : Fichier Excel pour une session spécifique
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <strong>Multiple</strong> : ZIP avec fichiers par session
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <strong>Global</strong> : Toutes les données sur une période
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-orange-700">Fonctionnalités</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>Colonnes adaptées à chaque métier</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>Détails complets des jurys</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>Format CSV compatible Excel</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>Encodage UTF-8 pour caractères français</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}