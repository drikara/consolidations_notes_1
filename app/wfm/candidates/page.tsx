// app/wfm/candidates/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidatesList } from "@/components/candidates-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { transformPrismaData } from "@/lib/utils"

// ⭐ AJOUT: Interface pour les données transformées
interface TransformedCandidate {
  id: number
  fullName: string
  phone: string
  email: string
  metier: string
  age: number
  location: string
  availability: string
  interviewDate: Date | null
  diploma: string
  institution: string
  createdAt: Date
  birthDate: Date
  smsSentDate: Date | null
  session: {
    metier: string
    date: Date
    jour: string
  } | null
  scores: {
    callStatus?: string | null
    finalDecision?: string | null
    callAttempts?: number | null
    lastCallDate?: Date | null
    voiceQuality?: number | null
    verbalCommunication?: number | null
    psychotechnicalTest?: number | null
    typingSpeed?: number | null
    typingAccuracy?: number | null
    excelTest?: number | null
    dictation?: number | null
    salesSimulation?: number | null
    analysisExercise?: number | null
    phase1Decision?: string | null
    phase2FfDecision?: string | null
  } | null
  faceToFaceScores: Array<{
    score: number
    phase: number
  }>
}

export default async function CandidatesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  // Vérification du rôle
  const userRole = (session.user as any).role || "JURY"
  if (userRole !== "WFM") {
    redirect("/auth/login")
  }

  // Préparer les données user
  const userData = {
    name: session.user.name,
    email: session.user.email,
    role: (session.user as any).role || undefined
  }

  // Récupérer les candidats
  const candidates = await prisma.candidate.findMany({
    include: {
      session: {
        select: {
          metier: true,
          date: true,
          jour: true
        }
      },
      scores: true,
      faceToFaceScores: {
        select: {
          score: true,
          phase: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // ⭐ TRANSFORMATION DES DONNÉES PRISMA
  const transformedCandidates = transformPrismaData(candidates) as TransformedCandidate[]

  // ⭐ CORRECTION: Ajout des types pour les paramètres de filter
  const totalCandidates = transformedCandidates.length
  const contactedCandidates = transformedCandidates.filter((c: TransformedCandidate) => 
    c.scores?.callStatus && c.scores.callStatus !== 'NON_CONTACTE'
  ).length
  const recruitedCandidates = transformedCandidates.filter((c: TransformedCandidate) => 
    c.scores?.finalDecision === 'RECRUTE'
  ).length

  // ⭐ CORRECTION: Ajout du type pour le paramètre candidate
  const formattedCandidates = transformedCandidates.map((candidate: TransformedCandidate) => {
    const phase1Scores = candidate.faceToFaceScores.filter((s: any) => s.phase === 1)
    const phase2Scores = candidate.faceToFaceScores.filter((s: any) => s.phase === 2)
    
    const avgPhase1 = phase1Scores.length > 0 
      ? phase1Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase1Scores.length 
      : undefined
    
    const avgPhase2 = phase2Scores.length > 0 
      ? phase2Scores.reduce((sum: number, s: any) => sum + Number(s.score), 0) / phase2Scores.length 
      : undefined

    return {
      id: candidate.id,
      full_name: candidate.fullName,
      phone: candidate.phone,
      email: candidate.email,
      metier: candidate.metier,
      age: candidate.age,
      location: candidate.location,
      availability: candidate.availability,
      interview_date: candidate.interviewDate ? candidate.interviewDate.toISOString().split('T')[0] : undefined,
      diploma: candidate.diploma,
      institution: candidate.institution,
      created_at: candidate.createdAt.toISOString(),
      birth_date: candidate.birthDate.toISOString().split('T')[0],
      sms_sent_date: candidate.smsSentDate ? candidate.smsSentDate.toISOString().split('T')[0] : undefined,
      // Scores et décisions
      final_decision: candidate.scores?.finalDecision || undefined,
      call_status: candidate.scores?.callStatus || 'NON_CONTACTE',
      call_attempts: candidate.scores?.callAttempts || 0,
      last_call_date: candidate.scores?.lastCallDate ? candidate.scores.lastCallDate.toISOString().split('T')[0] : undefined,
      // Session
      session: candidate.session,
      // Moyennes face à face
      avg_phase1: avgPhase1,
      avg_phase2: avgPhase2,
      // Statut d'évaluation
      evaluation_status: candidate.faceToFaceScores.length > 0 ? 'evaluated' : 'pending',
      // Scores maintenant transformés en numbers
      scores: candidate.scores ? {
        voice_quality: candidate.scores.voiceQuality || undefined,
        verbal_communication: candidate.scores.verbalCommunication || undefined,
        psychotechnical_test: candidate.scores.psychotechnicalTest || undefined,
        typing_speed: candidate.scores.typingSpeed || undefined,
        typing_accuracy: candidate.scores.typingAccuracy || undefined,
        excel_test: candidate.scores.excelTest || undefined,
        dictation: candidate.scores.dictation || undefined,
        sales_simulation: candidate.scores.salesSimulation || undefined,
        analysis_exercise: candidate.scores.analysisExercise || undefined,
        phase1_decision: candidate.scores.phase1Decision || undefined,
        phase2_ff_decision: candidate.scores.phase2FfDecision || undefined,
      } : undefined
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={userData} role={userRole} />
      <main className="container mx-auto p-6 space-y-6">
        {/* En-tête avec statistiques */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Candidats</h1>
            <p className="text-muted-foreground mt-1">
              {totalCandidates} candidat(s) enregistré(s) dans le système
            </p>
          </div>
          <Link href="/wfm/candidates/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau Candidat
            </Button>
          </Link>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalCandidates}</div>
            <div className="text-sm text-muted-foreground">Total Candidats</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{contactedCandidates}</div>
            <div className="text-sm text-muted-foreground">Contactés</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{recruitedCandidates}</div>
            <div className="text-sm text-muted-foreground">Recrutés</div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex flex-wrap gap-2">
          <Link href="/wfm/candidates/export">
            <Button variant="outline" size="sm" className="border-border hover:bg-muted">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter
            </Button>
          </Link>
          <Link href="/wfm/sessions">
            <Button variant="outline" size="sm" className="border-border hover:bg-muted">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Voir les Sessions
            </Button>
          </Link>
          <Link href="/wfm/scores">
            <Button variant="outline" size="sm" className="border-border hover:bg-muted">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Gérer les Notes
            </Button>
          </Link>
        </div>

        {/* Liste des candidats */}
        <CandidatesList candidates={formattedCandidates} />

        {/* Informations de gestion */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Gestion des Candidats</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Actions disponibles</h4>
              <ul className="space-y-1">
                <li>• <strong>Modifier</strong> : Mettre à jour les informations d'un candidat</li>
                <li>• <strong>Supprimer</strong> : Retirer un candidat du système</li>
                <li>• <strong>Suivi d'appel</strong> : Mettre à jour le statut de contact</li>
                <li>• <strong>Évaluations</strong> : Consulter les notes des jurys</li>
                <li>• <strong>Consolidation</strong> : Calculer la décision finale</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Statuts de candidature</h4>
              <ul className="space-y-1">
                <li>• <span className="text-yellow-600 font-medium">En attente</span> : Non contacté</li>
                <li>• <span className="text-blue-600 font-medium">En cours</span> : Contacté/En évaluation</li>
                <li>• <span className="text-green-600 font-medium">Recruté</span> : Candidat accepté</li>
                <li>• <span className="text-red-600 font-medium">Non retenu</span> : Candidat refusé</li>
              </ul>
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