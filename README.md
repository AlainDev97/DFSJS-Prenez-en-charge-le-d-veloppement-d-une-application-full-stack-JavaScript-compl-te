# MDD — Monde de Dév

MDD (Monde de Dév) est un réseau social destiné aux développeurs,
réalisé dans le cadre du projet P5 de la formation OpenClassrooms
Lead Developer JavaScript (RNCP 7).

Cette application constitue un MVP permettant aux développeurs
de partager leurs connaissances et d'échanger autour de thèmes
liés à la programmation.

## 1. Fonctionnalités

- Inscription, connexion et déconnexion.
- Consultation et modification du profil utilisateur.
- Consultation des thèmes de programmation.
- Abonnement et désabonnement aux thèmes.
- Fil d'actualité personnalisé selon les abonnements.
- Tri chronologique des articles.
- Création et consultation des articles.
- Publication de commentaires.
- Interface responsive sur ordinateur et mobile.
- Mentions légales et politique de confidentialité.

## 2. Stack technique

| Partie           | Technologies                                         |
| ---------------- | ---------------------------------------------------- |
| Front-end        | Next.js 16, React 19, TypeScript, Tailwind CSS 4     |
| Back-end         | Node.js 22, Express 5, TypeScript                    |
| Base de données  | PostgreSQL 17                                        |
| ORM              | Prisma 7                                             |
| Validation       | Zod 4                                                |
| Authentification | Express Session, Argon2                              |
| Sécurité         | Helmet, CORS, CSRF, Rate Limiting                    |
| Tests            | Vitest, React Testing Library, Supertest, Playwright |
| Qualité          | ESLint, TypeScript, Lighthouse, npm audit            |
| Conteneurisation | Docker Compose                                       |
| Versionnement    | Git, GitHub                                          |

## 3. Architecture

L'application repose sur une architecture séparant le front-end
Next.js et le back-end Express au sein d'un monorepo.

Le front-end communique avec le back-end via une API REST.
Le back-end sépare les responsabilités entre les routes,
les contrôleurs, les services et les repositories.

```text
Utilisateur
    |
    v
Next.js / React
    |
    v
API REST Express
    |
    v
Contrôleurs
    |
    v
Services
    |
    v
Repositories
    |
    v
Prisma ORM
    |
    v
PostgreSQL
```

## 4. Structure du projet

```text
mdd/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── public/
│   ├── tests/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── services/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── tests/
│   ├── prisma7.config.ts
│   └── package.json
├── e2e/
├── scripts/
├── docs/
│   ├── lighthouse/
│   └── screenshots/
├── docker-compose.yml
├── docker-compose.e2e.yml
├── playwright.config.ts
├── package.json
├── .env.example
├── .env.e2e.example
├── DOCUMENTATION.md
└── README.md
```

## 5. Prérequis

- Node.js 22.22.2.
- npm.
- Git.
- Docker Desktop avec Docker Compose.

Visual Studio Code et DBeaver sont recommandés,
mais ne sont pas indispensables.

## 6. Installation

Cloner le repository :

```bash
git clone https://github.com/AlainDev97/DFSJS-Prenez-en-charge-le-d-veloppement-d-une-application-full-stack-JavaScript-compl-te.git
```

Se placer dans le dossier cloné :

```bash
cd DFSJS-Prenez-en-charge-le-d-veloppement-d-une-application-full-stack-JavaScript-compl-te
```

Installer les dépendances :

```bash
npm ci
npm --prefix frontend ci
npm --prefix backend ci
```

## 7. Variables d'environnement

### 7.1. Racine du projet

Créer un fichier `.env` à partir de `.env.example`.

```dotenv
POSTGRES_USER=mdd_user
POSTGRES_PASSWORD=change_me
POSTGRES_DB=mdd_db
```

### 7.2. Back-end

Créer un fichier `backend/.env` à partir de
`backend/.env.example`.

```dotenv
PORT=4000
FRONTEND_URL=http://localhost:3000

DATABASE_URL="postgresql://mdd_user:change_me@localhost:5433/mdd_db?schema=public"

SEED_PASSWORD="ChangeMe123!"

SESSION_SECRET="replace_with_a_random_secret_at_least_32_bytes"
```

Le mot de passe PostgreSQL doit correspondre à celui défini
dans le fichier `.env` à la racine.

Le secret de session doit contenir au moins 32 octets.
Il peut être généré avec la commande suivante :

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### 7.3. Front-end

Le front-end utilise par défaut l'API disponible sur
`http://localhost:4000`.

Si nécessaire, créer un fichier `frontend/.env.local` :

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
API_INTERNAL_URL=http://localhost:4000
```

| Variable              | Description                                    |
| --------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Adresse de l'API utilisée par le navigateur    |
| `API_INTERNAL_URL`    | Adresse de l'API utilisée côté serveur Next.js |

Ces variables sont facultatives dans l'environnement local standard.

### 7.4. Confidentialité

Les valeurs présentées sont des exemples et doivent être
remplacées par des valeurs locales sécurisées.

Les fichiers contenant des secrets ne doivent jamais être
versionnés sur Git.

## 8. Initialisation de la base de données

Démarrer PostgreSQL avec Docker :

```bash
npm run db:up
```

Vérifier l'état du conteneur :

```bash
docker compose ps
```

Attendre que le conteneur soit opérationnel avant de continuer.

Depuis le dossier `backend`, appliquer les migrations
et générer le client Prisma :

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
cd ..
```

Insérer les données fictives :

```bash
npm run db:seed
```

Le seed initialise notamment :

- Deux utilisateurs fictifs.
- Quatre thèmes.
- Quatre abonnements.
- Deux articles.
- Deux commentaires.

Comptes de démonstration :

| Adresse e-mail     | Pseudonyme |
| ------------------ | ---------- |
| alice@example.test | alice_dev  |
| bob@example.test   | bob_dev    |

Le mot de passe initial correspond à la variable `SEED_PASSWORD`.

Le seed ne réinitialise pas les mots de passe des comptes
déjà existants.

## 9. Démarrage de l'application

Depuis la racine du projet :

```bash
npm run dev
```

Cette commande démarre simultanément Next.js et Express.

| Service                 | Adresse                             |
| ----------------------- | ----------------------------------- |
| Front-end               | http://localhost:3000               |
| Back-end                | http://localhost:4000               |
| Vérification API        | http://localhost:4000/api/health    |
| Vérification PostgreSQL | http://localhost:4000/api/health/db |
| PostgreSQL              | localhost:5433                      |

Pour arrêter les serveurs, utiliser `Ctrl+C`.

Pour arrêter PostgreSQL :

```bash
npm run db:down
```

Les données sont conservées dans un volume Docker persistant.

## 10. Tests automatisés

Le projet dispose de tests unitaires, de tests de composants,
de tests d'intégration HTTP et de tests end-to-end.

### 10.1. Tests front-end

```bash
npm --prefix frontend run test
```

### 10.2. Tests back-end

```bash
npm --prefix backend run test
```

### 10.3. Couverture du code

```bash
npm run test:coverage
npm run test:summary
```

L'objectif de couverture est d'atteindre au moins 70 %
sur les indicateurs suivants :

- Instructions.
- Branches.
- Fonctions.
- Lignes.

Les rapports HTML sont disponibles dans :

- `frontend/coverage/index.html`
- `backend/coverage/index.html`

Les tests Playwright ne sont pas inclus dans les pourcentages
de couverture Vitest.

### 10.4. Configuration des tests E2E

Installer Chromium pour Playwright :

```bash
npx playwright install chromium
```

Créer un fichier `.env.e2e` à partir de `.env.e2e.example`.

```dotenv
E2E_POSTGRES_PASSWORD="change_me_e2e"
E2E_EMAIL="alice@example.test"
E2E_PASSWORD="ChangeMeE2E123!"
E2E_SESSION_SECRET="replace_with_a_random_secret_at_least_32_bytes"
```

| Variable                | Description                                  |
| ----------------------- | -------------------------------------------- |
| `E2E_POSTGRES_PASSWORD` | Mot de passe PostgreSQL dédié aux tests      |
| `E2E_EMAIL`             | Compte fictif Alice, valeur imposée          |
| `E2E_PASSWORD`          | Mot de passe de test, au moins 12 caractères |
| `E2E_SESSION_SECRET`    | Secret de session de 32 octets minimum       |

Le mot de passe E2E doit également respecter les règles
de complexité du seed.

Les tests E2E utilisent un environnement isolé :

| Service        | Port |
| -------------- | ---- |
| Next.js E2E    | 3100 |
| Express E2E    | 4100 |
| PostgreSQL E2E | 5434 |

La base `mdd_e2e_db` est distincte de la base de développement.

### 10.5. Campagne complète

Docker Desktop doit être démarré.

Arrêter les serveurs Next.js et Express de développement
avant de lancer la campagne.

```bash
npm run test:all
```

Cette commande exécute successivement :

1. Les tests Vitest et leur couverture.
2. Le démarrage de PostgreSQL E2E.
3. Les migrations et l'insertion des données E2E.
4. Les tests Playwright.
5. Le résumé global de couverture.

Consulter le rapport Playwright :

```bash
npm run test:e2e:report
```

Arrêter la base E2E après les tests :

```bash
npm run db:e2e:down
```

## 11. Qualité et sécurité

Vérifier la qualité du code :

```bash
npm --prefix frontend run lint
npm --prefix backend run typecheck
npm run build
```

Vérifier les vulnérabilités des dépendances :

```bash
npm audit
npm --prefix frontend audit
npm --prefix backend audit
```

Les principales mesures de sécurité implémentées sont :

- Hachage des mots de passe avec Argon2.
- Sessions persistées dans PostgreSQL.
- Cookies HttpOnly et SameSite.
- Cookie Secure en production.
- Protection CSRF.
- Validation des données avec Zod.
- Protection des routes nécessitant une authentification.
- Limitation des tentatives de connexion et d'inscription.
- Réponses génériques en cas d'erreur interne.

Les interfaces ont également fait l'objet d'audits Lighthouse.

## 12. Scripts utiles

Les commandes suivantes sont exécutées depuis la racine.

| Commande                  | Description                          |
| ------------------------- | ------------------------------------ |
| `npm run dev`             | Démarre l'application                |
| `npm run dev:frontend`    | Démarre Next.js                      |
| `npm run dev:backend`     | Démarre Express                      |
| `npm run db:up`           | Démarre PostgreSQL                   |
| `npm run db:down`         | Arrête PostgreSQL                    |
| `npm run db:migrate`      | Gère les migrations de développement |
| `npm run db:seed`         | Initialise les données fictives      |
| `npm run build`           | Compile le front-end et le back-end  |
| `npm run test:coverage`   | Génère les rapports de couverture    |
| `npm run test:summary`    | Affiche la couverture globale        |
| `npm run db:e2e:up`       | Démarre PostgreSQL E2E               |
| `npm run db:e2e:prepare`  | Initialise la base E2E               |
| `npm run db:e2e:down`     | Arrête PostgreSQL E2E                |
| `npm run test:e2e`        | Exécute Playwright                   |
| `npm run test:e2e:report` | Affiche le rapport Playwright        |
| `npm run test:all`        | Exécute la campagne complète         |

## 13. Documentation

- [Documentation technique](DOCUMENTATION.md)
- [Captures des interfaces](docs/screenshots/)
- [Audits Lighthouse](docs/lighthouse/)

Les interfaces sont réalisées à partir des maquettes Figma
fournies dans le cadre du projet OpenClassrooms.

Les pages réglementaires sont accessibles aux adresses suivantes :

- http://localhost:3000/legal
- http://localhost:3000/privacy

## 14. Périmètre du projet

MDD est un MVP pédagogique destiné à une utilisation locale
et à la validation des fonctionnalités demandées.

Le déploiement public et les fonctionnalités avancées
d'un réseau social ne font pas partie de cette première version.

## Auteur

Alain Bonneau

Formation Lead Developer JavaScript — RNCP 7

OpenClassrooms
