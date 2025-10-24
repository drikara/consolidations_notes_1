# 🚀 Guide de Démarrage Rapide

## Installation en 5 Étapes

### Étape 1 : Installer PostgreSQL

#### Windows
1. Téléchargez PostgreSQL : https://www.postgresql.org/download/windows/
2. Lancez l'installateur et suivez les instructions
3. **IMPORTANT** : Notez le mot de passe que vous définissez pour l'utilisateur `postgres`
4. Gardez le port par défaut : `5432`

#### macOS
\`\`\`bash
brew install postgresql@14
brew services start postgresql@14
\`\`\`

#### Linux (Ubuntu/Debian)
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
\`\`\`

### Étape 2 : Créer la Base de Données

Ouvrez un terminal et exécutez :

**Windows (PowerShell ou CMD)** :
\`\`\`bash
psql -U postgres
\`\`\`

**macOS/Linux** :
\`\`\`bash
sudo -u postgres psql
\`\`\`

Dans le terminal PostgreSQL, tapez :
\`\`\`sql
CREATE DATABASE recruitment_consolidation;
\q
\`\`\`

### Étape 3 : Configurer le Projet

1. Décompressez le fichier ZIP du projet
2. Ouvrez un terminal dans le dossier du projet
3. Copiez le fichier d'environnement :

**Windows** :
\`\`\`bash
copy .env.example .env
\`\`\`

**macOS/Linux** :
\`\`\`bash
cp .env.example .env
\`\`\`

4. Ouvrez le fichier `.env` avec un éditeur de texte et modifiez :

\`\`\`env
# Remplacez 'votre_mot_de_passe' par votre mot de passe PostgreSQL
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@localhost:5432/recruitment_consolidation"

NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Générez un secret aléatoire (ou gardez celui-ci pour le développement)
BETTER_AUTH_SECRET="changez_moi_en_production_123456789"
BETTER_AUTH_URL="http://localhost:3000"
\`\`\`

### Étape 4 : Installer et Initialiser

Dans le terminal du projet :

\`\`\`bash
# Installer les dépendances
npm install

# Initialiser la base de données
# Windows (PowerShell)
Get-Content scripts/01-init-database.sql | psql -U postgres -d recruitment_consolidation

# macOS/Linux
psql -U postgres -d recruitment_consolidation < scripts/01-init-database.sql
\`\`\`

**Alternative manuelle** :
1. Ouvrez `scripts/01-init-database.sql` dans un éditeur
2. Copiez tout le contenu
3. Connectez-vous à PostgreSQL : `psql -U postgres -d recruitment_consolidation`
4. Collez le contenu et appuyez sur Entrée

### Étape 5 : Lancer l'Application

\`\`\`bash
npm run dev
\`\`\`

Ouvrez votre navigateur sur : **http://localhost:3000**

---

## 👤 Premier Compte (WFM)

1. Allez sur http://localhost:3000/auth/signup
2. Remplissez le formulaire :
   - **Nom** : Votre nom complet
   - **Email** : votre.email@exemple.com
   - **Mot de passe** : Minimum 8 caractères
   - **Rôle** : **WFM** ⚠️ IMPORTANT !
3. Cliquez sur "S'inscrire"
4. Vous serez redirigé vers le tableau de bord WFM

---

## 📋 Utilisation Rapide

### Pour le WFM (Administrateur)

#### 1. Ajouter des Candidats
- Menu : **Candidats** → **Nouveau candidat**
- Remplissez tous les champs obligatoires
- Sélectionnez le **métier** (très important pour la consolidation)
- Cliquez sur "Enregistrer"

#### 2. Créer des Comptes Jury
- Allez sur http://localhost:3000/auth/signup
- Créez des comptes avec le rôle **JURY**
- Notez les emails des jurys créés

#### 3. Ajouter des Membres du Jury
- Menu : **Jurys** → **Nouveau membre**
- Sélectionnez l'utilisateur (email)
- Choisissez le type de rôle :
  - DRH
  - EPC
  - Représentant du Métier
  - WFM
- Cliquez sur "Enregistrer"

#### 4. Saisir les Notes Techniques
- Menu : **Notes** → Sélectionnez un candidat
- Saisissez **TOUTES** les notes techniques :
  - Test Excel (/5)
  - Rapidité de saisie (MPM)
  - Précision de saisie (%)
  - Dictée (/20)
  - Simulation Vente (/5) - selon le métier
  - Test Psychotechnique (/10) - selon le métier
  - Exercice d'Analyse (/10) - selon le métier
- Les moyennes Face à Face sont calculées automatiquement
- Cliquez sur "Enregistrer les Notes"

#### 5. Consulter les Résultats
- Menu : **Résultats**
- Voir la consolidation automatique
- Filtrer par métier ou décision
- Exporter en Excel (CSV) ou PDF

#### 6. Exporter les Données
- Bouton **"Exporter Excel"** : Télécharge un fichier CSV avec toutes les colonnes
- Bouton **"Exporter PDF"** : Génère une fiche PDF pour chaque candidat

### Pour les Jurys

#### 1. Se Connecter
- Allez sur http://localhost:3000/auth/login
- Utilisez vos identifiants Jury

#### 2. Évaluer les Candidats
- Menu : **Évaluations**
- Sélectionnez un candidat
- Saisissez **UNIQUEMENT** votre note Face à Face (/5)
  - Phase 1 : Entretien initial
  - Phase 2 : Après les épreuves techniques
- Cliquez sur "Enregistrer"

---

## 🎯 Critères par Métier

### Call Center
- ✅ Face à Face ≥ 3/5
- ✅ Saisie ≥ 17 MPM + 85%
- ✅ Excel ≥ 3/5
- ✅ Dictée ≥ 16/20

### Agences
- ✅ Face à Face ≥ 3/5
- ✅ Saisie ≥ 17 MPM + 85%
- ✅ Dictée ≥ 16/20
- ✅ Simulation Vente ≥ 3/5

### Bo Réclam
- ✅ Saisie ≥ 17 MPM + 85%
- ✅ Excel ≥ 3/5
- ✅ Dictée ≥ 16/20
- ✅ Test Psychotechnique ≥ 8/10

### Télévente
- ✅ Face à Face ≥ 3/5
- ✅ Saisie ≥ 17 MPM + 85%
- ✅ Dictée ≥ 16/20
- ✅ Simulation Vente ≥ 3/5

### Réseaux Sociaux
- ✅ Face à Face ≥ 3/5
- ✅ Saisie ≥ 17 MPM + 85%
- ✅ Dictée ≥ 16/20

### Supervision
- ✅ Face à Face ≥ 3/5
- ✅ Saisie ≥ 17 MPM + 85%
- ✅ Excel ≥ 3/5
- ✅ Dictée ≥ 16/20

### Bot Cognitive Trainer
- ✅ Face à Face ≥ 3/5
- ✅ Excel ≥ 3/5
- ✅ Dictée ≥ 16/20
- ✅ Exercice Analyse ≥ 6/10

### SMC Fixe & Mobile
- ✅ Face à Face ≥ 3/5
- ✅ Saisie ≥ 17 MPM + 85%
- ✅ Excel ≥ 3/5
- ✅ Dictée ≥ 16/20

---

## 🔧 Dépannage

### Erreur : "Connection refused" ou "ECONNREFUSED"
**Cause** : PostgreSQL n'est pas démarré

**Solution** :
- **Windows** : Ouvrez "Services" → Démarrez "postgresql-x64-14"
- **macOS** : `brew services start postgresql@14`
- **Linux** : `sudo systemctl start postgresql`

### Erreur : "password authentication failed"
**Cause** : Mot de passe incorrect dans `.env`

**Solution** :
1. Ouvrez le fichier `.env`
2. Vérifiez que le mot de passe dans `DATABASE_URL` est correct
3. Format : `postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/recruitment_consolidation`

### Erreur : "database does not exist"
**Cause** : La base de données n'a pas été créée

**Solution** :
\`\`\`bash
psql -U postgres
CREATE DATABASE recruitment_consolidation;
\q
\`\`\`

### Erreur : "relation does not exist"
**Cause** : Les tables n'ont pas été créées

**Solution** :
Exécutez le script d'initialisation :
\`\`\`bash
# Windows
Get-Content scripts/01-init-database.sql | psql -U postgres -d recruitment_consolidation

# macOS/Linux
psql -U postgres -d recruitment_consolidation < scripts/01-init-database.sql
\`\`\`

### Port 3000 déjà utilisé
**Solution** :
\`\`\`bash
npm run dev -- -p 3001
\`\`\`
Puis ouvrez http://localhost:3001

### L'application ne démarre pas
**Solution** :
1. Supprimez le dossier `node_modules`
2. Supprimez le fichier `package-lock.json`
3. Réinstallez : `npm install`
4. Relancez : `npm run dev`

---

## 📊 Fonctionnalités Complètes

### ✅ Authentification
- Inscription avec rôles (WFM / JURY)
- Connexion sécurisée
- Sessions persistantes
- Protection des routes par rôle

### ✅ Gestion des Candidats (WFM)
- Ajout de candidats avec tous les champs
- Modification des informations
- Suppression de candidats
- Recherche et filtrage par métier
- Liste complète avec statut

### ✅ Gestion des Jurys (WFM)
- Ajout de membres du jury
- 4 types de rôles : DRH, EPC, Représentant du Métier, WFM
- Modification et suppression
- Vérification d'unicité (un utilisateur = un membre)

### ✅ Saisie des Notes
- **WFM** : Toutes les notes techniques
  - Test Excel, Saisie (MPM + %), Dictée
  - Simulation Vente, Test Psychotechnique, Exercice d'Analyse
- **Jurys** : Uniquement Face à Face (Phase 1 et 2)
- Calcul automatique des moyennes Face à Face

### ✅ Consolidation Automatique
- Vérification des critères par métier
- Calcul automatique de la décision (RECRUTÉ / NON RECRUTÉ)
- Affichage visuel des critères validés/non validés
- Panneau de consolidation en temps réel

### ✅ Résultats et Export
- Dashboard avec statistiques par métier
- Tableau complet des résultats
- Export Excel (CSV) avec toutes les colonnes
- Export PDF individuel par candidat
- Filtrage par métier et décision

### ✅ Design
- Couleurs : Orange (#FF6B00), Blanc, Noir
- Interface responsive (mobile, tablette, desktop)
- Thème cohérent avec shadcn/ui
- Accessibilité optimisée

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez d'abord la section **Dépannage** ci-dessus
2. Consultez le fichier `README.md` pour plus de détails
3. Contactez l'équipe WFM

---

## 🎉 Félicitations !

Votre application de consolidation des notes de recrutement est maintenant opérationnelle !

**Prochaines étapes** :
1. Créez votre compte WFM
2. Ajoutez quelques candidats de test
3. Créez des comptes Jury
4. Testez le processus complet de saisie des notes
5. Consultez les résultats et exportez les données

Bonne utilisation ! 🚀
