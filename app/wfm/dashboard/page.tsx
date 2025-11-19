// app/wfm/dashboard/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
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
}

// Interface correspondant exactement à ce que StatsCards attend
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

// Utilisez les valeurs EXACTES de votre enum Metier
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

  const userRole = (session?.user as any)?.role
  if (!session || userRole !== "WFM") {
    redirect("/auth/login")
  }

  const params = await searchParams
  
  const currentYear = new Date().getFullYear()
  const year = params.year || currentYear.toString()
  const month = params.month
  const metier = params.metier

  // VALIDATION CRITIQUE : Vérifier que le métier est valide
  const validatedMetier = metier && VALID_METIERS.includes(metier) ? metier : undefined

  try {
    // Récupérer les années disponibles
    const availableYearsResult = await sql`
      SELECT DISTINCT EXTRACT(YEAR FROM created_at) as year 
      FROM candidates 
      ORDER BY year DESC
    `
    const availableYears = availableYearsResult.map((row: any) => Number(row.year))
    if (!availableYears.includes(currentYear)) {
      availableYears.unshift(currentYear)
      availableYears.sort((a, b) => b - a)
    }

    // Requête stats principale
    let statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN s.final_decision = 'RECRUTE' THEN 1 END) as admis,
        COUNT(CASE WHEN s.final_decision = 'NON_RECRUTE' THEN 1 END) as elimine,
        COUNT(CASE WHEN s.final_decision IS NULL THEN 1 END) as en_cours
      FROM candidates c
      LEFT JOIN scores s ON c.id = s.candidate_id
      WHERE EXTRACT(YEAR FROM c.created_at) = $1
    `
    
    let queryParams: any[] = [parseInt(year)]

    if (month) {
      statsQuery += ` AND EXTRACT(MONTH FROM c.created_at) = $${queryParams.length + 1}`
      queryParams.push(parseInt(month))
    }

    // UTILISER LE MÉTIER VALIDÉ seulement
    if (validatedMetier) {
      statsQuery += ` AND c.metier = $${queryParams.length + 1}`
      queryParams.push(validatedMetier)
    }

    const statsResult = await sql.unsafe(statsQuery, queryParams)
    const mainStats = statsResult[0]

    // Récupérer les vraies statistiques par métier
    const metierStatsQuery = `
      SELECT 
        c.metier,
        COUNT(*) as count
      FROM candidates c
      WHERE EXTRACT(YEAR FROM c.created_at) = $1
      ${month ? `AND EXTRACT(MONTH FROM c.created_at) = $2` : ''}
      GROUP BY c.metier
    `
    
    const metierStatsParams = [parseInt(year)]
    if (month) metierStatsParams.push(parseInt(month))
    
    const metierStatsResult = await sql.unsafe(metierStatsQuery, metierStatsParams)
    
    // Convertir en format attendu par StatsCards
    const metierCounts: Record<string, number> = {}
    metierStatsResult.forEach((row: any) => {
      metierCounts[row.metier] = Number(row.count)
    })

    const stats: StatsData = {
      total: Number(mainStats?.total || 0),
      admis: Number(mainStats?.admis || 0),
      elimine: Number(mainStats?.elimine || 0),
      enCours: Number(mainStats?.en_cours || 0),
      // Utiliser les vraies données de votre base
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
          role={userRole} 
        />
        <main className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold ">Tableau de Bord WFM</h1>
              <p className="text-muted-foreground mt-1">
                Statistiques pour {month ? `${getMonthName(month)} ` : ''}{year}
                {validatedMetier && ` - ${formatMetierDisplay(validatedMetier)}`}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/wfm/candidates/new">
                <Button className="bg-orange-500 hover:bg-orange-600  cursor-pointer">
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
          <RecentCandidates filters={{ year, month, metier: validatedMetier }} />
        </main>
        
        {/* Footer avec copyright */}
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
          role={userRole} 
        />
        <main className="container mx-auto p-6">
          <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold">Erreur lors du chargement des statistiques</h3>
            <p className="text-sm mt-1">Veuillez réessayer ou contacter le support.</p>
          </div>
        </main>
        
        {/* Footer avec copyright même en cas d'erreur */}
        <footer className="border-t mt-8 py-4">
          <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()}  Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
          </div>
        </footer>
      </div>
    )
  }
}

// Fonction utilitaire pour obtenir le nom du mois
function getMonthName(month: string): string {
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]
  const monthIndex = parseInt(month) - 1
  return months[monthIndex] || ""
}

// Fonction pour formater l'affichage des métiers
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