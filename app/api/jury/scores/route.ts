//app/api/jury/scores/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      candidate_id,
      presentation_visuelle,
      verbal_communication,
      voice_quality,
      score,
      comments
    } = body

    console.log('Données reçues:', {
      candidate_id,
      presentation_visuelle,
      verbal_communication,
      voice_quality,
      score,
      comments
    })

    // Vérifier que le jury membre existe
    const juryMember = await prisma.juryMember.findFirst({
      where: { userId: session.user.id }
    })

    if (!juryMember) {
      return NextResponse.json({ error: 'Membre du jury non trouvé' }, { status: 403 })
    }

    console.log('Jury member trouvé:', juryMember.id)

    // Vérifier les permissions d'accès au candidat
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidate_id },
      include: { session: true }
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidat non trouvé' }, { status: 404 })
    }

    console.log('Candidat trouvé:', candidate.fullName)

    // Vérifier si la session est active
    if (!candidate.session || !['PLANIFIED', 'IN_PROGRESS'].includes(candidate.session.status)) {
      return NextResponse.json({ error: 'La session de recrutement n\'est pas active' }, { status: 400 })
    }

    console.log('Session active vérifiée')

    // Vérifier si le jury peut évaluer ce candidat
    if (juryMember.roleType === 'REPRESENTANT_METIER' && juryMember.specialite !== candidate.metier) {
      return NextResponse.json({ 
        error: 'Vous ne pouvez évaluer que les candidats de votre métier' 
      }, { status: 403 })
    }

    console.log('Permissions vérifiées')

    // Phase 1 pour tous les jurys (fixe)
    const phase = 1

    // Créer ou mettre à jour le score
    const existingScore = await prisma.faceToFaceScore.findFirst({
      where: {
        candidateId: candidate_id,
        juryMemberId: juryMember.id,
        phase: phase
      }
    })

    console.log('Recherche score existant:', existingScore ? 'trouvé' : 'non trouvé')

    let result
    if (existingScore) {
      console.log('Mise à jour du score existant')
      result = await prisma.faceToFaceScore.update({
        where: { id: existingScore.id },
        data: {
          presentationVisuelle: presentation_visuelle,
          verbalCommunication: verbal_communication,
          voiceQuality: voice_quality,
          score: score,
          comments: comments,
          evaluatedAt: new Date()
        }
      })
      console.log('Score mis à jour:', result.id)
      return NextResponse.json({ 
        action: 'updated',
        score: result 
      })
    } else {
      console.log('Création nouveau score')
      result = await prisma.faceToFaceScore.create({
        data: {
          candidateId: candidate_id,
          juryMemberId: juryMember.id,
          phase: phase, // CHAMP OBLIGATOIRE AJOUTÉ
          presentationVisuelle: presentation_visuelle,
          verbalCommunication: verbal_communication,
          voiceQuality: voice_quality,
          score: score,
          comments: comments
        }
      })
      console.log('Nouveau score créé:', result.id)
      return NextResponse.json({ 
        action: 'created',
        score: result 
      })
    }

  } catch (error) {
    console.error('Error saving jury score:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}