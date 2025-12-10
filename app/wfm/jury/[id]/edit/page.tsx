// app/wfm/jury/[id]/edit/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryForm } from "@/components/jury-form"

export default async function EditJuryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  const juryMember = await prisma.juryMember.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  if (!juryMember) {
    redirect("/wfm/jury")
  }

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

  // Inclure l'utilisateur actuel même s'il est déjà membre
  const availableUsers = [
    {
      id: juryMember.user.id,
      name: juryMember.user.name || "Sans nom",
      email: juryMember.user.email,
    },
    ...users.filter(user => user.id !== juryMember.userId)
  ]

  // ⭐ CORRECTION: Filtrer les utilisateurs valides
  const safeAvailableUsers = availableUsers
    .filter(user => user.id && user.id.trim() !== "" && user.name && user.name.trim() !== "")
    .map(user => ({
      id: user.id,
      name: user.name || "Utilisateur sans nom",
      email: user.email || "sans-email@example.com"
    }))

  // ⭐ CORRECTION: NE PAS convertir la spécialité - laisser comme Metier | null
  // juryMember.specialite est déjà Metier | null, pas besoin de conversion

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Modifier le Membre du Jury</h1>
          <p className="text-gray-600 mt-2">Mettre à jour les informations du membre</p>
        </div>
        
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <JuryForm 
            juryMember={juryMember} 
            availableUsers={safeAvailableUsers}
          />
        </div>
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
  title: "Modifier Jury - WFM",
  description: "Modifier les informations du membre du jury",
}