// app/wfm/sessions/[id]/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { SessionDetails } from "@/components/session-details"
import Link from "next/link"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params
  
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/auth/login")
  }

  const userRole = (session.user as any).role || "JURY"

  // Récupérer les détails de la session avec toutes les relations
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
                  roleType: true
                }
              }
            }
          }
        }
      },
      juryPresences: {
        include: {
          juryMember: {
            select: {
              id: true,
              fullName: true,
              roleType: true,
              specialite: true
            }
          }
        }
      },
      _count: {
        select: {
          candidates: true,
          juryPresences: true
        }
      }
    }
  })

  if (!recruitmentSession) {
    redirect("/wfm/sessions")
  }

  // Récupérer tous les membres du jury disponibles (pour WFM)
  let availableJuryMembers: any[] = []
  if (userRole === "WFM") {
    availableJuryMembers = await prisma.juryMember.findMany({
      select: {
        id: true,
        fullName: true,
        roleType: true,
        specialite: true
      },
      orderBy: {
        fullName: 'asc'
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardHeader 
        user={session.user} 
        role={userRole}
      />
      
      <main className="container mx-auto p-6 max-w-7xl">
        {/* Breadcrumb */}
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

        {/* Composant de détails */}
        <SessionDetails 
          session={recruitmentSession} 
          availableJuryMembers={availableJuryMembers}
        />
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-6 text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} Orange Côte d'Ivoire. Developed by okd_dev. All rights reserved.
        </div>
      </footer>
    </div>
  )
}