"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"WFM" | "JURY">("JURY")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signUp.email({
        email,
        password,
        name,
        role,
      })

      if (result.error) {
        setError("Erreur lors de l'inscription")
        setLoading(false)
        return
      }

      // Redirect based on role
      if (role === "WFM") {
        router.push("/wfm/dashboard")
      } else {
        router.push("/jury/dashboard")
      }
    } catch (err) {
      setError("Une erreur est survenue")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2 border-border">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Inscription</CardTitle>
          <CardDescription className="text-muted-foreground">Créer un nouveau compte</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Nom complet
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-border focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-border focus:ring-primary"
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
                minLength={8}
                className="border-border focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground">
                Rôle
              </Label>
              <Select value={role} onValueChange={(value: "WFM" | "JURY") => setRole(value)}>
                <SelectTrigger className="border-border focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JURY">Membre du Jury</SelectItem>
                  <SelectItem value="WFM">WFM (Administrateur)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-accent text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Inscription..." : "S'inscrire"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <a href="/auth/login" className="text-primary hover:underline font-medium">
              Se connecter
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
