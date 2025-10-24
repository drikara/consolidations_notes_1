import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function HomePage() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (session?.user) {
      const userRole = session.user.role as string

      if (userRole === "WFM") {
        redirect("/wfm/dashboard")
      } else {
        redirect("/jury/dashboard")
      }
    }
  } catch (error) {
    console.log("[v0] Session check error:", error)
  }

  redirect("/auth/login")
}
