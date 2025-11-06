import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { SessionForm } from "@/components/session-form"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditSessionPage({ params }: PageProps) {
  const { id } = await params
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

  const recruitmentSession = await prisma.recruitmentSession.findUnique({
    where: { id }
  })

  if (!recruitmentSession) {
    redirect("/wfm/sessions")
  }

  // Formater les données pour le formulaire
  const sessionData = {
    id: recruitmentSession.id,
    metier: recruitmentSession.metier,
    date: recruitmentSession.date.toISOString().split('T')[0],
    jour: recruitmentSession.jour,
    status: recruitmentSession.status,
    description: recruitmentSession.description || '',
    location: recruitmentSession.location || '',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Modifier la Session</h1>
          <p className="text-gray-600 mt-2">
            {recruitmentSession.metier} - {recruitmentSession.jour} {recruitmentSession.date.toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <SessionForm session={sessionData} />
        </div>

        {/* Informations importantes */}
        <div className="mt-8 bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">Modification d'une session</h3>
          <ul className="text-sm text-orange-800 space-y-3">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>La modification de la date recalcule automatiquement le jour de la semaine</div>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>Le changement de statut affecte les évaluations en cours</div>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>Les candidats associés à cette session seront impactés</div>
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>Les exports refléteront les nouvelles informations</div>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}