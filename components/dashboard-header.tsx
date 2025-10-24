"use client"

import { signOut } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

type User = {
  id: string
  name: string
  email: string
  role: string
}

export function DashboardHeader({ user, role }: { user: User; role: "WFM" | "JURY" }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/login")
  }

  const navItems =
    role === "WFM"
      ? [
          { href: "/wfm/dashboard", label: "Tableau de Bord" },
          { href: "/wfm/candidates", label: "Candidats" },
          { href: "/wfm/jury", label: "Jurys" },
          { href: "/wfm/scores", label: "Notes" },
          { href: "/wfm/results", label: "Résultats" },
        ]
      : [
          { href: "/jury/dashboard", label: "Tableau de Bord" },
          { href: "/jury/evaluations", label: "Évaluations" },
        ]

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={role === "WFM" ? "/wfm/dashboard" : "/jury/dashboard"} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground">Recrutement</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{role === "WFM" ? "Administrateur" : "Membre du Jury"}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="border-border hover:bg-muted bg-transparent">
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
