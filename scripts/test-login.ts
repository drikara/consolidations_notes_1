import { hash, verify } from '@node-rs/argon2'

async function testPassword() {
  const password = 'Admin123'
  
  // Hash avec les mêmes paramètres que le seed
  const hashed = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })
  
  console.log('Password:', password)
  console.log('Hash:', hashed)
  console.log('Hash length:', hashed.length)
  
  // Vérifier que ça marche
  const isValid = await verify(hashed, password)
  console.log('Verification:', isValid ? '✅ OK' : '❌ FAILED')
  
  // Test avec mauvais mot de passe
  const isInvalid = await verify(hashed, 'WrongPassword')
  console.log('Wrong password:', isInvalid ? '❌ FAILED' : '✅ OK (rejected as expected)')
}

testPassword()