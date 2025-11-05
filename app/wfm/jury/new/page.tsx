// app/wfm/jury/new/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryForm } from "@/components/jury-form"

export default async function NewJuryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "WFM") {
    redirect("/auth/login")
  }

  const usersResult = await sql`
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.role = 'JURY'
    AND u.id NOT IN (SELECT user_id FROM jury_members)
  `

  // Typage explicite pour corriger l'erreur TypeScript
  const users = usersResult.map((row: any) => ({
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Nouveau Membre du Jury</h1>
          <p className="text-gray-600 mt-2">Ajouter un membre du jury au système</p>
        </div>
        
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
          <JuryForm availableUsers={users} />
        </div>
      </main>
    </div>
  )
}