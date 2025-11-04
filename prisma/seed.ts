// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')
  
  try {
    console.log('🔍 Vérification de l\'état de la base...')
    
    // Vérifier si les tables existent et ont des données
    const userCount = await prisma.user.count().catch(() => 0)
    
    if (userCount > 0) {
      console.log('🧹 Nettoyage des données existantes...')
      try {
        await prisma.faceToFaceScore.deleteMany()
        await prisma.score.deleteMany()
        await prisma.juryPresence.deleteMany()
        await prisma.juryMember.deleteMany()
        await prisma.candidate.deleteMany()
        await prisma.recruitmentSession.deleteMany()
        await prisma.exportLog.deleteMany()
        await prisma.verification.deleteMany()
        await prisma.account.deleteMany()
        await prisma.session.deleteMany()
        await prisma.user.deleteMany()
        console.log('✅ Nettoyage terminé')
      } catch (error) {
        console.log('ℹ️  Tables vides, pas de nettoyage nécessaire')
      }
    }

    console.log('👤 Création des utilisateurs...')

    // Mots de passe
    const adminPassword = 'Admin123'
    const juryPassword = 'Jury1234'

    // ⭐ CONFIGURATION COMPATIBLE AVEC BETTER AUTH
    const hashOptions = {
      memoryCost: 65536,    // Better Auth utilise 64MB par défaut
      timeCost: 3,          // 3 itérations
      outputLen: 32,        // 32 bytes
      parallelism: 4,       // 4 threads
      variant: 2 as const,  // Argon2id
    }

    const adminPasswordHash = await hash(adminPassword, hashOptions)
    const juryPasswordHash = await hash(juryPassword, hashOptions)

    console.log('🔐 Mots de passe hashés avec configuration Better Auth')

    // Créer l'admin WFM
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin WFM',
        email: 'wfm@recruitment.com',
        role: 'WFM',
        emailVerified: true,
      },
    })

    await prisma.account.create({
      data: {
        userId: adminUser.id,
        accountId: adminUser.email,
        providerId: 'credential',
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
      },
    })

    // Créer un jury
    const juryUser = await prisma.user.create({
      data: {
        name: 'Jury DRH',
        email: 'drh@recruitment.com',
        role: 'JURY',
        emailVerified: true,
      },
    })

    await prisma.account.create({
      data: {
        userId: juryUser.id,
        accountId: juryUser.email,
        providerId: 'credential',
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
      },
    })

    console.log('✅ Utilisateurs créés')

    // Créer une session
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

    // Créer un candidat
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

    console.log('🎉 Seeding terminé avec succès!')
    console.log('')
    console.log('═══════════════════════════════════════')
    console.log('📋 COMPTES DE TEST CRÉÉS')
    console.log('═══════════════════════════════════════')
    console.log('👤 Admin WFM')
    console.log('   Email:    wfm@recruitment.com')
    console.log('   Password: Admin123')
    console.log('')
    console.log('👤 Jury DRH')
    console.log('   Email:    drh@recruitment.com')
    console.log('   Password: Jury1234')
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