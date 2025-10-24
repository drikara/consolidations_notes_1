import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryForm } from "@/components/jury-form"

export default async function EditJuryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "WFM") {
    redirect("/auth/login")
  }

  const juryMembers = await sql`SELECT * FROM jury_members WHERE id = ${id}`
  const juryMember = juryMembers[0]

  if (!juryMember) {
    redirect("/wfm/jury")
  }

  const users = await sql`
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.role = 'JURY'
    AND (u.id NOT IN (SELECT user_id FROM jury_members) OR u.id = ${juryMember.user_id})
  `

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Modifier le Membre du Jury</h1>
          <p className="text-muted-foreground mt-1">Mettre à jour les informations du membre</p>
        </div>
        <JuryForm juryMember={juryMember} availableUsers={users} />
      </main>
    </div>
  )
}
