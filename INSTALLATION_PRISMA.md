# 📘 Guide d'Installation Complet avec Prisma

Ce guide vous accompagne pas à pas pour installer et configurer l'application de consolidation des notes de recrutement avec **Prisma** et **PostgreSQL**.

## 📑 Table des Matières

1. [Installation de PostgreSQL](#1-installation-de-postgresql)
2. [Configuration de la Base de Données](#2-configuration-de-la-base-de-données)
3. [Installation du Projet](#3-installation-du-projet)
4. [Configuration de Prisma](#4-configuration-de-prisma)
5. [Lancement de l'Application](#5-lancement-de-lapplication)
6. [Création du Premier Utilisateur](#6-création-du-premier-utilisateur)
7. [Utilisation de Prisma Studio](#7-utilisation-de-prisma-studio)
8. [Dépannage Avancé](#8-dépannage-avancé)

---

## 1. Installation de PostgreSQL

### Windows

**Option 1 : Installateur Officiel**
1. Téléchargez PostgreSQL depuis https://www.postgresql.org/download/windows/
2. Lancez l'installateur
3. Suivez les étapes :
   - Choisissez le répertoire d'installation
   - Sélectionnez les composants (PostgreSQL Server, pgAdmin 4)
   - Définissez un mot de passe pour l'utilisateur `postgres` (NOTEZ-LE !)
   - Port par défaut : 5432
4. Terminez l'installation

**Option 2 : Chocolatey**
\`\`\`bash
choco install postgresql
\`\`\`

**Vérification**
\`\`\`bash
psql --version
# Devrait afficher : psql (PostgreSQL) 14.x ou supérieur
\`\`\`

### macOS

**Avec Homebrew**
\`\`\`bash
# Installer PostgreSQL
brew install postgresql@14

# Démarrer le service
brew services start postgresql@14

# Vérifier l'installation
psql --version
\`\`\`

### Linux (Ubuntu/Debian)

\`\`\`bash
# Mettre à jour les paquets
sudo apt update

# Installer PostgreSQL
sudo apt install postgresql postgresql-contrib

# Démarrer le service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Vérifier le statut
sudo systemctl status postgresql
\`\`\`

---

## 2. Configuration de la Base de Données

### Créer la Base de Données

**Windows/macOS**
\`\`\`bash
# Se connecter à PostgreSQL
psql -U postgres

# Vous serez invité à entrer le mot de passe défini lors de l'installation
\`\`\`

**Linux**
\`\`\`bash
# Se connecter en tant qu'utilisateur postgres
sudo -u postgres psql
\`\`\`

**Dans le shell PostgreSQL**
\`\`\`sql
-- Créer la base de données
CREATE DATABASE recruitment_consolidation;

-- Vérifier la création
\l

-- Quitter
\q
\`\`\`

### Créer un Utilisateur Dédié (Optionnel mais Recommandé)

\`\`\`sql
-- Créer un utilisateur
CREATE USER recruitment_user WITH PASSWORD 'votre_mot_de_passe_securise';

-- Donner les privilèges
GRANT ALL PRIVILEGES ON DATABASE recruitment_consolidation TO recruitment_user;

-- Quitter
\q
\`\`\`

---

## 3. Installation du Projet

### Télécharger le Projet

**Option 1 : Téléchargement ZIP**
1. Téléchargez le fichier ZIP du projet
2. Extrayez-le dans un dossier de votre choix
3. Ouvrez un terminal dans ce dossier

**Option 2 : Git Clone**
\`\`\`bash
git clone <url-du-repo>
cd recruitment-consolidation
\`\`\`

### Installer les Dépendances

\`\`\`bash
# Avec npm
npm install

# Avec yarn
yarn install

# Avec pnpm
pnpm install
\`\`\`

---

## 4. Configuration de Prisma

### Étape 1 : Créer le Fichier .env

Copiez le fichier `.env.example` en `.env` :

\`\`\`bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
\`\`\`

### Étape 2 : Configurer DATABASE_URL

Ouvrez le fichier `.env` et modifiez la ligne `DATABASE_URL` :

**Format général**
\`\`\`env
DATABASE_URL="postgresql://UTILISATEUR:MOT_DE_PASSE@HOTE:PORT/NOM_BASE"
\`\`\`

**Exemples**

Avec l'utilisateur par défaut `postgres` :
\`\`\`env
DATABASE_URL="postgresql://postgres:mon_mot_de_passe@localhost:5432/recruitment_consolidation"
\`\`\`

Avec un utilisateur dédié :
\`\`\`env
DATABASE_URL="postgresql://recruitment_user:mot_de_passe_securise@localhost:5432/recruitment_consolidation"
\`\`\`

### Étape 3 : Configurer Better-Auth

Dans le même fichier `.env`, générez un secret aléatoire :

**Générer un secret (recommandé)**
\`\`\`bash
# Sur macOS/Linux
openssl rand -base64 32

# Sur Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
\`\`\`

Copiez le résultat dans `.env` :
\`\`\`env
BETTER_AUTH_SECRET="le_secret_genere_ici"
BETTER_AUTH_URL="http://localhost:3000"
\`\`\`

### Étape 4 : Initialiser Prisma

\`\`\`bash
# 1. Générer le client Prisma
npx prisma generate

# 2. Créer les tables dans la base de données
npx prisma db push

# Vous devriez voir :
# ✔ Generated Prisma Client
# ✔ Your database is now in sync with your Prisma schema
\`\`\`

### Étape 5 : Vérifier avec Prisma Studio (Optionnel)

\`\`\`bash
npx prisma studio
\`\`\`

Cela ouvrira une interface web sur http://localhost:5555 où vous pouvez visualiser et modifier vos données.

---

## 5. Lancement de l'Application

\`\`\`bash
# Démarrer le serveur de développement
npm run dev
# ou
yarn dev
# ou
pnpm dev
\`\`\`

L'application sera accessible sur **http://localhost:3000**

---

## 6. Création du Premier Utilisateur

### Créer le Compte WFM (Administrateur)

1. Ouvrez votre navigateur sur http://localhost:3000
2. Cliquez sur **S'inscrire** ou allez sur http://localhost:3000/auth/signup
3. Remplissez le formulaire :
   - **Nom** : Votre nom
   - **Email** : votre.email@example.com
   - **Mot de passe** : Un mot de passe sécurisé
   - **Rôle** : Sélectionnez **WFM**
4. Cliquez sur **S'inscrire**
5. Vous serez redirigé vers la page de connexion
6. Connectez-vous avec vos identifiants

### Créer des Comptes Jury

1. Connectez-vous en tant que WFM
2. Allez dans **Gestion des Jurys** depuis le menu
3. Pour chaque membre du jury :
   - Créez d'abord un compte utilisateur avec le rôle **JURY** via http://localhost:3000/auth/signup
   - Ensuite, ajoutez-le comme membre du jury avec son type (DRH, EPC, Représentant du Métier, WFM)

---

## 7. Utilisation de Prisma Studio

Prisma Studio est une interface graphique pour gérer vos données.

### Lancer Prisma Studio

\`\`\`bash
npx prisma studio
\`\`\`

Ouvrez http://localhost:5555 dans votre navigateur.

### Fonctionnalités

- **Visualiser** toutes les tables et leurs données
- **Ajouter** de nouvelles entrées
- **Modifier** des entrées existantes
- **Supprimer** des entrées
- **Filtrer** et **rechercher** dans les données

---

## 8. Dépannage Avancé

### Problème : "Client Prisma not generated"

**Solution**
\`\`\`bash
npx prisma generate
\`\`\`

### Problème : "relation does not exist"

**Solution**
\`\`\`bash
# Recréer toutes les tables
npx prisma db push --force-reset

# ATTENTION : Cela supprimera toutes les données existantes
\`\`\`

### Problème : Erreur de connexion à PostgreSQL

**Vérifier que PostgreSQL est en cours d'exécution**

Windows :
\`\`\`bash
pg_ctl status
\`\`\`

macOS :
\`\`\`bash
brew services list | grep postgresql
\`\`\`

Linux :
\`\`\`bash
sudo systemctl status postgresql
\`\`\`

**Redémarrer PostgreSQL si nécessaire**

Windows :
\`\`\`bash
pg_ctl restart
\`\`\`

macOS :
\`\`\`bash
brew services restart postgresql@14
\`\`\`

Linux :
\`\`\`bash
sudo systemctl restart postgresql
\`\`\`

### Problème : Mot de passe PostgreSQL incorrect

**Réinitialiser le mot de passe**

Linux/macOS :
\`\`\`bash
sudo -u postgres psql
ALTER USER postgres PASSWORD 'nouveau_mot_de_passe';
\q
\`\`\`

Windows :
\`\`\`bash
psql -U postgres
ALTER USER postgres PASSWORD 'nouveau_mot_de_passe';
\q
\`\`\`

Mettez à jour le `.env` avec le nouveau mot de passe.

### Problème : Port 5432 déjà utilisé

**Vérifier quel processus utilise le port**

Windows :
\`\`\`bash
netstat -ano | findstr :5432
\`\`\`

macOS/Linux :
\`\`\`bash
lsof -i :5432
\`\`\`

**Changer le port PostgreSQL ou arrêter le processus conflictuel**

### Problème : Migrations Prisma en conflit

**Réinitialiser complètement**
\`\`\`bash
# ATTENTION : Supprime toutes les données
npx prisma migrate reset

# Puis recréer
npx prisma db push
\`\`\`

### Problème : Better-Auth ne fonctionne pas

**Vérifications**
1. `BETTER_AUTH_SECRET` est défini dans `.env`
2. `BETTER_AUTH_URL` correspond à votre URL (http://localhost:3000)
3. Les tables better-auth sont créées :
   \`\`\`bash
   npx prisma studio
   # Vérifiez que les tables "user", "session", "account" existent
   \`\`\`

### Problème : L'application ne démarre pas

**Vérifier les logs**
\`\`\`bash
npm run dev
# Lisez attentivement les messages d'erreur
\`\`\`

**Erreurs courantes**
- Port 3000 déjà utilisé → Utilisez `PORT=3001 npm run dev`
- Module manquant → Relancez `npm install`
- Erreur TypeScript → Vérifiez les fichiers modifiés

---

## 🎉 Félicitations !

Votre application est maintenant installée et configurée avec Prisma et PostgreSQL. Vous pouvez commencer à l'utiliser pour gérer vos recrutements.

## 📚 Ressources Supplémentaires

- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Documentation Better-Auth](https://www.better-auth.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes non couverts par ce guide :
1. Vérifiez les logs dans le terminal
2. Consultez Prisma Studio pour voir l'état de la base de données
3. Vérifiez que toutes les variables d'environnement sont correctement définies
