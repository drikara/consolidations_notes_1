import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard-header"
import { SessionDetails } from "@/components/session-details"

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
  if (userRole !== "WFM") {
    redirect("/auth/login")
  }

  try {
    const recruitmentSession = await prisma.recruitmentSession.findUnique({
      where: { id },
      include: {
        candidates: {
          include: {
            scores: {
              select: {
                finalDecision: true,
                callStatus: true,
              }
            },
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
      console.log(`Session ${id} non trouvée`)
      redirect("/wfm/sessions")
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={session.user} role="WFM" />
        <main className="container mx-auto p-6">
          <SessionDetails session={recruitmentSession} />
        </main>
      </div>
    )
  } catch (error) {
    console.error("Erreur lors du chargement de la session:", error)
    redirect("/wfm/sessions")
  }
}