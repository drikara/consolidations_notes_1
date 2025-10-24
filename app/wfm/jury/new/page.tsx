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

  const users = await sql`
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.role = 'JURY'
    AND u.id NOT IN (SELECT user_id FROM jury_members)
  `

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Nouveau Membre du Jury</h1>
          <p className="text-muted-foreground mt-1">Ajouter un membre du jury au système</p>
        </div>
        <JuryForm availableUsers={users} />
      </main>
    </div>
  )
}
