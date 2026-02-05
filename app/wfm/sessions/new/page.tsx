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
      <DashboardHeader user={session.user}  />
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

        
      </main>
    </div>
  )
}