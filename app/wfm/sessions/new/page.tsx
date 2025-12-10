// app/wfm/sessions/new/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { DashboardHeader } from "@/components/dashboard-header"
import { SessionForm } from "@/components/session-form"

export default async function NewSessionPage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Nouvelle Session</h1>
          <p className="text-gray-600 mt-2">
            Créer une nouvelle session de recrutement
          </p>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <SessionForm />
        </div>

        {/* Informations */}
        <div className="mt-8 bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">À propos des sessions</h3>
          <div className="text-sm text-orange-800 space-y-4">
            <p>
              <strong>Une session de recrutement</strong> regroupe des candidats pour un même métier 
              à une date spécifique. Elle permet d'organiser le processus d'évaluation et de générer 
              des rapports consolidés.
            </p>
            <div>
              <p className="font-medium text-orange-700 mb-2"><strong>Statuts possibles :</strong></p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong>Planifié</strong> : Session à venir</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong>En cours</strong> : Session active avec évaluations en cours</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong>Terminé</strong> : Session complétée</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong>Annulé</strong> : Session annulée</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}