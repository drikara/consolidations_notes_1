import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log("🎯 POST /api/jury/scores - Sauvegarde d'évaluation")
    
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un membre du jury
    const juryMember = await prisma.juryMember.findUnique({
      where: { userId: session.user.id },
    })

    if (!juryMember) {
      return NextResponse.json({ error: "Accès réservé aux membres du jury" }, { status: 403 })
    }

    const data = await request.json()
    console.log("📦 Données score reçues:", data)

    // Validation des données
    if (!data.candidate_id || !data.phase || data.score === undefined) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const score = parseFloat(data.score)
    if (isNaN(score) || score < 0 || score > 5) {
      return NextResponse.json({ error: "Score invalide (doit être entre 0 et 5)" }, { status: 400 })
    }

    if (data.phase !== 1 && data.phase !== 2) {
      return NextResponse.json({ error: "Phase invalide (doit être 1 ou 2)" }, { status: 400 })
    }

    // Vérifier que le candidat existe
    const candidate = await prisma.candidate.findUnique({
      where: { id: data.candidate_id },
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidat non trouvé" }, { status: 404 })
    }

    // Créer ou mettre à jour le score
    const faceToFaceScore = await prisma.faceToFaceScore.upsert({
      where: {
        candidateId_juryMemberId_phase: {
          candidateId: data.candidate_id,
          juryMemberId: juryMember.id,
          phase: data.phase,
        },
      },
      update: {
        score: score,
        comments: data.comments || null,
        evaluatedAt: new Date(),
      },
      create: {
        candidateId: data.candidate_id,
        juryMemberId: juryMember.id,
        phase: data.phase,
        score: score,
        comments: data.comments || null,
      },
    })

    console.log("✅ Score sauvegardé:", faceToFaceScore.id)
    return NextResponse.json(faceToFaceScore)

  } catch (error) {
    console.error("💥 ERREUR dans POST /api/jury/scores:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}