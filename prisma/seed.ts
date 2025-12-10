import { PrismaClient, UserRole, JuryRoleType, Metier, SessionStatus, Decision, FFDecision, Statut, NiveauEtudes, Disponibilite } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // Nettoyer la base de données
  console.log("🔍 Vérification de l'état de la base...");
  await prisma.faceToFaceScore.deleteMany();
  await prisma.score.deleteMany();
  await prisma.juryPresence.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.recruitmentSession.deleteMany();
  await prisma.juryMember.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Création des utilisateurs...");

  // Hash des mots de passe avec bcrypt (comme Better Auth)
  const wfmPassword = await bcrypt.hash("Admin123", 10);
  const juryPassword = await bcrypt.hash("Jury1234", 10);

  console.log("🔐 Mots de passe hashés avec bcrypt");

  // Créer l'utilisateur WFM avec le bon rôle
  const wfmUser = await prisma.user.create({
    data: {
      email: "wfm@recruitment.com",
      name: "Admin WFM",
      emailVerified: true,
      role: UserRole.WFM, // ⚠️ IMPORTANT: WFM et non JURY
      isActive: true,
      accounts: {
        create: {
          accountId: "wfm-account",
          providerId: "credential",
          password: wfmPassword,
        },
      },
    },
  });

  // Créer l'utilisateur Jury
  const juryUser = await prisma.user.create({
    data: {
      email: "drh@recruitment.com",
      name: "Jury DRH",
      emailVerified: true,
      role: UserRole.JURY,
      isActive: true,
      accounts: {
        create: {
          accountId: "jury-account",
          providerId: "credential",
          password: juryPassword,
        },
      },
    },
  });

  console.log("✅ Utilisateurs créés");

  // Créer le membre du jury
  const juryMember = await prisma.juryMember.create({
    data: {
      userId: juryUser.id,
      fullName: "Jury DRH",
      roleType: JuryRoleType.DRH,
      specialite: Metier.CALL_CENTER,
      department: "Ressources Humaines",
      isActive: true,
      phone: "+225 07 00 00 00 00",
    },
  });

  // Créer une session de recrutement
  const session = await prisma.recruitmentSession.create({
    data: {
      metier: Metier.CALL_CENTER,
      date: new Date("2024-12-15"),
      jour: "Lundi",
      status: SessionStatus.PLANIFIED,
      description: "Session de recrutement Call Center",
      location: "Abidjan, Plateau",
    },
  });

  // Créer des candidats
  const candidate1 = await prisma.candidate.create({
    data: {
      nom: "KOUASSI",
      prenom: "Jean",
      phone: "+225 07 12 34 56 78",
      birthDate: new Date("1995-05-15"),
      age: 29,
      diploma: "Licence en Communication",
      niveauEtudes: NiveauEtudes.BAC_PLUS_3,
      institution: "Université Félix Houphouët-Boigny",
      email: "jean.kouassi@email.com",
      location: "Abidjan, Cocody",
      smsSentDate: new Date("2024-12-01"),
      availability: Disponibilite.OUI,
      interviewDate: new Date("2024-12-15"),
      metier: Metier.CALL_CENTER,
      sessionId: session.id,
    },
  });

  const candidate2 = await prisma.candidate.create({
    data: {
      nom: "TRAORE",
      prenom: "Aminata",
      phone: "+225 05 98 76 54 32",
      birthDate: new Date("1998-08-22"),
      age: 26,
      diploma: "Master en Marketing",
      niveauEtudes: NiveauEtudes.BAC_PLUS_5,
      institution: "ESATIC",
      email: "aminata.traore@email.com",
      location: "Abidjan, Marcory",
      smsSentDate: new Date("2024-12-01"),
      availability: Disponibilite.OUI,
      interviewDate: new Date("2024-12-15"),
      metier: Metier.CALL_CENTER,
      sessionId: session.id,
    },
  });

  console.log("✅ Session et candidats créés");

  // Créer des scores pour les candidats
  await prisma.score.create({
    data: {
      candidateId: candidate1.id,
      voiceQuality: 8.5,
      verbalCommunication: 9.0,
      presentationVisuelle: 8.0,
      phase1FfDecision: FFDecision.FAVORABLE,
      psychoRaisonnementLogique: 8.5,
      psychoAttentionConcentration: 9.0,
      psychotechnicalTest: 8.75,
      phase1Decision: Decision.ADMIS,
      typingSpeed: 45,
      typingAccuracy: 95.5,
      excelTest: 8.0,
      dictation: 8.5,
      simulationSensNegociation: 8.0,
      simulationCapacitePersuasion: 9.0,
      simulationSensCombativite: 8.5,
      salesSimulation: 8.5,
      analysisExercise: 8.0,
      phase2Date: new Date("2024-12-20"),
      decisionTest: FFDecision.FAVORABLE,
      statut: Statut.PRESENT,
      faceToFacePhase1Average: 8.5,
      evaluatedBy: wfmUser.id,
    },
  });

  await prisma.score.create({
    data: {
      candidateId: candidate2.id,
      voiceQuality: 7.5,
      verbalCommunication: 8.0,
      presentationVisuelle: 7.0,
      phase1FfDecision: FFDecision.FAVORABLE,
      psychoRaisonnementLogique: 7.5,
      psychoAttentionConcentration: 8.0,
      psychotechnicalTest: 7.75,
      phase1Decision: Decision.ADMIS,
      typingSpeed: 40,
      typingAccuracy: 92.0,
      excelTest: 7.5,
      dictation: 7.0,
      simulationSensNegociation: 7.5,
      simulationCapacitePersuasion: 8.0,
      simulationSensCombativite: 7.0,
      salesSimulation: 7.5,
      analysisExercise: 7.0,
      phase2Date: new Date("2024-12-20"),
      decisionTest: FFDecision.FAVORABLE,
      statut: Statut.PRESENT,
      faceToFacePhase1Average: 7.5,
      evaluatedBy: wfmUser.id,
    },
  });

  // Créer des scores face-à-face
  await prisma.faceToFaceScore.create({
    data: {
      candidateId: candidate1.id,
      juryMemberId: juryMember.id,
      phase: 1,
      score: 8.5,
      presentationVisuelle: 8.0,
      verbalCommunication: 9.0,
      voiceQuality: 8.5,
      comments: "Excellent candidat, très motivé",
    },
  });

  await prisma.faceToFaceScore.create({
    data: {
      candidateId: candidate2.id,
      juryMemberId: juryMember.id,
      phase: 1,
      score: 7.5,
      presentationVisuelle: 7.0,
      verbalCommunication: 8.0,
      voiceQuality: 7.5,
      comments: "Bon potentiel, à suivre",
    },
  });

  // Créer des présences de jury
  await prisma.juryPresence.create({
    data: {
      juryMemberId: juryMember.id,
      sessionId: session.id,
      wasPresent: true,
    },
  });

  console.log("✅ Scores et présences créés");
  console.log("🎉 Seeding terminé avec succès!");
  console.log("═══════════════════════════════════════");
  console.log("📋 COMPTES DE TEST CRÉÉS");
  console.log("═══════════════════════════════════════");
  console.log("👤 Admin WFM");
  console.log("   Email:    wfm@recruitment.com");
  console.log("   Password: Admin123");
  console.log("   Role:     WFM");
  console.log("");
  console.log("👤 Jury DRH");
  console.log("   Email:    drh@recruitment.com");
  console.log("   Password: Jury1234");
  console.log("   Role:     JURY");
  console.log("═══════════════════════════════════════");
  console.log("📊 Données créées:");
  console.log("   - 2 utilisateurs");
  console.log("   - 1 session de recrutement");
  console.log("   - 2 candidats");
  console.log("   - 2 scores avec sous-critères");
  console.log("   - 2 scores face-à-face");
  console.log("   - 1 présence de jury");
  console.log("═══════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });