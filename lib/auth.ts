// lib/auth.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"
import bcrypt from "bcrypt"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "https://consolidations-notes-1.vercel.app",
  
  trustedOrigins: [
    "https://consolidations-notes-1.vercel.app",
    "https://consolidations-notes-1-*.vercel.app",
    "http://localhost:3000",
  ],
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // ✅ CONFIGURATION BCRYPT - CRITIQUE!
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 10)
      },
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        return await bcrypt.compare(password, hash)
      }
    }
  },
  
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "JURY",
      },
      lastLogin: {
        type: "date",
        required: false,
      },
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour
    },
  },
  
  advanced: {
    cookiePrefix: "better-auth",
    crossSubDomainCookies: {
      enabled: true,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    generateSchema: false,
  },

  admin: {
    enabled: true
  }
})