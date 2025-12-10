//auth/login/page.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // ⭐ IMPORTANT: better-auth signIn.email retourne directement les données
      const { data, error: signInError } = await signIn.email(
        {
          email,
          password,
        },
        {
          onRequest: () => {
            console.log("🔄 Requête de connexion envoyée...")
          },
          onSuccess: () => {
            console.log("✅ Connexion réussie")
          },
          onError: (ctx) => {
            console.error("❌ Erreur de connexion:", ctx.error)
          },
        }
      )

      // Gérer les erreurs
      if (signInError) {
        console.error("Erreur de connexion:", signInError)
        setError(signInError.message || "Email ou mot de passe incorrect")
        setLoading(false)
        return
      }

      // Vérifier que nous avons bien les données
      if (!data?.user) {
        setError("Erreur lors de la récupération des données utilisateur")
        setLoading(false)
        return
      }

      console.log("✅ Utilisateur connecté:", data.user)

      // ⭐ Accéder au rôle depuis data.user.role (champ personnalisé)
      const userRole = (data.user as any).role || "JURY"

      console.log("🎭 Rôle de l'utilisateur:", userRole)

      // Attendre un court instant pour que la session soit bien établie
      await new Promise(resolve => setTimeout(resolve, 100))

      // Redirection basée sur le rôle
      if (userRole === "WFM") {
        router.push("/wfm/dashboard")
      } else {
        router.push("/jury/dashboard")
      }

      // Forcer le rechargement
      router.refresh()

    } catch (err: any) {
      console.error("❌ Erreur fatale lors de la connexion:", err)
      setError(err.message || "Une erreur est survenue lors de la connexion")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2 border-border">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-orange-500">Connexion</CardTitle>
          <CardDescription className="text-muted-foreground">
            Système de Consolidation des Notes de Recrutement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@recruitment.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-border focus:ring-primary"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-border focus:ring-primary"
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-orange-600 bg-orange-500 cursor-pointer text-primary-foreground font-medium "
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          {/* Comptes de test pour le développement */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">Comptes de test :</h4>
              <div className="text-xs space-y-1">
                <div><strong>Admin:</strong> wfm@recruitment.com / Admin123</div>
                <div><strong>Jury:</strong> rep@recruitment.com / jury123</div>
              </div>
            </div>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <a 
              href="/auth/signup" 
              className="text-orange-500 hover:underline font-medium transition-colors"
            >
              S'inscrire
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}