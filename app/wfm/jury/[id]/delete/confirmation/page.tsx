// app/wfm/jury/[id]/delete/confirmation/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { DeleteConfirmation } from "@/components/delete-confirmation"

export default async function DeleteConfirmationPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
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
          email: true,
          name: true,
        },
      },
      faceToFaceScores: {
        include: {
          candidate: {
            select: {
              fullName: true,
            },
          },
        },
      },
      juryPresences: {
        include: {
          session: {
            select: {
              metier: true,
              date: true,
            },
          },
        },
      },
    },
  })

  if (!juryMember) {
    redirect("/wfm/jury")
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 via-orange-50 to-amber-50">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-4xl">
        <DeleteConfirmation 
          juryMember={juryMember}
        />
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
  title: "Confirmation Suppression - WFM",
  description: "Confirmer la suppression d'un membre du jury",
}