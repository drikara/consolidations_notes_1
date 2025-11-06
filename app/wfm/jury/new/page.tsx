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

  // Filtrer les utilisateurs qui ne sont pas déjà membres du jury
  const existingJuryUserIds = await prisma.juryMember.findMany({
    select: {
      userId: true,
    },
  })

  const existingIds = existingJuryUserIds.map(j => j.userId)
  const availableUsers = users.filter(user => !existingIds.includes(user.id))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Nouveau Membre du Jury</h1>
          <p className="text-gray-600 mt-2">Ajouter un membre du jury au système</p>
        </div>
        
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <JuryForm availableUsers={availableUsers} />
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
  title: "Nouveau Jury - WFM",
  description: "Ajouter un nouveau membre du jury",
}