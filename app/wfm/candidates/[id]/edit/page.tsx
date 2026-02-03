// app/wfm/candidates/[id]/edit/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidateEditForm } from "@/components/candidate-edit-form"

interface CandidateEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CandidateEditPage({ params }: CandidateEditPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  const userRole = (session.user as any).role || "JURY"
  if (userRole !== "WFM") {
    redirect("/auth/login")
  }

  const { id } = await params

  const candidate = await prisma.candidate.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      nom: true,
      prenom: true,
      phone: true,
      birthDate: true,
      age: true,
      diploma: true,
      niveauEtudes: true,
      institution: true,
      email: true,
      location: true,
      smsSentDate: true,
      availability: true,
      interviewDate: true,
      metier: true,
      sessionId: true,
      notes: true,
    },
  })

  if (!candidate) {
    redirect("/wfm/candidates")
  }

  const sessions = await prisma.recruitmentSession.findMany({
    where: {
      OR: [
        { status: 'PLANIFIED' },
        { status: 'IN_PROGRESS' }
      ]
    },
    select: {
      id: true,
      metier: true,
      date: true,
      jour: true,
      status: true,
      description: true,
      location: true
    },
    orderBy: {
      date: 'asc'
    }
  })

  // CORRECTION: Sérialiser les dates en strings et gérer null/undefined
  const formattedCandidate = {
    id: candidate.id,
    nom: candidate.nom,
    prenom: candidate.prenom,
    phone: candidate.phone,
    birth_date: candidate.birthDate.toISOString().split('T')[0],
    age: candidate.age,
    diploma: candidate.diploma,
    niveau_etudes: candidate.niveauEtudes,
    institution: candidate.institution,
    email: candidate.email ?? undefined,
    location: candidate.location,
    sms_sent_date: candidate.smsSentDate ? candidate.smsSentDate.toISOString().split('T')[0] : '',
    availability: candidate.availability,
    interview_date: candidate.interviewDate ? candidate.interviewDate.toISOString().split('T')[0] : '',
    metier: candidate.metier,
    session_id: candidate.sessionId ? candidate.sessionId.toString() : 'none', // ⭐ Convertir en string
    notes: candidate.notes ?? undefined,
  }

  // CORRECTION: Sérialiser les sessions (convertir Date en string)
  const serializedSessions = sessions.map(session => ({
    id: session.id.toString(), // ⭐ Convertir l'ID en string pour cohérence
    metier: session.metier,
    date: session.date.toISOString(),
    jour: session.jour,
    status: session.status,
    description: session.description,
    location: session.location
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ⭐ CORRECTION: Retirer la prop role */}
      <DashboardHeader user={session.user} />
      
      <main className="container mx-auto p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Modifier le Candidat: {candidate.nom} {candidate.prenom}
          </h1>
          <p className="text-gray-600 mt-2">
            Modifier les informations du candidat dans le système de recrutement
          </p>
        </div>

        <CandidateEditForm 
          candidate={formattedCandidate} 
          sessions={serializedSessions} 
        />
      </main>
    </div>
  )
}