// scripts/migrate-passwords.ts
// ⚠️ À EXÉCUTER UNE SEULE FOIS pour migrer les mots de passe

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function migratePasswords() {
  console.log('🔄 Début de la migration des mots de passe...')

  try {
    // Récupérer tous les comptes avec mot de passe
    const accounts = await prisma.account.findMany({
      where: {
        providerId: 'credential',
        password: { not: null }
      },
      include: {
        user: true
      }
    })

    console.log(`📊 ${accounts.length} comptes trouvés`)

    // IMPORTANT : Définir des mots de passe temporaires
    // ou demander à vos utilisateurs de réinitialiser
    const temporaryPassword = 'TempPass2024!' // ⚠️ Changez ceci

    for (const account of accounts) {
      try {
        // Hasher avec bcrypt (compatibilité BetterAuth)
        const newHash = await bcrypt.hash(temporaryPassword, 10)
        
        await prisma.account.update({
          where: { id: account.id },
          data: { 
            password: newHash,
            updatedAt: new Date()
          }
        })

        console.log(`✅ Migré: ${account.user.email}`)
      } catch (error) {
        console.error(`❌ Erreur pour ${account.user.email}:`, error)
      }
    }

    console.log('✅ Migration terminée!')
    console.log(`⚠️  Tous les utilisateurs ont maintenant le mot de passe : ${temporaryPassword}`)
    console.log('📧 Demandez-leur de le changer dès leur première connexion')

  } catch (error) {
    console.error('❌ Erreur durant la migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migratePasswords()