-- Ajout appetence_digitale (déjà en BD, on utilise IF NOT EXISTS pour éviter les erreurs)
ALTER TABLE "face_to_face_scores" ADD COLUMN IF NOT EXISTS "appetence_digitale" DECIMAL(3,2);
ALTER TABLE "scores" ADD COLUMN IF NOT EXISTS "appetence_digitale" DECIMAL(4,2);

-- Ajout signing_date (nouveau champ)
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "signing_date" DATE;
