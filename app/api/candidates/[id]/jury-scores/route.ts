// app/api/candidates/[id]/jury-scores/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Récupérer tous les scores jurys d'un candidat (pour WFM)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || (session.user as any).role !== 'WFM') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params
    const candidateId = parseInt(id)

    if (isNaN(candidateId)) {
      return NextResponse.json({ error: 'ID candidat invalide' }, { status: 400 })
    }

    console.log('📖 GET /api/candidates/[id]/jury-scores - Candidat:', candidateId)

    // Vérifier que le candidat existe
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidat non trouvé' }, { status: 404 })
    }

    // Récupérer tous les scores face-to-face de ce candidat
    const juryScores = await prisma.faceToFaceScore.findMany({
      where: {
        candidateId: candidateId
      },
      include: {
        juryMember: {
          select: {
            id: true,
            fullName: true,
            roleType: true,
            specialite: true
          }
        }
      },
      orderBy: [
        { phase: 'asc' },
        { evaluatedAt: 'asc' }
      ]
    })

    console.log('✅ Scores jurys trouvés:', juryScores.length)

    // 🔍 LOG DÉTAILLÉ pour debug
    console.log('🔍 Scores bruts de la base de données:', juryScores.map(score => ({
      id: score.id,
      juryMember: score.juryMember.fullName,
      phase: score.phase,
      appetenceDigitale: score.appetenceDigitale,
      verbalCommunication: score.verbalCommunication,
      voiceQuality: score.voiceQuality,
      presentationVisuelle: score.presentationVisuelle,
      decision: score.decision
    })))

    // ⭐ CONVERSION DES DECIMAL EN NUMBERS - AVEC APPETENCE DIGITALE
    const formattedScores = juryScores.map(score => ({
      id: score.id,
      phase: score.phase,
      juryMemberId: score.juryMemberId,
      juryMember: score.juryMember,
      // Convertir les Decimal en nombres
      presentationVisuelle: score.presentationVisuelle ? Number(score.presentationVisuelle) : null,
      verbalCommunication: score.verbalCommunication ? Number(score.verbalCommunication) : null,
      voiceQuality: score.voiceQuality ? Number(score.voiceQuality) : null,
      appetenceDigitale: score.appetenceDigitale ? Number(score.appetenceDigitale) : null, // ✅ AJOUT CRITIQUE
      simulationSensNegociation: score.simulationSensNegociation ? Number(score.simulationSensNegociation) : null,
      simulationCapacitePersuasion: score.simulationCapacitePersuasion ? Number(score.simulationCapacitePersuasion) : null,
      simulationSensCombativite: score.simulationSensCombativite ? Number(score.simulationSensCombativite) : null,
      decision: score.decision,
      evaluatedAt: score.evaluatedAt,
      comments: score.comments
    }))

    // 🔍 LOG de vérification après formatage
    console.log('🔍 Scores formatés:', formattedScores.map(score => ({
      id: score.id,
      juryMember: score.juryMember.fullName,
      phase: score.phase,
      appetenceDigitale: score.appetenceDigitale,
      verbalCommunication: score.verbalCommunication,
      voiceQuality: score.voiceQuality,
      decision: score.decision
    })))

    return NextResponse.json(formattedScores)

  } catch (error) {
    console.error('❌ Error fetching jury scores:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}