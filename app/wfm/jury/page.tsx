// app/wfm/jury/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryManagement } from "@/components/jury-management"

export default async function JuryManagementPage() {
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

  // Récupérer les membres du jury
  const juryMembers = await prisma.juryMember.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
        },
      },
      faceToFaceScores: {
        select: {
          id: true,
        },
      },
      juryPresences: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Récupérer les utilisateurs disponibles (rôle JURY)
  const users = await prisma.user.findMany({
    where: {
      role: 'JURY',
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  // Formater les données avec les statistiques
  const formattedJuryMembers = juryMembers.map(member => ({
    id: member.id,
    userId: member.userId,
    fullName: member.fullName,
    roleType: member.roleType,
    specialite: member.specialite,
    department: member.department,
    phone: member.phone,
    isActive: member.isActive,
    user: member.user,
    stats: {
      evaluationsCount: member.faceToFaceScores.length,
      presencesCount: member.juryPresences.length,
    },
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Gestion des Membres du Jury</h1>
          <p className="text-gray-600 mt-2">
            Ajouter et gérer les membres du jury pour les évaluations
          </p>
        </div>

        <JuryManagement 
          juryMembers={formattedJuryMembers} 
          users={users} 
        />

        {/* Informations sur les rôles */}
        <div className="mt-8 bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4">Types de Rôles du Jury</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-orange-800">
            <div>
              <h4 className="font-medium mb-3 text-orange-700">Rôles Disponibles</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong>DRH</strong> : Directeur des Ressources Humaines</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong>EPC</strong> : Équipe de Pilotage du Changement</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong>REPRESENTANT_METIER</strong> : Expert du métier concerné</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div><strong>WFM_JURY</strong> : Membre WFM participant aux jurys</div>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-orange-700">Quorum Requis</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>Présence obligatoire du WFM</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>Présence du représentant du métier</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>Au moins 3 membres pour validation</div>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>Décision collégiale requise</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}