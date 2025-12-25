//  app/api/sessions/[id]/jury/route.ts 

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AuditService, getRequestInfo } from '@/lib/audit-service'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Récupérer les jurys assignés à une session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || session.user.role !== 'WFM') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { id } = await params
    console.log('📖 GET /api/sessions/[id]/jury - Session ID:', id)

    const juryPresences = await prisma.juryPresence.findMany({
      where: { sessionId: id },
      include: {
        juryMember: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('✅ Jurys assignés trouvés:', juryPresences.length)
    return NextResponse.json(juryPresences)

  } catch (error) {
    console.error('❌ Error fetching session jury:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Assigner un ou plusieurs jurys à une session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || session.user.role !== 'WFM') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const requestInfo = getRequestInfo(request)
    const { id } = await params
    const body = await request.json()
    
    // ✅ Accepter les deux formats : juryMemberId (single) ou juryMemberIds (array)
    let juryMemberIds: number[]
    
    if (body.juryMemberId) {
      juryMemberIds = [body.juryMemberId]
      console.log('📝 Format single ID détecté:', body.juryMemberId)
    } else if (body.juryMemberIds) {
      juryMemberIds = body.juryMemberIds
      console.log('📝 Format array IDs détecté:', body.juryMemberIds)
    } else {
      return NextResponse.json({ 
        error: 'Paramètre juryMemberId ou juryMemberIds requis' 
      }, { status: 400 })
    }

    console.log('📝 POST /api/sessions/[id]/jury - Session ID:', id)
    console.log('📝 Jury IDs à assigner:', juryMemberIds)

    if (!Array.isArray(juryMemberIds) || juryMemberIds.length === 0) {
      return NextResponse.json({ 
        error: 'Au moins un jury doit être sélectionné' 
      }, { status: 400 })
    }

    // Vérifier que la session existe
    const recruitmentSession = await prisma.recruitmentSession.findUnique({
      where: { id }
    })

    if (!recruitmentSession) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    console.log('✅ Session trouvée:', recruitmentSession.metier, recruitmentSession.date)

    // Vérifier que tous les jurys existent
    const juryMembers = await prisma.juryMember.findMany({
      where: {
        id: { in: juryMemberIds },
        isActive: true
      }
    })

    if (juryMembers.length !== juryMemberIds.length) {
      return NextResponse.json({ 
        error: 'Certains jurys sont invalides ou inactifs' 
      }, { status: 400 })
    }

    console.log('✅ Jurys validés:', juryMembers.map(j => j.fullName).join(', '))

    // Créer les assignations (upsert pour éviter les doublons)
    const assignations = []
    
    for (const juryMemberId of juryMemberIds) {
      try {
        const presence = await prisma.juryPresence.upsert({
          where: {
            juryMemberId_sessionId: {
              juryMemberId: juryMemberId,
              sessionId: id
            }
          },
          update: {
            wasPresent: body.wasPresent ?? true,
            absenceReason: body.wasPresent === false ? body.absenceReason : null,
            updatedAt: new Date()
          },
          create: {
            juryMemberId: juryMemberId,
            sessionId: id,
            wasPresent: body.wasPresent ?? true,
            absenceReason: body.wasPresent === false ? body.absenceReason : null
          },
          include: {
            juryMember: {
              select: {
                fullName: true,
                roleType: true,
                specialite: true
              }
            }
          }
        })

        assignations.push(presence)
        console.log('✅ Jury assigné:', presence.juryMember.fullName)

        // 🆕 ENREGISTRER L'AUDIT POUR CHAQUE ASSIGNATION
        await AuditService.log({
          userId: session.user.id,
          userName: session.user.name || 'Utilisateur WFM',
          userEmail: session.user.email,
          action: 'ASSIGN',
          entity: 'JURY_MEMBER',
          entityId: juryMemberId.toString(),
          description: `Attribution de ${presence.juryMember.fullName} à la session ${recruitmentSession.metier} du ${new Date(recruitmentSession.date).toLocaleDateString('fr-FR')}`,
          metadata: {
            sessionId: id,
            sessionMetier: recruitmentSession.metier,
            juryMemberId: juryMemberId,
            juryMemberName: presence.juryMember.fullName,
            roleType: presence.juryMember.roleType
          },
          ...requestInfo
        })

      } catch (error) {
        console.error('❌ Erreur assignation jury:', juryMemberId, error)
      }
    }

    console.log('✅ Total assignations créées:', assignations.length)

    return NextResponse.json({ 
      message: `${assignations.length} jury(s) assigné(s) avec succès`,
      assignations 
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error assigning jury to session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Retirer un jury d'une session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || session.user.role !== 'WFM') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const requestInfo = getRequestInfo(request)
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const juryMemberId = searchParams.get('juryMemberId')

    if (!juryMemberId) {
      return NextResponse.json({ 
        error: 'ID du jury manquant' 
      }, { status: 400 })
    }

    console.log('🗑️ DELETE /api/sessions/[id]/jury - Session:', id, 'Jury:', juryMemberId)

    // Récupérer les infos avant suppression pour l'audit
    const presence = await prisma.juryPresence.findFirst({
      where: {
        sessionId: id,
        juryMemberId: parseInt(juryMemberId)
      },
      include: {
        juryMember: {
          select: {
            fullName: true,
            roleType: true
          }
        },
        session: {
          select: {
            metier: true,
            date: true
          }
        }
      }
    })

    const deleted = await prisma.juryPresence.deleteMany({
      where: {
        sessionId: id,
        juryMemberId: parseInt(juryMemberId)
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json({ 
        error: 'Assignation non trouvée' 
      }, { status: 404 })
    }

    console.log('✅ Jury retiré de la session')

    // 🆕 ENREGISTRER L'AUDIT
    if (presence) {
      await AuditService.log({
        userId: session.user.id,
        userName: session.user.name || 'Utilisateur WFM',
        userEmail: session.user.email,
        action: 'UNASSIGN',
        entity: 'JURY_MEMBER',
        entityId: juryMemberId,
        description: `Retrait de ${presence.juryMember.fullName} de la session ${presence.session.metier} du ${new Date(presence.session.date).toLocaleDateString('fr-FR')}`,
        metadata: {
          sessionId: id,
          sessionMetier: presence.session.metier,
          juryMemberId: parseInt(juryMemberId),
          juryMemberName: presence.juryMember.fullName
        },
        ...requestInfo
      })
    }

    return NextResponse.json({ 
      message: 'Jury retiré avec succès',
      deleted: deleted.count 
    })

  } catch (error) {
    console.error('❌ Error removing jury from session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}