-- Création de l'enum AgenceType
CREATE TYPE "AgenceType" AS ENUM ('ABIDJAN', 'INTERIEUR');

-- Ajout sur recruitment_sessions uniquement
ALTER TABLE "recruitment_sessions" ADD COLUMN IF NOT EXISTS "agence_type" "AgenceType";
