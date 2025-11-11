// lib/auth-client.ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "https://consolidations-notes-1-g5qh3cu3u.vercel.ap",
  // ⭐ IMPORTANT: Ajoutez cette option
  fetchOptions: {
    credentials: "include", // Pour que les cookies soient envoyés
  },
})

export const { signIn, signUp, signOut, useSession } = authClient