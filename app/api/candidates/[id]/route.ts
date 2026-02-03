// app/api/candidates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// GET - Récupérer un candidat spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(id) },
      include: {
        session: true,
        // ⭐ CORRECTION 1: Retirer writtenTestScore (n'existe pas dans le schéma)
        faceToFaceScores: {
          include: {
            juryMember: {
              select: {
                id: true,
                fullName: true,
                roleType: true
              }
            }
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidat introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json(candidate)
  } catch (error) {
    console.error('Erreur lors de la récupération du candidat:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un candidat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role
    if (userRole !== 'WFM') {
      return NextResponse.json(
        { error: 'Accès refusé - Réservé aux WFM' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    console.log('📝 Mise à jour candidat:', id)
    console.log('📦 Données reçues:', body)

    // ⭐ Préparer les données pour Prisma
    const updateData: any = {
      nom: body.nom,
      prenom: body.prenom,
      phone: body.phone,
      birthDate: new Date(body.birthDate),
      age: body.age,
      diploma: body.diploma,
      niveauEtudes: body.niveauEtudes,
      institution: body.institution,
      email: body.email || null,
      location: body.location,
      smsSentDate: body.smsSentDate ? new Date(body.smsSentDate) : null,
      availability: body.availability,
      interviewDate: body.interviewDate ? new Date(body.interviewDate) : null,
      metier: body.metier,
      notes: body.notes || null,
    }

    // ⭐ Gérer sessionId séparément pour éviter les erreurs
    if (body.sessionId === null || body.sessionId === undefined) {
      updateData.sessionId = null
      console.log('✅ Session définie à null')
    } else {
      const sessionId = parseInt(body.sessionId)
      
      // ⭐ CORRECTION 2: Convertir sessionId en string pour Prisma
      // Vérifier que la session existe
      const sessionExists = await prisma.recruitmentSession.findUnique({
        where: { id: sessionId.toString() }  // ← Convertir en string
      })
      
      if (!sessionExists) {
        console.error('❌ Session introuvable:', sessionId)
        return NextResponse.json(
          { error: `Session avec l'ID ${sessionId} introuvable` },
          { status: 404 }
        )
      }
      
      updateData.sessionId = sessionId.toString()  // ← Convertir en string
      console.log('✅ Session définie à:', sessionId)
    }

    console.log('📝 Données finales pour mise à jour:', updateData)

    const updatedCandidate = await prisma.candidate.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        session: true
      }
    })

    console.log('✅ Candidat mis à jour avec succès:', updatedCandidate.id)
    console.log('📊 Session associée:', updatedCandidate.sessionId)

    return NextResponse.json(updatedCandidate)
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du candidat' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un candidat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role
    if (userRole !== 'WFM') {
      return NextResponse.json(
        { error: 'Accès refusé - Réservé aux WFM' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Vérifier que le candidat existe
    const candidate = await prisma.candidate.findUnique({
      where: { id: parseInt(id) }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidat introuvable' },
        { status: 404 }
      )
    }

    // Supprimer le candidat (les scores associés seront supprimés automatiquement grâce à onDelete: Cascade)
    await prisma.candidate.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json(
      { message: 'Candidat supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression du candidat:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du candidat' },
      { status: 500 }
    )
  }
}