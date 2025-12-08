// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')
  
  try {
    console.log('🔍 Vérification de l\'état de la base...')
    
    // Vérifier si les tables existent et ont des données
    const userCount = await prisma.user.count()
    
    if (userCount > 0) {
      console.log('🧹 Nettoyage des données existantes...')
      
      // Supprimer dans l'ordre pour respecter les contraintes de clé étrangère
      await prisma.faceToFaceScore.deleteMany()
      await prisma.score.deleteMany()
      await prisma.juryPresence.deleteMany()
      await prisma.exportLog.deleteMany()
      await prisma.candidate.deleteMany()
      await prisma.juryMember.deleteMany()
      await prisma.recruitmentSession.deleteMany()
      await prisma.account.deleteMany()
      await prisma.session.deleteMany()
      await prisma.verification.deleteMany()
      await prisma.user.deleteMany()
      
      console.log('✅ Nettoyage terminé')
    }

    console.log('👤 Création des utilisateurs...')

    // Configuration de hash compatible avec Better Auth
    const hashOptions = {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    }

    const adminPassword = 'Admin123'
    const juryPassword = 'Jury1234'

    const adminPasswordHash = await hash(adminPassword, hashOptions)
    const juryPasswordHash = await hash(juryPassword, hashOptions)

    console.log('🔐 Mots de passe hashés')

    // Créer l'admin WFM
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin WFM',
        email: 'wfm@recruitment.com',
        emailVerified: true,
        role: 'WFM',
        isActive: true,
        lastLogin: new Date(),
      },
    })

    await prisma.account.create({
      data: {
        userId: adminUser.id,
        accountId: adminUser.email,
        providerId: 'credentials',
        password: adminPasswordHash,
      },
    })

    await prisma.juryMember.create({
      data: {
        userId: adminUser.id,
        fullName: 'Admin WFM',
        roleType: 'WFM_JURY',
        specialite: 'CALL_CENTER',
        department: 'Workforce Management',
        phone: '+2250102030405',
        isActive: true,
      },
    })

    // Créer un jury DRH
    const juryUser = await prisma.user.create({
      data: {
        name: 'Jury DRH',
        email: 'drh@recruitment.com',
        emailVerified: true,
        role: 'JURY',
        isActive: true,
        lastLogin: new Date(),
      },
    })

    await prisma.account.create({
      data: {
        userId: juryUser.id,
        accountId: juryUser.email,
        providerId: 'credentials',
        password: juryPasswordHash,
      },
    })

    await prisma.juryMember.create({
      data: {
        userId: juryUser.id,
        fullName: 'Jury DRH',
        roleType: 'DRH',
        department: 'Ressources Humaines',
        phone: '+2250506070809',
        isActive: true,
      },
    })

    console.log('✅ Utilisateurs créés')

    // Créer une session de recrutement
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
    const candidate1 = await prisma.candidate.create({
      data: {
        fullName: 'Jean Dupont',
        phone: '+2250708091011',
        birthDate: new Date('1995-05-15'),
        age: 29,
        diploma: 'Bac+3 en Commerce',
        institution: 'Université de Cocody',
        email: 'jean.dupont@example.com',
        location: 'Abidjan, Cocody',
        smsSentDate: new Date('2024-11-10'),
        interviewDate: new Date('2024-11-15'),
        availability: 'OUI',
        educationLevel: 'BAC+3',
        metier: 'CALL_CENTER',
        sessionId: session.id,
      },
    })

    const candidate2 = await prisma.candidate.create({
      data: {
        fullName: 'Marie Koné',
        phone: '+2250708091012',
        birthDate: new Date('1998-08-22'),
        age: 26,
        diploma: 'BTS en Communication',
        institution: 'ISTC Polytechnique',
        email: 'marie.kone@example.com',
        location: 'Abidjan, Plateau',
        smsSentDate: new Date('2024-11-10'),
        interviewDate: new Date('2024-11-15'),
        availability: 'OUI',
        educationLevel: 'BAC+3'',
        metier: 'CALL_CENTER',
        sessionId: session.id,
      },
    })

    console.log('✅ Session et candidats créés')

    // Créer des scores pour les candidats
    await prisma.score.create({
      data: {
        candidateId: candidate1.id,
        voiceQuality: 8.5,
        verbalCommunication: 7.5,
        presentationVisuelle: 9.0,
        phase1_ff_decision: 'FAVORABLE',
        attentionConcentration: 8.0,
        logicalReasoning: 8.0,
        phase1Decision: 'ADMIS',
        evaluatedBy: 'Admin WFM',
        call_status: 'PRESENT',
      },
    })

    await prisma.score.create({
      data: {
        candidateId: candidate2.id,
        voiceQuality: 7.0,
        verbalCommunication: 8.0,
        presentationVisuelle: 8.5,
        phase1_ff_decision: 'FAVORABLE',
        attentionConcentration: 7.5,
        logicalReasoning: 7.5,
        phase1Decision: 'ADMIS',
        evaluatedBy: 'Admin WFM',
        call_status: 'PRESENT',
      },
    })

    console.log('✅ Scores créés')

    // Créer une présence de jury pour la session
    await prisma.juryPresence.create({
      data: {
        juryMemberId: 1, // Admin WFM
        sessionId: session.id,
        wasPresent: true,
      },
    })

    console.log('✅ Présence de jury créée')

    console.log('🎉 Seeding terminé avec succès!')
    console.log('')
    console.log('═══════════════════════════════════════')
    console.log('📋 COMPTES DE TEST CRÉÉS')
    console.log('═══════════════════════════════════════')
    console.log('👤 Admin WFM')
    console.log('   Email:    wfm@recruitment.com')
    console.log('   Password: Admin123')
    console.log('   Role:     WFM')
    console.log('')
    console.log('👤 Jury DRH')
    console.log('   Email:    drh@recruitment.com')
    console.log('   Password: Jury1234')
    console.log('   Role:     JURY')
    console.log('═══════════════════════════════════════')
    console.log('')
    console.log('📊 Données créées:')
    console.log('   - 2 utilisateurs')
    console.log('   - 1 session de recrutement')
    console.log('   - 2 candidats')
    console.log('   - 2 scores')
    console.log('   - 1 présence de jury')
    console.log('═══════════════════════════════════════')

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })