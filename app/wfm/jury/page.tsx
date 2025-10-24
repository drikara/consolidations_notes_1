import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryList } from "@/components/jury-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function JuryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || session.user.role !== "WFM") {
    redirect("/auth/login")
  }

  const juryMembers = await sql`
    SELECT jm.*, u.email, u.name as user_name
    FROM jury_members jm
    JOIN users u ON jm.user_id = u.id
    ORDER BY jm.created_at DESC
  `

  const users = await sql`
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.role = 'JURY'
    AND u.id NOT IN (SELECT user_id FROM jury_members)
  `

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Jurys</h1>
            <p className="text-muted-foreground mt-1">Liste des membres du jury enregistrés</p>
          </div>
          <Link href="/wfm/jury/new">
            <Button className="bg-primary hover:bg-accent text-primary-foreground">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau Membre
            </Button>
          </Link>
        </div>
        <JuryList juryMembers={juryMembers} availableUsers={users} />
      </main>
    </div>
  )
}
