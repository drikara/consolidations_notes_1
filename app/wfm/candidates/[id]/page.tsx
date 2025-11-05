// app/wfm/candidates/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import Link from "next/link"
import { transformPrismaDataArray } from "@/lib/utils"

export default async function CandidatesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  const candidates = await prisma.candidate.findMany({
    include: {
      scores: true,
      faceToFaceScores: {
        include: {
          juryMember: {
            select: {
              fullName: true,
              roleType: true,
              specialite: true
            }
          }
        }
      },
      session: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log('Raw candidates from Prisma:', candidates)
  console.log('Number of candidates:', candidates.length)

  // ⭐ CORRECTION: Utilisation sécurisée de transformPrismaDataArray
  const transformedCandidates = transformPrismaDataArray(candidates)

  console.log('Transformed candidates:', transformedCandidates)
  console.log('Is array?', Array.isArray(transformedCandidates))

  // ⭐ CORRECTION: Vérification que c'est bien un tableau avant d'utiliser filter
  if (!Array.isArray(transformedCandidates)) {
    console.error('transformedCandidates is not an array:', transformedCandidates)
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={session.user} role="WFM" />
        <main className="container mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de données</h1>
            <p className="text-gray-600">Les données des candidats ne sont pas disponibles.</p>
          </div>
        </main>
      </div>
    )
  }

  // Calcul des statistiques avec vérification
  const totalCandidates = transformedCandidates.length
  const contactedCandidates = transformedCandidates.filter((c: any) => 
    c?.scores?.callStatus && c.scores.callStatus !== 'NON_CONTACTE'
  ).length
  const recruitedCandidates = transformedCandidates.filter((c: any) => 
    c?.scores?.finalDecision === 'ADMIS'
  ).length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ADMIS': return 'bg-green-100 text-green-800 border border-green-200'
      case 'NON_ADMIS': return 'bg-red-100 text-red-800 border border-red-200'
      case 'CONTACTE': return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'NON_CONTACTE': return 'bg-gray-100 text-gray-800 border border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-7xl">
        {/* En-tête avec statistiques */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des Candidats</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Total Candidats</h3>
              <p className="text-2xl font-bold text-blue-600">{totalCandidates}</p>
            </div>
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Contactés</h3>
              <p className="text-2xl font-bold text-green-600">{contactedCandidates}</p>
            </div>
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">Recrutés</h3>
              <p className="text-2xl font-bold text-purple-600">{recruitedCandidates}</p>
            </div>
          </div>
        </div>

        {/* Liste des candidats */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Liste des Candidats</h2>
            <p className="text-gray-600 mt-1">{totalCandidates} candidat(s) trouvé(s)</p>
          </div>
          
          {transformedCandidates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucun candidat trouvé</p>
            </div>
          ) : (
            <div className="divide-y">
              {transformedCandidates.map((candidate: any) => (
                <div key={candidate.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{candidate.fullName}</h3>
                        {candidate.scores?.finalDecision && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.scores.finalDecision)}`}>
                            {candidate.scores.finalDecision}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-2">{candidate.email} • {candidate.phone}</p>
                      
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">Métier: {candidate.metier}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">Localisation: {candidate.location}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">Âge: {candidate.age} ans</span>
                      </div>

                      {candidate.scores?.callStatus && (
                        <div className="mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(candidate.scores.callStatus)}`}>
                            Statut appel: {candidate.scores.callStatus}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/wfm/candidates/${candidate.id}`}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Détails
                      </Link>
                      <Link
                        href={`/wfm/candidates/${candidate.id}/consolidation`}
                        className="bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Consolidation
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export function generateViewport() {
  return {
    width: "device-width",
    colorScheme: "light",
  }
}