// app/wfm/candidates/[id]/page.tsx
import { CandidateDetails } from "@/components/candidates-details"
import { CallTracking } from "@/components/call-tracking"
import { prisma } from "@/lib/prisma"
import { transformPrismaData } from "@/lib/utils"

interface PageProps {
  params: {
    id: string
  }
}

export default async function CandidateDetailPage({ params }: PageProps) {
  try {
    const candidateId = parseInt(params.id)

    // Récupérer les données du candidat
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        session: true,
        scores: true,
        faceToFaceScores: {
          include: {
            juryMember: true
          }
        }
      }
    })

    if (!candidate) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold">Candidat non trouvé</h1>
          <p>Le candidat avec l'ID {params.id} n'existe pas.</p>
        </div>
      )
    }

    // ⭐ TRANSFORMATION DES DONNÉES PRISMA
    const transformedCandidate = transformPrismaData(candidate)

    return (
      <div className="space-y-6 p-6">
        <CandidateDetails candidate={transformedCandidate} />
        <CallTracking 
          candidateId={transformedCandidate.id}
          currentStatus={transformedCandidate.scores?.callStatus}
          currentAttempts={transformedCandidate.scores?.callAttempts}
          lastCallDate={transformedCandidate.scores?.lastCallDate}
          callNotes={transformedCandidate.scores?.callNotes}
        />
      </div>
    )
  } catch (error) {
    console.error("Error loading candidate:", error)
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Erreur</h1>
        <p>Une erreur est survenue lors du chargement du candidat.</p>
      </div>
    )
  }
}

export function generateViewport() {
  return {
    width: "device-width",
    colorScheme: "light",
  }
}