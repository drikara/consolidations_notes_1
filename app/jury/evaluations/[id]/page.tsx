// app/jury/evaluations/[id]/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { JuryEvaluationForm } from "@/components/jury-evaluation-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  ArrowLeft, 
  User, 
  Briefcase, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Mail, 
  Phone,
  Building2
} from 'lucide-react'
import { canJuryMemberAccessCandidate, isSessionActive } from "@/lib/permissions"

export default async function JuryEvaluationPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  const userRole = (session.user as any).role || "JURY"
  if (userRole !== "JURY") {
    redirect("/auth/login")
  }

  const juryMember = await prisma.juryMember.findFirst({
    where: { userId: session.user.id }
  })

  if (!juryMember) {
    redirect("/jury/dashboard")
  }

  const candidateId = parseInt(id)
  
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      session: true,
      scores: true,
      faceToFaceScores: {
        where: { 
          juryMemberId: juryMember.id
        },
        orderBy: { 
          evaluatedAt: 'desc' 
        },
        take: 1
      }
    }
  })

  if (!candidate) {
    redirect("/jury/evaluations")
  }

  if (!canJuryMemberAccessCandidate(juryMember, candidate)) {
    redirect("/jury/evaluations")
  }

  if (!candidate.session || !isSessionActive(candidate.session)) {
    redirect("/jury/evaluations")
  }

  const existingScore = candidate.faceToFaceScores[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardHeader user={session.user} role="JURY" />
      
      <main className="container mx-auto p-6 space-y-6">
        <Link href="/jury/evaluations">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour aux évaluations
          </Button>
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{candidate.fullName}</h1>
              <p className="text-gray-600 mt-1">Évaluation Face-à-Face - {candidate.metier}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 text-gray-700">
              <Briefcase className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Métier</p>
                <p className="font-semibold">{candidate.metier}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Âge</p>
                <p className="font-semibold">{candidate.age} ans</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <GraduationCap className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Diplôme</p>
                <p className="font-semibold">{candidate.diploma}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Building2 className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Institution</p>
                <p className="font-semibold text-sm">{candidate.institution}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-semibold text-sm">{candidate.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Phone className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-500">Téléphone</p>
                <p className="font-semibold">{candidate.phone}</p>
              </div>
            </div>
          </div>

          {/* Indicateur de phase */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-semibold text-orange-800">Évaluation Face-à-Face</p>
                <p className="text-sm text-orange-700">
                  Évaluation du comportement, communication et présentation du candidat
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {existingScore ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}
          </h2>
          
          {existingScore && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-700">
                <strong>Note :</strong> Vous avez déjà évalué ce candidat. 
                Vous pouvez modifier votre évaluation ci-dessous.
              </p>
            </div>
          )}

          <JuryEvaluationForm 
            candidateId={candidate.id}
            candidateName={candidate.fullName}
            existingScore={existingScore ? {
              presentationVisuelle: existingScore.presentationVisuelle ? Number(existingScore.presentationVisuelle) : undefined,
              verbalCommunication: existingScore.verbalCommunication ? Number(existingScore.verbalCommunication) : undefined,
              voiceQuality: existingScore.voiceQuality ? Number(existingScore.voiceQuality) : undefined,
              score: Number(existingScore.score),
              comments: existingScore.comments || undefined
            } : undefined}
          />
        </div>

        {/* Affichage de l'évaluation existante */}
        {existingScore && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Votre évaluation actuelle</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">Présentation visuelle</p>
                <p className="text-2xl font-bold text-gray-800">
                  {Number(existingScore.presentationVisuelle).toFixed(1)} / 5
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">Qualité de la voix</p>
                <p className="text-2xl font-bold text-gray-800">
                  {Number(existingScore.voiceQuality).toFixed(1)} / 5
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2">Communication verbale</p>
                <p className="text-2xl font-bold text-gray-800">
                  {Number(existingScore.verbalCommunication).toFixed(1)} / 5
                </p>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 mb-2 font-semibold">Score moyen</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Number(existingScore.score).toFixed(2)} / 5
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-600 mb-2 font-semibold">Décision</p>
                  <p className={`text-xl font-bold ${
                    Number(existingScore.score) >= 3 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Number(existingScore.score) >= 3 ? '✅ FAVORABLE' : '❌ DÉFAVORABLE'}
                  </p>
                </div>
              </div>
            </div>

            {existingScore.comments && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-2 font-semibold">Commentaires</p>
                <p className="text-gray-700">{existingScore.comments}</p>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4">
              Évalué le {new Date(existingScore.evaluatedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}