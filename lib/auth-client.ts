// lib/auth-client.ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  // ⭐ IMPORTANT: Ajoutez cette option
  fetchOptions: {
    credentials: "include", // Pour que les cookies soient envoyés
  },
})

export const { signIn, signUp, signOut, useSession } = authClient