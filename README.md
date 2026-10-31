# MDD - Monde de Dév

MDD (Monde de Dév) est un réseau social destiné aux développeurs, développé dans le cadre du projet P5 de la formation OpenClassrooms Lead Developer JavaScript (RNCP 7).

L'objectif du MVP est de permettre aux utilisateurs de partager leurs connaissances autour de thèmes de programmation, de publier des articles et d'échanger par commentaires.

## 1. Fonctionnalités prévues

- Inscription et connexion des utilisateurs.
- Consultation et modification du profil.
- Consultation des thèmes de programmation.
- Abonnement et désabonnement aux thèmes.
- Fil d'actualité personnalisé avec tri chronologique.
- Publication et consultation d'articles.
- Publication de commentaires.

Ces fonctionnalités constituent le périmètre du MVP et seront implémentées progressivement.

## 2. Stack technique

| Partie           | Technologies                                     |
| ---------------- | ------------------------------------------------ |
| Front-end        | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Back-end         | Node.js 22, Express 5, TypeScript                |
| Base de données  | PostgreSQL 17                                    |
| ORM              | Prisma 7 et adaptateur PostgreSQL                |
| Validation       | Zod 4                                            |
| Sécurité         | Helmet, CORS, Argon2                             |
| Conteneurisation | Docker Compose                                   |
| Outils           | Git, GitHub, VS Code, DBeaver                    |

L'application repose sur une architecture séparant le front-end Next.js et l'API REST Express, avec un seul repository GitHub.

## 3. Structure du projet

```text
mdd/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   └── package.json
├── backend/
│   ├── src/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── prisma7.config.ts
│   └── package.json
├── docker-compose.yml
├── package.json
├── .env.example
├── DOCUMENTATION.md
└── README.md
```

Les pages Next.js communiqueront avec l'API REST Express. Les traitements métier seront organisés en services, tandis que Prisma assurera l'accès à PostgreSQL.

## 4. Prérequis

- Node.js 22 et npm.
- Docker Desktop avec Docker Compose.
- Git.
- Un IDE, de préférence Visual Studio Code.

DBeaver est facultatif et permet d'explorer visuellement les données PostgreSQL.

## 5. Installation

Cloner le repository :

```bash
git clone https://github.com/AlainDev97/DFSJS-Prenez-en-charge-le-d-veloppement-d-une-application-full-stack-JavaScript-compl-te.git
```

Se placer dans le dossier cloné.

Installer les dépendances des trois parties du projet :

```bash
npm ci
npm --prefix frontend ci
npm --prefix backend ci
```

## 6. Configuration des variables d'environnement

Créer un fichier `.env` à la racine du repository à partir de `.env.example`.

Renseigner les variables PostgreSQL :

```dotenv
POSTGRES_USER=mdd_user
POSTGRES_PASSWORD=change_me
POSTGRES_DB=mdd_db
```

Créer ensuite un fichier `backend/.env` à partir de `backend/.env.example` :

```dotenv
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL="postgresql://mdd_user:change_me@localhost:5433/mdd_db?schema=public"
SEED_PASSWORD="ChangeMe123!"
```

Remplacer les mots de passe d'exemple par des valeurs locales sécurisées. Le mot de passe PostgreSQL doit correspondre dans les deux fichiers.

Les fichiers `.env` ne doivent jamais être ajoutés au repository Git.

## 7. Base de données PostgreSQL

Depuis la racine du projet, démarrer PostgreSQL :

```bash
npm run db:up
```

Vérifier l'état du conteneur :

```bash
docker compose ps
```

La base `mdd_db` est accessible localement sur le port `5433`.

### Initialiser Prisma

Pour une première installation, générer Prisma Client :

```bash
npm --prefix backend exec -- prisma generate
```

Appliquer les migrations existantes :

```bash
npm --prefix backend exec -- prisma migrate deploy
```

Les tables créées sont `User`, `Topic`, `Subscription`, `Post` et `Comment`, ainsi que la table technique `_prisma_migrations`.

### Données de test

Pour peupler la base :

```bash
npm run db:seed
```

Le seed crée deux utilisateurs fictifs, quatre thèmes, quatre abonnements, deux articles et deux commentaires.

Le script peut être relancé sans créer de doublons pour les données de démonstration qu'il gère.

## 8. Démarrer l'application

Depuis la racine du projet :

```bash
npm run dev
```

Cette commande démarre simultanément Next.js et Express.

| Service                 | Adresse                             |
| ----------------------- | ----------------------------------- |
| Front-end Next.js       | http://localhost:3000               |
| API Express             | http://localhost:4000               |
| Vérification API        | http://localhost:4000/api/health    |
| Vérification PostgreSQL | http://localhost:4000/api/health/db |

Les endpoints de vérification permettent de confirmer le fonctionnement de l'environnement.

Pour arrêter les serveurs applicatifs, utiliser `Ctrl+C`.

Pour arrêter PostgreSQL :

```bash
npm run db:down
```

Le volume Docker conserve les données lors d'un arrêt normal.

## 9. Scripts utiles

| Commande               | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Démarre le front-end et le back-end                    |
| `npm run dev:frontend` | Démarre uniquement Next.js                             |
| `npm run dev:backend`  | Démarre uniquement Express                             |
| `npm run db:up`        | Démarre PostgreSQL                                     |
| `npm run db:down`      | Arrête PostgreSQL                                      |
| `npm run db:migrate`   | Crée ou applique une migration de développement Prisma |
| `npm run db:seed`      | Ajoute les données de test                             |
| `npm run build`        | Compile les applications front-end et back-end         |

Les tests automatisés seront ajoutés lors des étapes de développement et de validation du MVP.

## 10. Maquettes

Les interfaces desktop et mobile seront intégrées à partir des maquettes Figma fournies dans le cadre du projet OpenClassrooms.

La réalisation suivra les spécifications fonctionnelles, en privilégiant des composants réutilisables et un affichage responsive.

## 11. Documentation technique

Le fichier `DOCUMENTATION.md` présente les objectifs fonctionnels, les choix d'architecture, l'API REST prévue, les schémas de données ainsi que la stratégie de tests.

Les résultats de tests, les mesures de performance, la revue technique et les annexes seront complétés au cours du développement.
