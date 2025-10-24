// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { spawn } from 'child_process'

const prisma = new PrismaClient()

async function waitForServer(url: string, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url)
      if (response) return true
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  return false
}

async function createAccountsViaAPI() {
  const baseUrl = 'http://localhost:3000'

  // Créer Admin WFM
  try {
    const adminRes = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Administrateur WFM',
        email: 'wfm@recruitment.com',
        password: 'Admin@123'
      })
    })

    if (adminRes.ok || adminRes.status === 400) {
      await prisma.user.updateMany({
        where: { email: 'wfm@recruitment.com' },
        data: { role: 'WFM', emailVerified: true }
      })
      console.log('✅ Admin WFM: wfm@recruitment.com / Admin@123')
    }
  } catch (e) {
    console.log('⚠️  Admin WFM: erreur lors de la création')
  }

  // Créer Jury
  try {
    const juryRes = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Membre du Jury',
        email: 'jury@recruitment.com',
        password: 'Jury@123'
      })
    })

    if (juryRes.ok || juryRes.status === 400) {
      const juryUser = await prisma.user.findUnique({
        where: { email: 'jury@recruitment.com' }
      })

      if (juryUser) {
        await prisma.user.update({
          where: { id: juryUser.id },
          data: { role: 'JURY', emailVerified: true }
        })

        await prisma.juryMember.upsert({
          where: { userId: juryUser.id },
          update: {},
          create: {
            userId: juryUser.id,
            fullName: 'Membre du Jury',
            roleType: 'REPRESENTANT_DU_METIER'
          }
        })
      }
      console.log('✅ Jury: jury@recruitment.com / Jury@123')
    }
  } catch (e) {
    console.log('⚠️  Jury: erreur lors de la création')
  }
}

async function main() {
  console.log('🌱 Début du seeding...\n')

  // Vérifier si le serveur tourne déjà
  const serverRunning = await waitForServer('http://localhost:3000', 2)

  if (serverRunning) {
    console.log('✅ Serveur détecté, création des comptes...\n')
    await createAccountsViaAPI()
    console.log('\n🎉 Seeding terminé !')
    return
  }

  // Si le serveur ne tourne pas, démarrer temporairement
  console.log('🚀 Démarrage temporaire du serveur Next.js...\n')
  
  const serverProcess = spawn('pnpm', ['next', 'dev'], {
    stdio: 'pipe',
    detached: true
  })

  let serverReady = false

  serverProcess.stdout?.on('data', (data) => {
    const output = data.toString()
    if (output.includes('Ready in') || output.includes('Local:')) {
      serverReady = true
    }
  })

  // Attendre que le serveur soit prêt
  console.log('⏳ Attente du démarrage du serveur...')
  const maxWait = 60
  for (let i = 0; i < maxWait; i++) {
    if (serverReady) break
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  if (!serverReady) {
    console.error('❌ Le serveur n\'a pas démarré à temps')
    console.log('\n💡 Solution manuelle:')
    console.log('   1. Démarrez le serveur: pnpm dev')
    console.log('   2. Dans un autre terminal: pnpm db:seed')
    process.kill(-serverProcess.pid!)
    process.exit(1)
  }

  console.log('✅ Serveur prêt, création des comptes...\n')
  
  await new Promise(resolve => setTimeout(resolve, 2000))
  await createAccountsViaAPI()

  console.log('\n🎉 Seeding terminé !')
  console.log('🛑 Arrêt du serveur temporaire...')
  
  process.kill(-serverProcess.pid!)
  await new Promise(resolve => setTimeout(resolve, 1000))
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    console.log('\n💡 Solution manuelle:')
    console.log('   1. Démarrez le serveur: pnpm dev')
    console.log('   2. Allez sur http://localhost:3000/auth/signup')
    console.log('   3. Créez les comptes:')
    console.log('      - wfm@recruitment.com / Admin@123 (rôle: WFM)')
    console.log('      - jury@recruitment.com / Jury@123 (rôle: JURY)')
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })