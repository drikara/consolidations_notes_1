import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Mise à jour de l'utilisateur admin...");

  // Vérifier si l'utilisateur existe
  const user = await prisma.user.findUnique({
    where: { email: "admin@recruitment.com" }
  });

  if (!user) {
    console.log("❌ Utilisateur admin@recruitment.com introuvable");
    
    // Lister tous les utilisateurs pour trouver le bon email
    const allUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true }
    });
    
    console.log("\n📋 Utilisateurs existants:");
    console.table(allUsers);
    return;
  }

  // Mettre à jour le rôle
  const updated = await prisma.user.update({
    where: { email: "admin@recruitment.com" },
    data: { 
      role: "WFM",
      emailVerified: true 
    }
  });

  console.log("\n✅ Utilisateur mis à jour avec succès!");
  console.log("📧 Email:", updated.email);
  console.log("👤 Nom:", updated.name);
  console.log("🎭 Rôle:", updated.role);
  console.log("✉️ Email vérifié:", updated.emailVerified);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });