// app/wfm/dashboard/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { RecentCandidates } from "@/components/recent-candidates"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardFilters } from "@/components/dashboard-filters"

interface FilterParams {
  year?: string
  month?: string
  metier?: string
  page?: string
}

interface StatsData {
  total: number
  admis: number
  elimine: number
  enCours: number
  callCenter: number
  agences: number
  boReclam: number
  televente: number
  reseauxSociaux: number
  supervision: number
  botCognitiveTrainer: number
}

const VALID_METIERS = [
  'CALL_CENTER',
  'AGENCES',
  'BO_RECLAM',
  'TELEVENTE',
  'RESEAUX_SOCIAUX',
  'SUPERVISION',
  'BOT_COGNITIVE_TRAINER',
  'SMC_FIXE',
  'SMC_MOBILE'
]

export default async function WFMDashboard({
  searchParams,
}: {
  searchParams: Promise<FilterParams>
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  const userRole = (session?.user as any)?.role
  
  // ✅ Vérification améliorée pour gérer WFM et WFM_JURY
  // Vérifier si l'utilisateur a le droit d'accéder au dashboard WFM
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { 
      juryMember: {
        select: {
          roleType: true
        }
      }
    }
  })

  const isWFM = userRole === "WFM"
  const isWFMJury = user?.juryMember?.roleType === 'WFM_JURY'
  
  // ✅ Bloquer l'accès si l'utilisateur n'est pas WFM
  if (!isWFM) {
    console.log(`🚫 Accès refusé au dashboard WFM pour role: ${userRole}`)
    redirect("/jury/dashboard")
  }

  const params = await searchParams
  
  const currentYear = new Date().getFullYear()
  const year = params.year || currentYear.toString()
  const month = params.month
  const metier = params.metier
  const page = params.page

  const validatedMetier = metier && VALID_METIERS.includes(metier) ? metier : undefined

  try {
    // Récupérer les années disponibles avec Prisma
    const candidatesWithYears = await prisma.candidate.findMany({
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const availableYears = Array.from(
      new Set(candidatesWithYears.map(c => c.createdAt.getFullYear()))
    ).sort((a, b) => b - a)

    if (!availableYears.includes(currentYear)) {
      availableYears.unshift(currentYear)
      availableYears.sort((a, b) => b - a)
    }

    // Construire les filtres
    const startDate = new Date(parseInt(year), month ? parseInt(month) - 1 : 0, 1)
    const endDate = month 
      ? new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      : new Date(parseInt(year), 11, 31, 23, 59, 59)

    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (validatedMetier) {
      whereClause.metier = validatedMetier
    }

    // Récupérer tous les candidats avec leurs scores
    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        scores: {
          select: {
            finalDecision: true
          }
        }
      }
    })

    // Calculer les statistiques
    const total = candidates.length
    const admis = candidates.filter(c => c.scores?.finalDecision === 'RECRUTE').length
    const elimine = candidates.filter(c => c.scores?.finalDecision === 'NON_RECRUTE').length
    const enCours = candidates.filter(c => !c.scores?.finalDecision).length

    // Statistiques par métier
    const metierCounts: Record<string, number> = {}
    candidates.forEach(c => {
      metierCounts[c.metier] = (metierCounts[c.metier] || 0) + 1
    })

    const stats: StatsData = {
      total,
      admis,
      elimine,
      enCours,
      callCenter: metierCounts['CALL_CENTER'] || 0,
      agences: metierCounts['AGENCES'] || 0,
      boReclam: metierCounts['BO_RECLAM'] || 0,
      televente: metierCounts['TELEVENTE'] || 0,
      reseauxSociaux: metierCounts['RESEAUX_SOCIAUX'] || 0,
      supervision: metierCounts['SUPERVISION'] || 0,
      botCognitiveTrainer: metierCounts['BOT_COGNITIVE_TRAINER'] || 0
    }

    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={{
            name: session.user?.name || 'Utilisateur',
            email: session.user?.email || '',
            role: userRole
          }} 
        />
        <main className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tableau Recrutement</h1>
              
            </div>
            <div className="flex gap-3">
              <Link href="/wfm/candidates/new">
                <Button className="bg-orange-500 hover:bg-orange-600 cursor-pointer">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nouveau Candidat
                </Button>
              </Link>
            </div>
          </div>
          
          <DashboardFilters 
            years={availableYears} 
            selectedYear={year}
            selectedMonth={month}
            selectedMetier={validatedMetier}
          />
          
          <StatsCards stats={stats} />
          <RecentCandidates filters={{ year, month, metier: validatedMetier, page }} />
        </main>
        
        <footer className="border-t mt-8 py-4">
          <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
          </div>
        </footer>
      </div>
    )

  } catch (error) {
    console.error("Erreur dashboard:", error)
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={{
            name: session.user?.name || 'Utilisateur',
            email: session.user?.email || '',
            role: userRole
          }} 
        />
        <main className="container mx-auto p-6">
          <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold">Erreur lors du chargement des statistiques</h3>
            <p className="text-sm mt-1">Veuillez réessayer ou contacter le support.</p>
            <p className="text-xs mt-2 text-gray-500">{error instanceof Error ? error.message : 'Erreur inconnue'}</p>
          </div>
        </main>
        
        <footer className="border-t mt-8 py-4">
          <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
          </div>
        </footer>
      </div>
    )
  }
}

function getMonthName(month: string): string {
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]
  const monthIndex = parseInt(month) - 1
  return months[monthIndex] || ""
}

function formatMetierDisplay(metier: string): string {
  const formatMap: Record<string, string> = {
    'CALL_CENTER': 'Call Center',
    'AGENCES': 'Agences',
    'BO_RECLAM': 'Bo Réclam',
    'TELEVENTE': 'Télévente',
    'RESEAUX_SOCIAUX': 'Réseaux Sociaux',
    'SUPERVISION': 'Supervision',
    'BOT_COGNITIVE_TRAINER': 'Bot Cognitive Trainer',
    'SMC_FIXE': 'SMC Fixe',
    'SMC_MOBILE': 'SMC Mobile'
  }
  return formatMap[metier] || metier
}