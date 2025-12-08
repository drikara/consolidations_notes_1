// app/api/candidates/[id]/statut/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Status } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user as any).role !== "WFM") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const candidateId = parseInt(id)
    
    const body = await request.json()
    const { statut, commentaire } = body

    // ✅ Validation du statut
    if (!statut || !Object.values(Status).includes(statut as Status)) {
      return NextResponse.json(
        { error: 'Le statut doit être ABSENT ou PRESENT' },
        { status: 400 }
      )
    }

    // ✅ Validation : Si ABSENT, le commentaire est obligatoire
    if (statut === 'ABSENT' && (!commentaire || commentaire.trim() === '')) {
      return NextResponse.json(
        { error: 'Un commentaire est obligatoire pour justifier une absence' },
        { status: 400 }
      )
    }

    // Vérifier si le candidat existe
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidat non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour ou créer le score avec le statut
    const updatedScore = await prisma.score.upsert({
      where: { candidateId },
      update: {
        call_status: statut as Status,
        statusComment: commentaire || null,
      },
      create: {
        candidateId,
        call_status: statut as Status,
        statusComment: commentaire || null,
      },
    })

    // ✅ RÈGLE MÉTIER : Si le candidat n'est pas disponible, il est automatiquement non recruté
    if (candidate.availability === 'NON') {
      await prisma.score.update({
        where: { candidateId },
        data: {
          finalDecision: 'NON_RECRUTE'
        }
      })
    }

    return NextResponse.json(
      { score: updatedScore, message: 'Statut mis à jour avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating statut:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    )
  }
}