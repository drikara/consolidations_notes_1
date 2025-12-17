// scripts/check-password.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function checkPassword() {
  const email = 'wfm@recrutement.orange.com'
  
  console.log(`🔍 Vérification du mot de passe pour: ${email}`)

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error('❌ Utilisateur introuvable')
      return
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: 'credential'
      }
    })

    if (!account || !account.password) {
      console.error('❌ Compte introuvable')
      return
    }

    console.log('\n📊 Informations du hash:')
    console.log(`  - Hash complet: ${account.password}`)
    console.log(`  - Longueur: ${account.password.length} caractères`)
    console.log(`  - Préfixe: ${account.password.substring(0, 7)}`)
    console.log(`  - Dernière mise à jour: ${account.updatedAt}`)

    // Tester plusieurs mots de passe
    const passwordsToTest = [
      'TempPass2024!',
      'TestPassword123!',
      'Admin@1234567',
      'temp',
      'password'
    ]

    console.log('\n🧪 Test des mots de passe:')
    for (const pwd of passwordsToTest) {
      const isValid = await bcrypt.compare(pwd, account.password)
      console.log(`  ${isValid ? '✅' : '❌'} "${pwd}" (${pwd.length} caractères)`)
    }

    // Vérifier si le hash est au bon format bcrypt
    const isBcryptFormat = account.password.startsWith('$2b$') || account.password.startsWith('$2a$')
    console.log(`\n🔐 Format bcrypt valide: ${isBcryptFormat ? '✅' : '❌'}`)

    if (!isBcryptFormat) {
      console.log('⚠️  Le hash n\'est PAS au format bcrypt!')
      console.log('   Il faut relancer la migration.')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPassword()