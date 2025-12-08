// app/wfm/candidates/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidatesList } from "@/components/candidates-list"
import { transformPrismaDataArray } from "@/lib/server-utils"

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CandidatesPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  // Attendre searchParams avant de l'utiliser
  const params = await searchParams
  
  const filterMetier = params.metier as string | undefined
  const filterStatus = params.status as string | undefined
  const filterAvailability = params.availability as string | undefined
  const filterStatut = params.statut as string | undefined
  const searchQuery = params.search as string | undefined
  const sortBy = (params.sort as string) || 'newest'

  try {
    // Récupération des candidats avec gestion d'erreur
    const candidates = await prisma.candidate.findMany({
      include: {
        scores: true,
        session: true,
        faceToFaceScores: {
          include: {
            juryMember: {
              select: {
                fullName: true,
                roleType: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // CORRECTION : Transformer les données avec gestion d'erreur robuste
    const transformedCandidates = transformPrismaDataArray(candidates || [])

    // Calcul des statistiques (côté serveur) avec vérifications
    const totalCandidates = transformedCandidates.length
    
    // Note: callStatus n'existe plus, on utilise statut à la place
    const contactedCandidates = transformedCandidates.filter(candidate => 
      candidate?.scores?.statut // Présent ou absent signifie qu'il a été contacté
    ).length
    
    const recruitedCandidates = transformedCandidates.filter(candidate => 
      candidate?.scores?.finalDecision === 'RECRUTE'
    ).length
    
    const pendingCandidates = transformedCandidates.filter(candidate => 
      !candidate?.scores?.finalDecision
    ).length
    
    // Nouvelles statistiques pour la disponibilité
    const availableCandidates = transformedCandidates.filter(candidate => 
      candidate?.availability === 'Oui'
    ).length
    
    const notAvailableCandidates = transformedCandidates.filter(candidate => 
      candidate?.availability === 'Non'
    ).length
    
    // Nouvelles statistiques pour le statut (Présent/Absent)
    const presentCandidates = transformedCandidates.filter(candidate => 
      candidate?.scores?.statut === 'PRESENT'
    ).length
    
    const absentCandidates = transformedCandidates.filter(candidate => 
      candidate?.scores?.statut === 'ABSENT'
    ).length

    // Récupérer tous les métiers uniques pour les filtres
    const metiers = [...new Set(transformedCandidates
      .map(c => c?.metier)
      .filter(Boolean) as string[]
    )].sort()

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <DashboardHeader user={session.user} role="WFM" />
        
        <main className="container mx-auto p-6 max-w-7xl">
          {/* Composant Client pour la liste interactive */}
          <CandidatesList 
            candidates={transformedCandidates}
            initialFilters={{
              metier: filterMetier,
              status: filterStatus,
              availability: filterAvailability,
              statut: filterStatut,
              search: searchQuery,
              sort: sortBy
            }}
            statistics={{
              total: totalCandidates,
              contacted: contactedCandidates,
              recruited: recruitedCandidates,
              pending: pendingCandidates,
              available: availableCandidates,
              notAvailable: notAvailableCandidates,
              present: presentCandidates,
              absent: absentCandidates
            }}
            metiers={metiers}
          />
        </main>

        {/* Footer avec copyright */}
        <footer className="border-t border-gray-200 mt-12 py-6 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 text-center text-gray-600 text-sm">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <span className="font-semibold text-gray-800">© {new Date().getFullYear()} Orange Côte d'Ivoire</span>
                <span className="mx-2">•</span>
                <span>Système de Recrutement</span>
              </div>
              <div>
                <span className="text-orange-600 font-medium">Développé par okd_dev</span>
                <span className="mx-2">•</span>
                <span>Tous droits réservés</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Version 2.0 | Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </footer>
      </div>
    )
  } catch (error) {
    console.error("Erreur lors du chargement des candidats:", error)
    
    // Fallback en cas d'erreur avec toutes les statistiques
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <DashboardHeader user={session.user} role="WFM" />
        
        <main className="container mx-auto p-6 max-w-7xl">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.886-.833-2.656 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Erreur de chargement</h3>
                <p className="text-gray-600 mt-1">
                  Une erreur est survenue lors du chargement des candidats. Veuillez réessayer.
                </p>
              </div>
            </div>
          </div>
          
          <CandidatesList 
            candidates={[]}
            statistics={{ 
              total: 0, 
              contacted: 0, 
              recruited: 0, 
              pending: 0,
              available: 0,
              notAvailable: 0,
              present: 0,
              absent: 0
            }}
            metiers={[]}
          />
        </main>
      </div>
    )
  }
}