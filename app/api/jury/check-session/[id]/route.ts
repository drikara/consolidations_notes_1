// app/api/jury/check-session/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canJuryMemberAccessCandidate, canJuryEvaluate } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  try {
    const candidateId = parseInt(params.candidateId)

    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { juryMember: true }
    })

    if (!user || !user.juryMember) {
      return NextResponse.json({ error: 'Jury non trouvé' }, { status: 404 })
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        session: true
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidat non trouvé' }, { status: 404 })
    }

    // Vérifier les permissions
    if (!canJuryMemberAccessCandidate(user.juryMember, candidate)) {
      return NextResponse.json({ 
        canEvaluate: false,
        sessionStatus: candidate.session?.status || 'NO_SESSION',
        message: 'Vous n\'avez pas accès à ce candidat'
      })
    }

    if (!candidate.session) {
      return NextResponse.json({ 
        canEvaluate: false,
        sessionStatus: 'NO_SESSION',
        message: 'Ce candidat n\'est pas associé à une session'
      })
    }

    const canEvaluate = canJuryEvaluate(candidate.session)

    return NextResponse.json({
      canEvaluate: canEvaluate,
      sessionStatus: candidate.session.status,
      sessionDate: candidate.session.date,
      message: canEvaluate 
        ? 'Session active - Évaluation autorisée' 
        : 'Session non active - Évaluation non autorisée'
    })

  } catch (error) {
    console.error('Error checking session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}