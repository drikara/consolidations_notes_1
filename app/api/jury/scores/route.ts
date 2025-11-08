// app/api/jury/scores/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { canJuryMemberAccessCandidate, canJuryEvaluate } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { 
      candidate_id, 
      phase, 
      score, 
      comments, 
      presentation_visuelle, 
      verbal_communication, 
      voice_quality 
    } = await request.json()

    if (!candidate_id || !phase || score === undefined) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { juryMember: true }
    })

    if (!user || !user.juryMember) {
      return NextResponse.json({ error: 'Jury non trouvé' }, { status: 404 })
    }

    // Vérifier que le jury peut accéder à ce candidat
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidate_id },
      include: { session: true }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidat non trouvé' }, { status: 404 })
    }

    if (!canJuryMemberAccessCandidate(user.juryMember, candidate)) {
      return NextResponse.json({ error: 'Accès non autorisé à ce candidat' }, { status: 403 })
    }

    if (!canJuryEvaluate(candidate.session)) {
      return NextResponse.json({ error: 'La session n\'est pas ouverte aux évaluations' }, { status: 403 })
    }

    const juryMemberId = user.juryMember.id

    const existingScore = await prisma.faceToFaceScore.findUnique({
      where: {
        candidateId_juryMemberId_phase: {
          candidateId: candidate_id,
          juryMemberId: juryMemberId,
          phase: phase
        }
      }
    })

    const scoreData: any = {
      candidateId: candidate_id,
      juryMemberId: juryMemberId,
      phase: phase,
      score: score,
      comments: comments || null,
    }

    // Ajouter les scores détaillés pour la phase 1
    if (phase === 1) {
      scoreData.presentationVisuelle = presentation_visuelle || null
      scoreData.verbalCommunication = verbal_communication || null
      scoreData.voiceQuality = voice_quality || null
    }

    if (existingScore) {
      await prisma.faceToFaceScore.update({
        where: { id: existingScore.id },
        data: scoreData
      })
    } else {
      await prisma.faceToFaceScore.create({
        data: scoreData
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving jury score:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json({ error: 'ID candidat manquant' }, { status: 400 })
    }

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

    const juryMemberId = user.juryMember.id

    const scores = await prisma.faceToFaceScore.findMany({
      where: {
        candidateId: parseInt(candidateId),
        juryMemberId: juryMemberId
      },
      select: {
        id: true,
        phase: true,
        score: true,
        presentationVisuelle: true,
        verbalCommunication: true,
        voiceQuality: true,
        comments: true,
        evaluatedAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        phase: 'asc'
      }
    })

    const formattedScores = scores.map(score => ({
      id: score.id,
      phase: score.phase,
      score: Number(score.score),
      presentation_visuelle: score.presentationVisuelle ? Number(score.presentationVisuelle) : null,
      verbal_communication: score.verbalCommunication ? Number(score.verbalCommunication) : null,
      voice_quality: score.voiceQuality ? Number(score.voiceQuality) : null,
      comments: score.comments,
      evaluated_at: score.evaluatedAt,
      created_at: score.createdAt,
      updated_at: score.updatedAt
    }))

    return NextResponse.json(formattedScores)
  } catch (error) {
    console.error('Error fetching jury scores:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}