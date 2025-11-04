// prisma/fix-wfm-role.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixWFMRole() {
  console.log('🔧 Correction des rôles WFM...')
  
  // Corriger tous les emails WFM
  const result = await prisma.user.updateMany({
    where: {
      OR: [
        { email: { contains: 'wfm' } },
        { email: 'wfm1@recruitment.com' },
        { name: { contains: 'WFM' } }
      ]
    },
    data: {
      role: 'WFM'
    }
  })
  
  console.log(`✅ ${result.count} utilisateur(s) WFM corrigé(s)`)
  
  // Vérification
  const users = await prisma.user.findMany({
    select: { email: true, role: true, name: true }
  })
  
  console.log('\n📋 Utilisateurs après correction:')
  users.forEach(user => {
    console.log(`- ${user.email} (${user.name}): ${user.role}`)
  })
}

fixWFMRole()
  .catch(console.error)
  .finally(() => prisma.$disconnect())