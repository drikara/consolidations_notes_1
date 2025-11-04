// lib/session.ts
import { auth } from "./auth"
import { headers } from "next/headers"

export async function getCurrentSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    console.log("🔐 Raw session:", session)

    if (!session?.user) {
      console.log("🔐 No user in session")
      return null
    }

    // ⭐ CORRECTION: Ne pas forcer le rôle à "JURY"
    // Laisser le rôle tel qu'il vient de la base de données
    console.log("🔐 User role from auth:", session.user.role)
    
    return session
  } catch (error) {
    console.error("❌ Error getting session:", error)
    return null
  }
}