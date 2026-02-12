import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { DashboardHeader } from '@/components/dashboard-header'
import { SessionDetails } from '@/components/session-details'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/auth/login')
  }

  const userRole = (session.user as any).role || 'JURY'

  const recruitmentSession = await prisma.recruitmentSession.findUnique({
    where: { id },
    include: {
      candidates: {
        include: {
          scores: true,
          faceToFaceScores: {
            include: {
              juryMember: {
                select: {
                  fullName: true,
                  roleType: true,
                },
              },
            },
          },
        },
      },
      juryPresences: {
        include: {
          juryMember: {
            select: {
              id: true,
              fullName: true,
              roleType: true,
              specialite: true,
            },
          },
        },
      },
      _count: {
        select: {
          candidates: true,
          juryPresences: true,
        },
      },
    },
  })

  if (!recruitmentSession) {
    redirect('/wfm/sessions')
  }

  let availableJuryMembers: any[] = []
  if (userRole === 'WFM') {
    availableJuryMembers = await prisma.juryMember.findMany({
      select: {
        id: true,
        fullName: true,
        roleType: true,
        specialite: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    })
  }

  const sessionWithFullNames = {
    ...recruitmentSession,
    candidates: recruitmentSession.candidates.map((candidate) => ({
      ...candidate,
      fullName: `${candidate.prenom} ${candidate.nom}`,
      email: candidate.email || '',
      phone: candidate.phone,
      scores: candidate.scores
        ? {
            finalDecision: candidate.scores.finalDecision,
            callStatus: candidate.scores.statut,
          }
        : null,
      faceToFaceScores: candidate.faceToFaceScores.map((ffs) => ({
        juryMember: ffs.juryMember,
        phase: ffs.phase,
        score: ffs.score,
      })),
    })),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ✅ SUPPRESSION DE LA PROP 'role' */}
      <DashboardHeader user={session.user} />

      <main className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Link
            href="/wfm/sessions"
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux sessions
          </Link>
        </div>

        <SessionDetails session={sessionWithFullNames} availableJuryMembers={availableJuryMembers} />
      </main>

      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}