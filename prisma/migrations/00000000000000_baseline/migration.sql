-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT', 'ASSIGN', 'UNASSIGN', 'APPROVE', 'REJECT', 'READ');

-- CreateEnum
CREATE TYPE "AuditEntity" AS ENUM ('SESSION', 'CANDIDATE', 'JURY_MEMBER', 'SCORE', 'USER', 'EXPORT', 'USER_ROLE', 'USER_EMAIL', 'USER_PASSWORD', 'PRESENCE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('WFM', 'JURY');

-- CreateEnum
CREATE TYPE "JuryRoleType" AS ENUM ('DRH', 'EPC', 'REPRESENTANT_METIER', 'WFM_JURY', 'FORMATEUR');

-- CreateEnum
CREATE TYPE "Metier" AS ENUM ('CALL_CENTER', 'AGENCES', 'BO_RECLAM', 'TELEVENTE', 'RESEAUX_SOCIAUX', 'SUPERVISION', 'BOT_COGNITIVE_TRAINER', 'SMC_FIXE', 'SMC_MOBILE');

-- CreateEnum
CREATE TYPE "Decision" AS ENUM ('ADMIS', 'ELIMINE');

-- CreateEnum
CREATE TYPE "FFDecision" AS ENUM ('FAVORABLE', 'DEFAVORABLE');

-- CreateEnum
CREATE TYPE "FinalDecision" AS ENUM ('RECRUTE', 'NON_RECRUTE');

-- CreateEnum
CREATE TYPE "Statut" AS ENUM ('ABSENT', 'PRESENT');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PLANIFIED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NiveauEtudes" AS ENUM ('BAC_PLUS_2', 'BAC_PLUS_3', 'BAC_PLUS_4', 'BAC_PLUS_5');

-- CreateEnum
CREATE TYPE "Disponibilite" AS ENUM ('OUI', 'NON');

-- CreateEnum
CREATE TYPE "RecruitmentStatut" AS ENUM ('STAGE', 'INTERIM', 'CDI', 'CDD', 'AUTRE');

-- CreateEnum
CREATE TYPE "AgenceType" AS ENUM ('ABIDJAN', 'INTERIEUR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'JURY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "id_token" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "scope" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_sessions" (
    "id" TEXT NOT NULL,
    "metier" "Metier" NOT NULL,
    "date" DATE NOT NULL,
    "jour" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "description" TEXT,
    "location" TEXT,
    "agence_type" "AgenceType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "recruitment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "age" INTEGER NOT NULL,
    "diploma" TEXT NOT NULL,
    "niveau_etudes" "NiveauEtudes" NOT NULL,
    "institution" TEXT NOT NULL,
    "email" TEXT,
    "location" TEXT NOT NULL,
    "sms_sent_date" DATE NOT NULL,
    "signing_date" DATE,
    "availability" "Disponibilite" NOT NULL,
    "interview_date" DATE NOT NULL,
    "metier" "Metier" NOT NULL,
    "session_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "statut_recrutement" "RecruitmentStatut",

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jury_members" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role_type" "JuryRoleType" NOT NULL,
    "specialite" "Metier",
    "department" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jury_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jury_presences" (
    "id" SERIAL NOT NULL,
    "jury_member_id" INTEGER NOT NULL,
    "session_id" TEXT NOT NULL,
    "was_present" BOOLEAN NOT NULL DEFAULT true,
    "absence_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jury_presences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scores" (
    "id" SERIAL NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "voice_quality" DECIMAL(4,2),
    "verbal_communication" DECIMAL(4,2),
    "presentation_visuelle" DECIMAL(4,2),
    "appetence_digitale" DECIMAL(4,2),
    "phase1_ff_decision" "FFDecision",
    "psycho_raisonnement_logique" DECIMAL(3,2),
    "psycho_attention_concentration" DECIMAL(3,2),
    "psychotechnical_test" DECIMAL(4,2),
    "phase1_decision" "Decision",
    "typing_speed" INTEGER,
    "typing_accuracy" DECIMAL(5,2),
    "excel_test" DECIMAL(4,2),
    "dictation" DECIMAL(4,2),
    "simulation_sens_negociation" DECIMAL(4,2),
    "simulation_capacite_persuasion" DECIMAL(4,2),
    "simulation_sens_combativite" DECIMAL(4,2),
    "sales_simulation" DECIMAL(4,2),
    "analysis_exercise" DECIMAL(4,2),
    "phase2_date" DATE,
    "decision_test" "FFDecision",
    "final_decision" "FinalDecision",
    "statut" "Statut" DEFAULT 'ABSENT',
    "statut_commentaire" TEXT,
    "face_to_face_phase1_avg" DECIMAL(3,2),
    "face_to_face_phase2_avg" DECIMAL(3,2),
    "evaluated_by" TEXT,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_to_face_scores" (
    "id" SERIAL NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "jury_member_id" INTEGER NOT NULL,
    "phase" INTEGER NOT NULL,
    "score" DECIMAL(3,2),
    "presentation_visuelle" DECIMAL(3,2),
    "verbal_communication" DECIMAL(3,2),
    "voice_quality" DECIMAL(3,2),
    "comments" TEXT,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "decision" "FFDecision",
    "simulation_capacite_persuasion" DECIMAL(3,2),
    "simulation_sens_combativite" DECIMAL(3,2),
    "simulation_sens_negociation" DECIMAL(3,2),
    "appetence_digitale" DECIMAL(3,2),

    CONSTRAINT "face_to_face_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_logs" (
    "id" SERIAL NOT NULL,
    "exported_by" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "session_id" TEXT,
    "metier" "Metier",
    "record_count" INTEGER NOT NULL,
    "export_type" TEXT NOT NULL,
    "filters" TEXT,
    "exported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" "AuditEntity" NOT NULL,
    "entity_id" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "accounts"("provider_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_identifier_value_key" ON "verifications"("identifier", "value");

-- CreateIndex
CREATE INDEX "recruitment_sessions_metier_idx" ON "recruitment_sessions"("metier");

-- CreateIndex
CREATE INDEX "recruitment_sessions_date_idx" ON "recruitment_sessions"("date");

-- CreateIndex
CREATE INDEX "recruitment_sessions_status_idx" ON "recruitment_sessions"("status");

-- CreateIndex
CREATE INDEX "recruitment_sessions_created_at_idx" ON "recruitment_sessions"("created_at");

-- CreateIndex
CREATE INDEX "recruitment_sessions_created_by_id_idx" ON "recruitment_sessions"("created_by_id");

-- CreateIndex
CREATE INDEX "candidates_session_id_idx" ON "candidates"("session_id");

-- CreateIndex
CREATE INDEX "candidates_metier_idx" ON "candidates"("metier");

-- CreateIndex
CREATE INDEX "candidates_created_at_idx" ON "candidates"("created_at");

-- CreateIndex
CREATE INDEX "candidates_nom_idx" ON "candidates"("nom");

-- CreateIndex
CREATE INDEX "candidates_prenom_idx" ON "candidates"("prenom");

-- CreateIndex
CREATE UNIQUE INDEX "jury_members_user_id_key" ON "jury_members"("user_id");

-- CreateIndex
CREATE INDEX "jury_members_role_type_idx" ON "jury_members"("role_type");

-- CreateIndex
CREATE INDEX "jury_members_specialite_idx" ON "jury_members"("specialite");

-- CreateIndex
CREATE INDEX "jury_members_is_active_idx" ON "jury_members"("is_active");

-- CreateIndex
CREATE INDEX "jury_members_created_at_idx" ON "jury_members"("created_at");

-- CreateIndex
CREATE INDEX "jury_presences_jury_member_id_idx" ON "jury_presences"("jury_member_id");

-- CreateIndex
CREATE INDEX "jury_presences_session_id_idx" ON "jury_presences"("session_id");

-- CreateIndex
CREATE INDEX "jury_presences_was_present_idx" ON "jury_presences"("was_present");

-- CreateIndex
CREATE UNIQUE INDEX "jury_presences_jury_member_id_session_id_key" ON "jury_presences"("jury_member_id", "session_id");

-- CreateIndex
CREATE UNIQUE INDEX "scores_candidate_id_key" ON "scores"("candidate_id");

-- CreateIndex
CREATE INDEX "scores_candidate_id_idx" ON "scores"("candidate_id");

-- CreateIndex
CREATE INDEX "scores_final_decision_idx" ON "scores"("final_decision");

-- CreateIndex
CREATE INDEX "scores_created_at_idx" ON "scores"("created_at");

-- CreateIndex
CREATE INDEX "face_to_face_scores_candidate_id_idx" ON "face_to_face_scores"("candidate_id");

-- CreateIndex
CREATE INDEX "face_to_face_scores_jury_member_id_idx" ON "face_to_face_scores"("jury_member_id");

-- CreateIndex
CREATE INDEX "face_to_face_scores_phase_idx" ON "face_to_face_scores"("phase");

-- CreateIndex
CREATE INDEX "face_to_face_scores_evaluated_at_idx" ON "face_to_face_scores"("evaluated_at");

-- CreateIndex
CREATE UNIQUE INDEX "face_to_face_scores_candidate_id_jury_member_id_phase_key" ON "face_to_face_scores"("candidate_id", "jury_member_id", "phase");

-- CreateIndex
CREATE INDEX "export_logs_exported_by_idx" ON "export_logs"("exported_by");

-- CreateIndex
CREATE INDEX "export_logs_session_id_idx" ON "export_logs"("session_id");

-- CreateIndex
CREATE INDEX "export_logs_exported_at_idx" ON "export_logs"("exported_at");

-- CreateIndex
CREATE INDEX "export_logs_export_type_idx" ON "export_logs"("export_type");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_sessions" ADD CONSTRAINT "recruitment_sessions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "recruitment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_members" ADD CONSTRAINT "jury_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_presences" ADD CONSTRAINT "jury_presences_jury_member_id_fkey" FOREIGN KEY ("jury_member_id") REFERENCES "jury_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_presences" ADD CONSTRAINT "jury_presences_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "recruitment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores" ADD CONSTRAINT "scores_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_to_face_scores" ADD CONSTRAINT "face_to_face_scores_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_to_face_scores" ADD CONSTRAINT "face_to_face_scores_jury_member_id_fkey" FOREIGN KEY ("jury_member_id") REFERENCES "jury_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_logs" ADD CONSTRAINT "export_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "recruitment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

