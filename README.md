# Application de Consolidation des Notes de Recrutement

Application centralisée et sécurisée pour automatiser le processus de consolidation des notes attribuées par les membres du jury lors des recrutements.

## Fonctionnalités

### Rôle WFM (Administrateur)
- Enregistrement des candidats et membres du jury
- Saisie de TOUTES les notes techniques :
  - Test Excel (/5)
  - Rapidité de saisie (MPM)
  - Précision de saisie (%)
  - Dictée (/20)
  - Simulation Vente (/5)
  - Test Psychotechnique (/10)
  - Exercice d'Analyse (/10)
- Consolidation automatique des résultats
- Export des fichiers de consolidation (Excel/PDF)

### Rôle Jury
- Saisie UNIQUEMENT des notes Face à Face (/5)
- Consultation des candidats à évaluer

## Métiers Supportés

1. **Call Center** : Face à Face ≥ 3/5, Saisie ≥ 17 MPM + 85%, Excel ≥ 3/5, Dictée ≥ 16/20
2. **Agences** : Face à Face ≥ 3/5, Saisie ≥ 17 MPM + 85%, Dictée ≥ 16/20, Simulation Vente ≥ 3/5
3. **Bo Réclam** : Saisie ≥ 17 MPM + 85%, Excel ≥ 3/5, Dictée ≥ 16/20, Test Psychotechnique ≥ 8/10
4. **Télévente** : Face à Face ≥ 3/5, Saisie ≥ 17 MPM + 85%, Dictée ≥ 16/20, Simulation Vente ≥ 3/5
5. **Réseaux Sociaux** : Face à Face ≥ 3/5, Saisie ≥ 17 MPM + 85%, Dictée ≥ 16/20
6. **Supervision** : Face à Face ≥ 3/5, Saisie ≥ 17 MPM + 85%, Excel ≥ 3/5, Dictée ≥ 16/20
7. **Bot Cognitive Trainer** : Face à Face ≥ 3/5, Excel ≥ 3/5, Dictée ≥ 16/20, Exercice Analyse ≥ 6/10
8. **SMC Fixe & Mobile** : Face à Face ≥ 3/5, Saisie ≥ 17 MPM + 85%, Excel ≥ 3/5, Dictée ≥ 16/20

## Prérequis

- Node.js 18+ installé sur votre machine
- PostgreSQL 14+ installé et en cours d'exécution sur votre machine

## Installation Rapide

### Étape 1 : Installer PostgreSQL

#### Sur Windows :
1. Téléchargez PostgreSQL depuis https://www.postgresql.org/download/windows/
2. Installez PostgreSQL avec les paramètres par défaut
3. Notez le mot de passe que vous définissez pour l'utilisateur `postgres`

#### Sur macOS :
\`\`\`bash
brew install postgresql@14
brew services start postgresql@14
\`\`\`

#### Sur Linux (Ubuntu/Debian) :
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
\`\`\`

### Étape 2 : Créer la base de données

Ouvrez un terminal et connectez-vous à PostgreSQL :

\`\`\`bash
# Sur Windows (dans le terminal PostgreSQL)
psql -U postgres

# Sur macOS/Linux
sudo -u postgres psql
\`\`\`

Créez la base de données :

\`\`\`sql
CREATE DATABASE recruitment_consolidation;
\q
\`\`\`

### Étape 3 : Configurer le projet

1. **Téléchargez le projet** depuis v0 (bouton "Download ZIP" en haut à droite)
2. **Décompressez** le fichier ZIP
3. **Ouvrez un terminal** dans le dossier du projet
4. **Copiez le fichier d'environnement** :

\`\`\`bash
# Sur Windows (PowerShell)
copy .env.example .env

# Sur macOS/Linux
cp .env.example .env
\`\`\`

5. **Modifiez le fichier `.env`** avec vos informations :

\`\`\`env
# Remplacez 'votre_mot_de_passe' par le mot de passe PostgreSQL que vous avez défini
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@localhost:5432/recruitment_consolidation"

# Générez un secret aléatoire sécurisé (voir ci-dessous)
BETTER_AUTH_SECRET="votre_secret_aleatoire_ici"
BETTER_AUTH_URL="http://localhost:3000"

# Pour le développement local
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

**Générer un secret aléatoire pour BETTER_AUTH_SECRET** :

\`\`\`bash
# Sur macOS/Linux
openssl rand -base64 32

# Sur Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
\`\`\`

Copiez le résultat dans votre fichier `.env`.

### Étape 4 : Installer les dépendances

\`\`\`bash
npm install
\`\`\`

### Étape 5 : Initialiser la base de données avec Prisma

\`\`\`bash
# 1. Générer le client Prisma
npx prisma generate

# 2. Créer les tables dans la base de données
npx prisma db push

# Vous devriez voir :
# ✔ Generated Prisma Client
# ✔ Your database is now in sync with your Prisma schema
\`\`\`

**Optionnel : Visualiser la base de données avec Prisma Studio**

\`\`\`bash
npx prisma studio
\`\`\`

Cela ouvrira une interface web sur http://localhost:5555 où vous pouvez visualiser et modifier vos données.

### Étape 6 : Lancer l'application

\`\`\`bash
npm run dev
\`\`\`

L'application sera accessible sur **http://localhost:3000**

## Premier Démarrage

### 1. Créer le compte WFM (Administrateur)

1. Allez sur http://localhost:3000
2. Cliquez sur "S'inscrire"
3. Créez un compte avec :
   - **Nom** : Votre nom complet
   - **Email** : Votre email
   - **Mot de passe** : Minimum 8 caractères
   - **Rôle** : **WFM (Administrateur)** ⚠️ Important !

### 2. Créer des comptes Jury

Pour chaque membre du jury :

1. Allez sur http://localhost:3000/auth/signup
2. Créez un compte avec le **rôle "Membre du Jury"**
3. Connectez-vous avec le compte WFM
4. Allez dans **"Gestion des Jurys"**
5. Ajoutez le membre avec son rôle spécifique :
   - DRH
   - EPC
   - Représentant du Métier
   - WFM

## Utilisation

### Workflow WFM (Administrateur)

1. **Ajouter des candidats**
   - Menu "Candidats" → "Nouveau candidat"
   - Remplir toutes les informations personnelles
   - Sélectionner le métier

2. **Gérer les jurys**
   - Menu "Jurys" → "Nouveau membre"
   - Lier un utilisateur existant à un rôle de jury

3. **Saisir les notes techniques**
   - Menu "Notes" → Sélectionner un candidat
   - Saisir TOUTES les notes techniques :
     - Excel, Saisie (MPM + %), Dictée
     - Simulation Vente, Test Psychotechnique, Exercice d'Analyse
   - Voir la moyenne Face à Face calculée automatiquement

4. **Consulter les résultats**
   - Menu "Résultats"
   - Voir la consolidation automatique par métier
   - Statistiques détaillées

5. **Exporter les données**
   - Bouton "Exporter Excel" : Fichier CSV complet
   - Bouton "Exporter PDF" : Fiches individuelles

### Workflow Jury

1. **Se connecter** avec son compte Jury
2. **Consulter les candidats** à évaluer
3. **Saisir les notes Face à Face** :
   - Phase 1 : Entretien initial (/5)
   - Phase 2 : Après épreuves techniques (/5)
4. **C'est tout !** Les jurys ne saisissent QUE les notes Face à Face

## Consolidation Automatique

L'application calcule automatiquement :

- ✅ **Moyenne Face à Face** : Moyenne des notes de tous les jurys présents
- ✅ **Validation des critères** : Vérification de tous les seuils selon le métier
- ✅ **Décision finale** : **RECRUTÉ** ✓ ou **NON RECRUTÉ** ✗

### Exemple pour Call Center :
- Face à Face ≥ 3/5 ✓
- Saisie ≥ 17 MPM + 85% ✓
- Excel ≥ 3/5 ✓
- Dictée ≥ 16/20 ✓
- **→ Résultat : RECRUTÉ** ✓

## Export des Données

### Export Excel (CSV)
Fichier complet avec toutes les colonnes :
- Informations personnelles (nom, téléphone, email, etc.)
- Notes Phase 1 (Qualité voix, Communication, Psychotechnique)
- Notes Phase 2 (Saisie, Excel, Dictée, etc.)
- Décisions et commentaires

### Export PDF
Fiche individuelle pour chaque candidat avec :
- Toutes les informations
- Toutes les notes
- Résultat de la consolidation

## Dépannage

### ❌ Erreur : "Prisma Client not generated"

**Solution** :
\`\`\`bash
npx prisma generate
\`\`\`

### ❌ Erreur : "relation does not exist"

**Solution** : Recréer les tables
\`\`\`bash
# ATTENTION : Cela supprimera toutes les données existantes
npx prisma db push --force-reset
\`\`\`

### ❌ Erreur : "Cannot connect to database"

**Solutions** :
1. Vérifiez que PostgreSQL est démarré :
   \`\`\`bash
   # Windows
   services.msc → Rechercher "postgresql" → Démarrer
   
   # macOS
   brew services start postgresql@14
   
   # Linux
   sudo systemctl start postgresql
   \`\`\`

2. Vérifiez le mot de passe dans `.env`
3. Vérifiez que la base de données existe :
   \`\`\`bash
   psql -U postgres -l
   \`\`\`

### ❌ Erreur : "Port 3000 already in use"

**Solution** : Changez le port
\`\`\`bash
npm run dev -- -p 3001
\`\`\`

Puis accédez à http://localhost:3001

### ❌ Erreur : "Module not found"

**Solution** : Réinstallez les dépendances
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### ❌ Le site ne s'affiche pas

**Solutions** :
1. Vérifiez que le serveur est bien démarré (message "Ready on http://localhost:3000")
2. Videz le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
3. Essayez un autre navigateur
4. Vérifiez les logs dans le terminal pour voir les erreurs

### ❌ Erreur lors de la connexion

**Solutions** :
1. Vérifiez que vous avez bien créé un compte
2. Vérifiez que le mot de passe est correct (minimum 8 caractères)
3. Vérifiez que la base de données est bien initialisée

## Technologies Utilisées

- **Next.js 16** : Framework React avec App Router
- **Better-Auth** : Authentification moderne avec gestion des rôles
- **PostgreSQL** : Base de données relationnelle
- **Prisma** : ORM moderne pour TypeScript
- **Tailwind CSS v4** : Styles avec couleurs **orange (#FF6B00), blanc et noir**
- **shadcn/ui** : Composants UI modernes et accessibles

## Commandes Prisma Utiles

\`\`\`bash
# Générer le client Prisma après modification du schéma
npx prisma generate

# Synchroniser la base de données avec le schéma
npx prisma db push

# Ouvrir Prisma Studio (interface graphique)
npx prisma studio

# Réinitialiser complètement la base de données (ATTENTION : supprime toutes les données)
npx prisma db push --force-reset

# Formater le schéma Prisma
npx prisma format
\`\`\`

## Architecture

\`\`\`bash
recruitment-consolidation/
├── app/                      # Pages Next.js
│   ├── auth/                # Pages d'authentification
│   ├── wfm/                 # Pages WFM (Administrateur)
│   └── jury/                # Pages Jury
├── components/              # Composants React
├── lib/                     # Utilitaires
│   ├── auth.ts             # Configuration Better-Auth
│   ├── prisma.ts           # Client Prisma
│   └── consolidation.ts    # Logique de consolidation
├── prisma/                  # Configuration Prisma
│   └── schema.prisma       # Schéma de la base de données
└── public/                  # Fichiers statiques
\`\`\`

## Documentation Complète

- **INSTALLATION_PRISMA.md** : Guide d'installation détaillé avec Prisma
- **GUIDE_DEMARRAGE.md** : Guide de démarrage rapide en 5 étapes
- **FONCTIONNALITES.md** : Liste exhaustive de toutes les fonctionnalités

## Support

Pour toute question ou problème :
1. Consultez la section **Dépannage** ci-dessus
2. Vérifiez le fichier **GUIDE_DEMARRAGE.md** pour un guide rapide
3. Consultez **FONCTIONNALITES.md** pour la liste complète des fonctionnalités
4. Contactez l'équipe WFM

## Licence

Application propriétaire - Tous droits réservés
