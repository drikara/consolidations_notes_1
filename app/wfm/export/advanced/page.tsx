//app/wfm/export/advanced/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { DashboardHeader } from "@/components/dashboard-header"
import { AdvancedExportPanel } from "@/components/advanced-export-panel"

export default async function AdvancedExportPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />  {/* ✅ Retirer role="WFM" */}
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Export Avancé</h1>
          <p className="text-gray-600 mt-2">
            Exportez les candidats selon vos critères (année, période, métier)
          </p>
        </div>

        <AdvancedExportPanel />
      </main>

      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}