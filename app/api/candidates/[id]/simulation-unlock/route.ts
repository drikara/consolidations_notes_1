

//  api/candidates/[id]/simulation-unlock/route.ts


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkSimulationUnlockStatus } from '@/lib/simulation-unlock'
import { Metier } from '@prisma/client'

/**
 *  API Route pour vérifier le déblocage de la simulation (Phase 2)
 * 
 * Cette route fait simplement appel à la fonction checkSimulationUnlockStatus
 * du fichier lib/simulation-unlock.ts qui contient toute la logique.
 * 
 * IMPORTANT : La logique métier est centralisée dans lib/simulation-unlock.ts
 * pour éviter toute duplication ou incohérence.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const candidateId = parseInt(id)

    if (isNaN(candidateId)) {
      return NextResponse.json(
        { error: 'ID candidat invalide' },
        { status: 400 }
      )
    }

    // Récupérer le candidat pour obtenir son métier
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { metier: true }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidat non trouvé' },
        { status: 404 }
      )
    }

    // ⭐ Appeler la fonction centralisée qui contient la BONNE logique
    const unlockStatus = await checkSimulationUnlockStatus(
      candidateId,
      candidate.metier as Metier
    )

    console.log(`🔓 [API] Résultat déblocage simulation pour candidat ${candidateId}:`, {
      unlocked: unlockStatus.unlocked,
      allJurysEvaluated: unlockStatus.conditions.allJurysEvaluatedPhase1,
      allAveragesAboveThreshold: unlockStatus.conditions.allAveragesAboveThreshold,
      missingConditions: unlockStatus.missingConditions
    })

    return NextResponse.json(unlockStatus)

  } catch (error) {
    console.error('❌ [API] Erreur vérification déblocage simulation:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la vérification du déblocage',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}