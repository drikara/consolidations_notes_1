// app/wfm/candidates/[id]/consolidation/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { TechnicalTestsForm } from "@/components/technical-tests-form"
import { ConsolidationResult } from "@/components/consolidation-result"
import { ConsolidationActions } from "@/components/consolidation-actions"
import { transformPrismaData } from "@/lib/server-utils" // ⭐ CHANGEMENT ICI
import { consolidateCandidate, ConsolidationResultData } from "@/lib/consolidation"
import { Metier } from "@prisma/client"

export default async function CandidateConsolidationPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session || (session.user as any).role !== "WFM") {
    redirect("/auth/login")
  }

  // Récupération des données avec Prisma
  const candidate = await prisma.candidate.findUnique({
    where: { id: parseInt(id) },
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
    }
  })

  if (!candidate) {
    redirect("/wfm/candidates")
  }

  // Transformation des données Prisma (convertit les Decimal en number)
  const transformedCandidate = transformPrismaData(candidate)

  // Consolidation des résultats - les données sont maintenant des numbers
  const consolidation: ConsolidationResultData = consolidateCandidate(
    candidate.metier as Metier, 
    {
      faceToFaceScores: transformedCandidate.faceToFaceScores.map((score: any) => ({
        score: score.score,
        presentationVisuelle: score.presentationVisuelle,
        verbalCommunication: score.verbalCommunication,
        voiceQuality: score.voiceQuality
      })),
      typingSpeed: transformedCandidate.scores?.typingSpeed || null,
      typingAccuracy: transformedCandidate.scores?.typingAccuracy || null,
      excel: transformedCandidate.scores?.excelTest || null,
      dictation: transformedCandidate.scores?.dictation || null,
      salesSimulation: transformedCandidate.scores?.salesSimulation || null,
      psychotechnical: transformedCandidate.scores?.psychotechnicalTest || null,
      analysisExercise: transformedCandidate.scores?.analysisExercise || null
    }
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Consolidation - {transformedCandidate.fullName}</h1>
          <p className="text-muted-foreground">
            {transformedCandidate.metier} • {transformedCandidate.email}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tests Techniques (WFM uniquement) */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Tests Techniques</h2>
              <TechnicalTestsForm 
                candidateId={transformedCandidate.id}
                existingScores={transformedCandidate.scores}
              />
            </div>
          </div>

          {/* Résultats et Consolidation */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Résultats Face à Face</h2>
              <ConsolidationResult 
                candidate={transformedCandidate}
                faceToFaceScores={transformedCandidate.faceToFaceScores}
                technicalScores={transformedCandidate.scores}
                consolidation={consolidation}
              />
            </div>

            {/* Décision Finale */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Décision Finale</h2>
              <ConsolidationActions 
                candidateId={transformedCandidate.id} 
                consolidationResult={consolidation}
              />
            </div>
          </div>
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