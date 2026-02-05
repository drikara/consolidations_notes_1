import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { RecruitmentStatut } from "@prisma/client"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

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

    console.log('🔧 Mise à jour candidat:', id)
    console.log('📦 Données reçues:', JSON.stringify(body, null, 2))

    // Validation du statutRecrutement
    if (!body.statutRecruitment) {
      console.error('❌ Statut de recrutement manquant')
      return NextResponse.json(
        { error: 'Statut de recrutement est requis' },
        { status: 400 }
      )
    }
    
    const validStatuts: RecruitmentStatut[] = ['STAGE', 'INTERIM', 'CDI', 'CDD', "AUTRE"]
    if (!validStatuts.includes(body.statutRecruitment)) {
      console.error('❌ Statut de recrutement invalide:', body.statutRecruitment)
      return NextResponse.json(
        { error: `Statut de recrutement invalide: ${body.statutRecruitment}` },
        { status: 400 }
      )
    }

    // Validation des dates
    if (!body.smsSentDate || !body.interviewDate) {
      console.error('❌ Dates manquantes')
      return NextResponse.json(
        { error: 'Les dates SMS et entretien sont requises' },
        { status: 400 }
      )
    }

    // Calcul de l'âge
    const birthDateObj = new Date(body.birthDate)
    const today = new Date()
    let age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--
    }

    //  Préparer les données pour Prisma
    const updateData: any = {
      nom: body.nom,
      prenom: body.prenom,
      phone: body.phone,
      birthDate: new Date(body.birthDate),
      age: age,
      diploma: body.diploma,
      niveauEtudes: body.niveauEtudes,
      institution: body.institution,
      email: body.email || null,
      location: body.location,
      smsSentDate: new Date(body.smsSentDate),
      availability: body.availability,
      statutRecruitment: body.statutRecruitment as RecruitmentStatut,
      interviewDate: new Date(body.interviewDate),
      metier: body.metier,
      notes: body.notes || null,
    }

    // ⭐⭐ CORRECTION CRITIQUE : Gestion du sessionId
    console.log('🎯 Gestion du sessionId:', body.sessionId)
    
    if (body.sessionId === null || body.sessionId === undefined || body.sessionId === "none" || body.sessionId === "") {
      updateData.sessionId = null
      console.log('✅ Session définie à null')
    } else {
      // ⭐⭐ CORRECTION : sessionId est déjà une string (UUID), NE PAS utiliser parseInt
      const sessionId = body.sessionId
      
      console.log('🔍 Recherche de la session avec ID:', sessionId)
      
      // Vérifier que la session existe (le ID est un UUID string)
      const sessionExists = await prisma.recruitmentSession.findUnique({
        where: { id: sessionId }
      })
      
      if (!sessionExists) {
        console.error('❌ Session introuvable:', sessionId)
        return NextResponse.json(
          { error: `Session avec l'ID ${sessionId} introuvable` },
          { status: 404 }
        )
      }
      
      updateData.sessionId = sessionId
      console.log('✅ Session trouvée et définie:', sessionId)
    }

    console.log('📝 Données finales pour mise à jour:', JSON.stringify(updateData, null, 2))

    // Vérifier que le candidat existe
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingCandidate) {
      console.error('❌ Candidat introuvable:', id)
      return NextResponse.json(
        { error: 'Candidat introuvable' },
        { status: 404 }
      )
    }

    // Mettre à jour le candidat
    const updatedCandidate = await prisma.candidate.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        session: true,
        scores: true
      }
    })

    console.log('✅ Candidat mis à jour avec succès:', updatedCandidate.id)
    console.log('📊 Informations mises à jour:')
    console.log('   - Session ID:', updatedCandidate.sessionId)
    console.log('   - SMS Date:', updatedCandidate.smsSentDate)
    console.log('   - Interview Date:', updatedCandidate.interviewDate)
    console.log('   - Statut Recrutement:', updatedCandidate.statutRecruitment)

    return NextResponse.json(updatedCandidate)
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error)
    
    // Afficher plus de détails sur l'erreur
    if (error instanceof Error) {
      console.error('❌ Message d\'erreur:', error.message)
      console.error('❌ Stack trace:', error.stack)
      
      // Gérer les erreurs Prisma spécifiques
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Erreur de contrainte de clé étrangère. Vérifiez que la session existe.' },
          { status: 400 }
        )
      }
      
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: 'Candidat non trouvé' },
          { status: 404 }
        )
      }
      
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