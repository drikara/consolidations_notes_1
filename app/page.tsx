// app/page.tsx
export const dynamic = 'force-dynamic'
import { redirect } from "next/navigation"
import { getCurrentSession } from "@/lib/session"

export default async function HomePage() {
  const session = await getCurrentSession()

  console.log("🏠 HomePage - User:", session?.user?.email, "Role:", session?.user?.role)

  if (session?.user) {
    const userRole = session.user.role

    if (userRole === "WFM") {
      console.log("🎯 Redirecting WFM to /wfm/dashboard")
      redirect("/wfm/dashboard")
    } else if (userRole === "JURY") {
      console.log("🎯 Redirecting JURY to /jury/dashboard")
      redirect("/jury/dashboard")
    } else {
      console.warn("⚠️ Unknown role:", userRole)
      redirect("/auth/login?error=unknown_role")
    }
  }

  console.log("🔐 No session, redirecting to login")
  redirect("/auth/login")
}