// app/wfm/candidates/[id]/edit/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidateEditForm } from "@/components/candidate-edit-form"
import { SessionStatus, Metier } from "@prisma/client"

export default async function CandidateEditPage({ 
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

  // Récupérer le candidat avec les données de base
  const candidate = await prisma.candidate.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      fullName: true,
      phone: true,
      birthDate: true,
      age: true,
      diploma: true,
      institution: true,
      email: true,
      location: true,
      smsSentDate: true,
      availability: true,
      interviewDate: true,
      metier: true,
      sessionId: true,
      notes: true
    }
  })

  if (!candidate) {
    redirect("/wfm/candidates")
  }

  // Récupérer les sessions de recrutement disponibles
  const recruitmentSessions = await prisma.recruitmentSession.findMany({
    where: {
      status: SessionStatus.PLANIFIED // Utilisez PLANIFIED au lieu de ACTIVE
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
      date: 'desc'
    }
  })

  // Transformer les données pour le client
  const candidateData = {
    id: candidate.id,
    full_name: candidate.fullName,
    phone: candidate.phone,
    birth_date: candidate.birthDate ? new Date(candidate.birthDate).toISOString().split('T')[0] : '',
    age: candidate.age,
    diploma: candidate.diploma || '',
    institution: candidate.institution || '',
    email: candidate.email,
    location: candidate.location,
    sms_sent_date: candidate.smsSentDate ? new Date(candidate.smsSentDate).toISOString().split('T')[0] : '',
    availability: candidate.availability || '',
    interview_date: candidate.interviewDate ? new Date(candidate.interviewDate).toISOString().split('T')[0] : '',
    metier: candidate.metier,
    session_id: candidate.sessionId || '',
    notes: candidate.notes || ''
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} role="WFM" />
      <main className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Modifier le Candidat</h1>
          <p className="text-muted-foreground">
            Mettez à jour les informations de {candidate.fullName}
          </p>
        </div>

        <CandidateEditForm 
          candidate={candidateData}
          sessions={recruitmentSessions}
        />
      </main>
    </div>
  )
}