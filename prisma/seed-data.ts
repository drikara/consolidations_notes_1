// prisma/seed-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding des données métier...')
  
  try {
    // Nettoyer seulement les données métier (pas les users)
    await prisma.faceToFaceScore.deleteMany()
    await prisma.score.deleteMany()
    await prisma.juryPresence.deleteMany()
    await prisma.juryMember.deleteMany()
    await prisma.candidate.deleteMany()
    await prisma.recruitmentSession.deleteMany()
    await prisma.exportLog.deleteMany()

    console.log('✅ Nettoyage des données métier terminé')

    // Récupérer l'admin WFM créé manuellement
    const adminUser = await prisma.user.findUnique({
      where: { email: 'wfm1@recruitment.com' }
    })

    const juryUser = await prisma.user.findUnique({
      where: { email: 'drh1@recruitment.com' }
    })

    if (!adminUser || !juryUser) {
      throw new Error('❌ Les utilisateurs doivent être créés manuellement d\'abord')
    }

    // Créer les membres du jury
    console.log('🎯 Création des membres du jury...')
    
    await prisma.juryMember.create({
      data: {
        userId: adminUser.id,
        fullName: 'Admin WFM',
        roleType: 'WFM_JURY',
        specialite: 'CALL_CENTER',
        department: 'Workforce Management',
        phone: '+2250102030405',
      },
    })

    await prisma.juryMember.create({
      data: {
        userId: juryUser.id,
        fullName: 'Jury DRH',
        roleType: 'DRH',
        department: 'Ressources Humaines',
        phone: '+2250506070809',
      },
    })

    console.log('✅ Membres du jury créés')

    // Créer une session de recrutement
    console.log('📅 Création d\'une session...')
    
    const session = await prisma.recruitmentSession.create({
      data: {
        metier: 'CALL_CENTER',
        date: new Date('2024-11-15'),
        jour: 'Vendredi',
        status: 'PLANIFIED',
        description: 'Session de recrutement Call Center Novembre 2024',
        location: 'Siège Social',
      },
    })

    // Créer des candidats
    console.log('👥 Création des candidats...')
    
    await prisma.candidate.create({
      data: {
        fullName: 'Jean Dupont',
        phone: '+2250708091011',
        birthDate: new Date('1995-05-15'),
        age: 29,
        diploma: 'Bac+3 en Commerce',
        institution: 'Université de Cocody',
        email: 'jean.dupont@example.com',
        location: 'Abidjan, Cocody',
        availability: 'Immédiate',
        metier: 'CALL_CENTER',
        sessionId: session.id,
      },
    })

    await prisma.candidate.create({
      data: {
        fullName: 'Marie Koné',
        phone: '+2250102030405',
        birthDate: new Date('1998-08-20'),
        age: 26,
        diploma: 'BTS en Assistance de Direction',
        institution: 'ISTC Polytechnique',
        email: 'marie.kone@example.com',
        location: 'Abidjan, Plateau',
        availability: 'Sous 15 jours',
        metier: 'CALL_CENTER',
        sessionId: session.id,
      },
    })

    console.log('🎉 Données métier créées avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

main()
  .finally(() => prisma.$disconnect())