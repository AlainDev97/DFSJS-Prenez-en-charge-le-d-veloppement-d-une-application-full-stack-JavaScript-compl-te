# Documentation et rapport technique — MDD (Monde de Dév)

**Projet :** P5 — OpenClassrooms, Lead Developer JavaScript (RNCP 7), option B  
**Auteur :** Alain Bonneau  
**Version :** 1.0.0  
**Dernière mise à jour :** 23/11/2026  
**Dépôt :** [GitHub — Projet MDD](https://github.com/AlainDev97/DFSJS-Prenez-en-charge-le-d-veloppement-d-une-application-full-stack-JavaScript-compl-te)  
**Périmètre :** MVP pédagogique, exécuté et validé en environnement local.

---

## 1. Présentation du projet

### 1.1. Contexte et objectifs

ORION souhaite disposer d'un premier réseau social dédié aux développeurs : **MDD — Monde de Dév**. Ce MVP permet de partager des connaissances autour de thèmes techniques et de valider le parcours utilisateur avant toute évolution éventuelle du produit.

La réalisation s'appuie sur les spécifications et les maquettes Figma fournies pour le scénario fictif. Les priorités sont la conformité fonctionnelle, la maintenabilité, la sécurité des accès et la vérification du fonctionnement par des tests automatisés.

### 1.2. Périmètre fonctionnel réalisé

| Domaine              | Fonctionnalités mises en œuvre                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Comptes              | Inscription, connexion, déconnexion et session persistante                                                                    |
| Profil               | Consultation, modification du pseudonyme et de l'e-mail, changement du mot de passe après vérification du mot de passe actuel |
| Thèmes               | Consultation et recherche des thèmes de programmation                                                                         |
| Abonnements          | Abonnement et désabonnement à un thème                                                                                        |
| Articles             | Fil personnalisé selon les thèmes suivis, tri chronologique, création et consultation d'articles                              |
| Commentaires         | Publication et affichage des commentaires liés aux articles                                                                   |
| Interface            | Pages adaptées aux écrans desktop et mobile, messages de chargement et d'erreur                                               |
| Informations légales | Pages de mentions légales et de politique de confidentialité                                                                  |

La première fonctionnalité intégrée de bout en bout a été la consultation des thèmes, depuis PostgreSQL jusqu'à l'affichage React en passant par l'API Express. Elle a servi à vérifier l'architecture avant de développer les autres parcours.

**Hors périmètre du MVP :** messagerie privée, notifications, administration avancée et déploiement public.

## 2. Architecture et conception

### 2.1. Architecture générale

Le projet utilise un **monorepo** avec deux applications distinctes : Next.js pour le front-end et Express pour l'API REST.

```text
Navigateur
    ↓
Next.js 16 / React 19 (pages, composants, formulaires)
    ↓ Requêtes HTTP / Fetch, réponses JSON
API REST Express 5
    ↓
Routes → Contrôleurs → Services métier → Repositories
    ↓
Prisma ORM 7 → PostgreSQL 17
```

- **Présentation :** App Router Next.js, Server Components pour les layouts et vérifications côté serveur, Client Components pour les interactions et les appels API depuis le navigateur.
- **API :** routes REST et contrôleurs Express ; validation des paramètres et des corps avec Zod.
- **Métier :** services responsables des règles fonctionnelles et des erreurs métier.
- **Données :** repositories Prisma isolant les requêtes PostgreSQL.
- **Sécurité transversale :** middlewares de session, authentification, protection CSRF, limitation des tentatives et gestion des erreurs inattendues.

Cette séparation facilite l'isolation des responsabilités, les tests et la maintenance. En contrepartie, elle impose de gérer explicitement CORS, les cookies et la communication entre Next.js et Express. **Aucune Server Action n'est nécessaire aux mutations du MVP : elles utilisent l'API REST.**

### 2.2. Organisation du dépôt

| Emplacement                 | Rôle                                                                       |
| --------------------------- | -------------------------------------------------------------------------- |
| `frontend/app/`             | Pages, layouts, routes publiques et protégées                              |
| `frontend/features/`        | Composants fonctionnels : authentification, thèmes, articles, profil       |
| `frontend/components/`      | Composants de présentation partagés                                        |
| `frontend/lib/`             | Client API, utilitaires et contrôles de session côté serveur               |
| `frontend/tests/`           | Tests Vitest et React Testing Library                                      |
| `backend/src/routes/`       | Déclaration des endpoints                                                  |
| `backend/src/controllers/`  | Entrées HTTP, schémas de validation et réponses                            |
| `backend/src/services/`     | Traitements et règles métier                                               |
| `backend/src/repositories/` | Requêtes via Prisma                                                        |
| `backend/src/middleware/`   | Session, authentification, CSRF, rate limiting, erreurs                    |
| `backend/prisma/`           | Schéma, migrations et données fictives                                     |
| `backend/tests/`            | Tests unitaires et API avec Vitest / Supertest                             |
| `e2e/`                      | Parcours Playwright sur une base PostgreSQL dédiée                         |
| `scripts/`                  | Préparation de l'environnement E2E et calcul de couverture                 |
| `docs/`                     | Captures d'interfaces, résultats Lighthouse, revue technique intermédiaire |

### 2.3. Choix techniques

| Technologie                             | Utilisation et justification                                              |
| --------------------------------------- | ------------------------------------------------------------------------- |
| Next.js 16 / React 19                   | Interface, App Router, composants réutilisables et rendu adapté au besoin |
| TypeScript strict                       | Contrats typés, détection précoce d'erreurs et lisibilité                 |
| Express 5                               | API REST indépendante, structurée en couches et testable                  |
| Prisma 7                                | Accès aux données typé, relations et migrations                           |
| PostgreSQL 17                           | Modèle relationnel et contraintes d'intégrité                             |
| Zod 4                                   | Validation stricte des entrées HTTP                                       |
| Tailwind CSS 4                          | Intégration responsive des maquettes                                      |
| `express-session` / `connect-pg-simple` | Sessions serveur persistées dans PostgreSQL                               |
| Argon2                                  | Hachage et vérification des mots de passe                                 |
| Docker Compose                          | Bases PostgreSQL locales reproductibles                                   |
| Vitest / RTL / Supertest / Playwright   | Tests unitaires, composants, API et parcours réels                        |
| Git / GitHub                            | Historique et versionnement des évolutions                                |

### 2.4. Modèle de données

Le schéma de référence est dans [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma). Il comprend cinq modèles principaux :

| Modèle         | Données et relations principales                                                               |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `User`         | UUID, e-mail et pseudonyme uniques, `passwordHash`, dates, articles, commentaires, abonnements |
| `Topic`        | UUID, nom unique, description facultative, articles et abonnements                             |
| `Subscription` | Association `User`–`Topic`, date, clé primaire composite `(userId, topicId)`                   |
| `Post`         | UUID, titre, contenu, auteur, thème, dates de création et modification                         |
| `Comment`      | UUID, contenu, auteur, article, date de création                                               |

La table `Subscription` matérialise une relation **N:N** entre utilisateurs et thèmes. La clé composée empêche les abonnements en double ; les clés étrangères préservent les relations. Les auteurs sont associés aux opérations depuis la session authentifiée et les dates sont renseignées côté serveur ou base de données. Les migrations sont versionnées dans `backend/prisma/migrations/`.

### 2.5. API REST

Les routes sont définies dans `backend/src/routes/` et montées sous `/api` dans `backend/src/app.ts`.

| Méthode | Endpoint                      | Fonction                                               |
| ------- | ----------------------------- | ------------------------------------------------------ |
| GET     | `/api/health`                 | Vérifier la disponibilité de l'API                     |
| GET     | `/api/health/db`              | Vérifier la connexion PostgreSQL                       |
| GET     | `/api/auth/csrf`              | Récupérer le jeton CSRF de session                     |
| POST    | `/api/auth/register`          | Créer un compte                                        |
| POST    | `/api/auth/login`             | Se connecter et établir la session                     |
| POST    | `/api/auth/logout`            | Détruire la session                                    |
| GET     | `/api/auth/me`                | Consulter le compte authentifié                        |
| PATCH   | `/api/auth/me`                | Modifier le profil après vérification du mot de passe  |
| GET     | `/api/topics`                 | Lister ou rechercher des thèmes (`?search=...`)        |
| GET     | `/api/subscriptions`          | Récupérer ses abonnements                              |
| POST    | `/api/subscriptions`          | S'abonner à un thème                                   |
| DELETE  | `/api/subscriptions/:topicId` | Se désabonner d'un thème                               |
| GET     | `/api/articles?sort=newest`   | Fil d'actualité personnalisé, tri `newest` ou `oldest` |
| GET     | `/api/articles/:id`           | Article et commentaires associés                       |
| POST    | `/api/articles`               | Publier un article                                     |
| POST    | `/api/articles/:id/comments`  | Publier un commentaire                                 |

Les ressources fonctionnelles sont protégées par la session lorsqu'elles nécessitent un utilisateur connecté, y compris la consultation des thèmes dans l'API actuelle. Les réponses utilisent principalement JSON avec `data`, parfois `message`, et les codes HTTP adaptés : `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409` ou `500` suivant le cas.

### 2.6. Exemples de validations Zod

- Inscription : e-mail valide de 255 caractères au maximum ; pseudonyme de 3 à 50 caractères, en minuscules, chiffres ou `_` ; mot de passe de 12 à 128 caractères.
- Profil : nom, e-mail et mot de passe actuel requis ; nouveau mot de passe facultatif, de 12 à 128 caractères.
- Articles : titre de 5 à 255 caractères, contenu de 20 à 10 000 caractères, `topicId` au format UUID.
- Commentaires : contenu de 1 à 2 000 caractères, identifiant d'article UUID.
- Paramètres : recherche de thèmes limitée à 100 caractères ; tri des articles limité à `newest` ou `oldest`.

Les contrôleurs utilisent notamment `z.strictObject()` pour rejeter les propriétés inattendues. Le fil d'actualité est filtré avec Prisma selon les abonnements de l'utilisateur et limité à **50 articles** par requête.

## 3. Interface utilisateur et intégration front/back

Les écrans suivent les maquettes fournies pour MDD, avec des déclinaisons desktop et mobile. Les pages couvrent l'accueil, l'inscription, la connexion, les thèmes, les articles, la création d'article, le détail d'article et le profil.

- Les formulaires interactifs et les listes utilisent des **Client Components** et des appels `fetch` vers l'API Express.
- `frontend/lib/api-client.ts` récupère le jeton via `GET /api/auth/csrf`, puis l'envoie dans l'en-tête `X-CSRF-Token` pour les mutations `POST`, `PATCH` et `DELETE`.
- `frontend/app/(protected)/layout.tsx` vérifie la session côté serveur avant l'accès aux pages protégées.
- `frontend/lib/redirect-if-authenticated.ts` redirige vers `/topics` un utilisateur déjà connecté qui consulte une page d'accueil, de connexion ou d'inscription.
- Les états de chargement, les erreurs réseau et les actions de nouvelle tentative sont gérés sur les écrans concernés.

Les captures des interfaces sont conservées dans [`docs/screenshots/`](docs/screenshots/) : **16 fichiers** couvrant huit vues en formats desktop et mobile. Elles servent de support à la vérification responsive et à la présentation orale ; elles ne constituent pas à elles seules une preuve d'équivalence pixel par pixel aux maquettes.

## 4. Installation et configuration locale

### 4.1. Prérequis

- Node.js **22.22.2** et npm ; Git.
- Docker Desktop avec Docker Compose pour PostgreSQL.
- Navigateur Chromium pour les tests Playwright (installation ci-dessous).

### 4.2. Récupération du projet

```bash
git clone https://github.com/AlainDev97/DFSJS-Prenez-en-charge-le-d-veloppement-d-une-application-full-stack-JavaScript-compl-te.git
cd DFSJS-Prenez-en-charge-le-d-veloppement-d-une-application-full-stack-JavaScript-compl-te
npm ci
npm --prefix frontend ci
npm --prefix backend ci
```

### 4.3. Variables d'environnement

Créer `.env` à partir de `.env.example`, `backend/.env` à partir de `backend/.env.example` et, si nécessaire, `frontend/.env.local`.

**Exemple `.env` (racine) :**

```dotenv
POSTGRES_USER=mdd_user
POSTGRES_PASSWORD=change_me
POSTGRES_DB=mdd_db
```

**Exemple `backend/.env` :**

```dotenv
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL="postgresql://mdd_user:change_me@localhost:5433/mdd_db?schema=public"
SEED_PASSWORD="ChangeMe123!"
SESSION_SECRET="replace_with_a_random_secret_at_least_32_bytes"
```

**Exemple `frontend/.env.local` (facultatif en local standard) :**

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
API_INTERNAL_URL=http://localhost:4000
```

Le mot de passe de `DATABASE_URL` doit correspondre à `POSTGRES_PASSWORD`. Le secret de session doit contenir au moins **32 octets**. Générer une valeur aléatoire avec :

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

**Sécurité :** ces valeurs sont des exemples. Ne pas versionner de vrais secrets : les fichiers `.env` sont exclus de Git.

### 4.4. Préparation de PostgreSQL

```bash
npm run db:up
# Attendre que le conteneur PostgreSQL soit opérationnel.
cd backend
npx prisma migrate deploy
npx prisma generate
cd ..
npm run db:seed
```

Le seed fournit des données fictives : deux comptes, quatre thèmes, quatre abonnements, deux articles et deux commentaires. Les comptes de démonstration sont `alice@example.test` et `bob@example.test` ; le mot de passe initial est celui de `SEED_PASSWORD`. Le seed n'écrase pas les mots de passe déjà enregistrés.

### 4.5. Démarrer et arrêter

```bash
npm run dev
```

| Service                  | Adresse                               |
| ------------------------ | ------------------------------------- |
| Interface Next.js        | `http://localhost:3000`               |
| API Express              | `http://localhost:4000`               |
| Santé API                | `http://localhost:4000/api/health`    |
| Santé base               | `http://localhost:4000/api/health/db` |
| PostgreSQL développement | `localhost:5433`                      |

`npm run dev` démarre simultanément le front-end et le back-end. Interrompre les serveurs avec `Ctrl+C` ; `npm run db:down` arrête PostgreSQL sans supprimer son volume de données persistant.

## 5. Authentification, sécurité et gestion des erreurs

### 5.1. Sessions et autorisations

- `express-session` et `connect-pg-simple` enregistrent les sessions serveur dans PostgreSQL, table `user_sessions`.
- Le cookie `mdd.sid` utilise `HttpOnly` et `SameSite=Lax` ; `Secure` est activé si `NODE_ENV=production`.
- Les mots de passe sont hachés et vérifiés avec **Argon2** ; l'API retourne les données publiques du compte, sans `passwordHash`.
- Le middleware `requireAuth` protège les routes privées ; les identifiants d'auteur proviennent de la session et non de la requête du client.
- Les changements de profil exigent la vérification du mot de passe actuel ; la connexion régénère l'identifiant de session.

### 5.2. Protections HTTP

- `helmet` : en-têtes HTTP de sécurité.
- `cors` : origine du front-end configurée et transmission des cookies autorisée.
- `csrfProtection` : vérification d'un jeton CSRF pour les méthodes de modification ; méthodes de lecture exclues.
- `express-rate-limit` : limite de **10 échecs de connexion en 15 minutes** par IP et de **5 inscriptions par heure** par IP.
- Zod et Prisma : validation des données et opérations relationnelles typées, sans interpolation SQL manuelle dans les repositories.

### 5.3. Middleware centralisé d'erreurs

Le fichier `backend/src/middleware/error.middleware.ts` fournit `errorHandler`, déclaré **après toutes les routes** dans `backend/src/app.ts`.

- Les contrôleurs répondent eux-mêmes aux erreurs métier attendues (`400`, `401`, `404`, `409`, etc.).
- Dans Express 5, les exceptions inattendues levées par les contrôleurs `async` atteignent le middleware centralisé.
- Le middleware conserve le code de certaines erreurs HTTP `4xx`, notamment un corps JSON invalide.
- Pour une erreur interne, il journalise l'exception côté serveur et renvoie au navigateur un message JSON générique avec statut `500` : `{"error":"Une erreur interne est survenue."}`.

Les **deux tests** du middleware vérifient la réponse 500 sans fuite du message technique et la réponse 400 sur JSON invalide. Les détails des erreurs restent accessibles dans les journaux serveur ; pour un hébergement public futur, un filtrage des données sensibles et une stratégie de journalisation devront être étudiés.

## 6. Tests automatisés et couverture

### 6.1. Stratégie

| Niveau               | Outils                                            | Objectif                                                       |
| -------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| Unitaire / composant | Vitest et React Testing Library                   | Services, règles métier, formulaires et interactions           |
| Intégration HTTP     | Vitest et Supertest                               | Authentification, validations, codes HTTP et contrôles d'accès |
| End-to-end           | Playwright, Chromium, Express, Prisma, PostgreSQL | Parcours utilisateurs et persistance réelle                    |

Les tests isolent les dépendances avec des mocks lorsque cela est utile. Les scénarios E2E utilisent une base PostgreSQL distincte et vérifient les interactions avec de vraies données.

### 6.2. Dernière campagne complète — 23/11/2026

La commande **`npm run test:all` s'est terminée avec succès** après l'ajout du middleware d'erreurs.

| Suite                 |                Fichiers | Tests réussis | Échecs |
| --------------------- | ----------------------: | ------------: | -----: |
| Front-end Vitest      |                       9 |        **56** |      0 |
| Back-end Vitest       |                      12 |       **103** |      0 |
| Playwright / Chromium | 4 fichiers de scénarios |         **5** |      0 |
| **Total**             |                         |       **164** |  **0** |

Les cinq parcours E2E valident : la publication d'un article et d'un commentaire avec persistance ; la redirection d'un visiteur non authentifié ; la connexion et la navigation ; l'inscription et la modification du profil ; l'abonnement et le désabonnement.

La préparation E2E a confirmé l'application de la migration disponible, la génération du client Prisma et l'insertion des données fictives dans `mdd_e2e_db`.

### 6.3. Résultats de couverture Vitest / V8

| Indicateur   | Front-end | Back-end | Global pondéré |
| ------------ | --------: | -------: | -------------: |
| Instructions |   82,09 % |  82,83 % |    **82,38 %** |
| Branches     |   76,65 % |  72,97 % |    **75,65 %** |
| Fonctions    |   75,86 % |  95,16 % |    **82,58 %** |
| Lignes       |   83,30 % |  83,24 % |    **83,28 %** |

**L'objectif de couverture de 70 % est dépassé sur les quatre indicateurs**, séparément sur chaque application et globalement. Le total global est calculé à partir des nombres d'éléments couverts, et non par moyenne simple des pourcentages.

La mesure concerne les fichiers inclus dans la configuration Vitest, pas l'intégralité théorique des parcours ; les tests Playwright ne contribuent pas à ces pourcentages. Certains composants ou pages ont une couverture individuelle inférieure au seuil sans empêcher l'objectif global d'être atteint.

### 6.4. Exécution et preuves

```bash
# Campagne complète depuis la racine (Docker démarré, serveurs de dev arrêtés)
npm run test:all

# Arrêter la base E2E après la campagne
npm run db:e2e:down

# Couverture seule, puis résumé
npm run test:coverage
npm run test:summary

# Ouvrir le rapport Playwright de la dernière exécution
npm run test:e2e:report
```

Pour configurer l'E2E, installer Chromium (`npx playwright install chromium`) puis copier `.env.e2e.example` vers `.env.e2e` et adapter les valeurs de test. Les services sont isolés sur les ports **3100** (Next.js), **4100** (Express) et **5434** (PostgreSQL).

Les rapports HTML Vitest sont générés dans `frontend/coverage/` et `backend/coverage/`. Le rapport HTML Playwright est généré dans `playwright-report/`. Ces répertoires sont **exclus du versionnement Git** et peuvent être régénérés avec les commandes indiquées ; les résultats synthétiques sont consignés ici et dans le PDF de justification technique.

### 6.5. Contrôles complémentaires

```bash
npm --prefix frontend run lint
npm --prefix backend run typecheck
npm run build
npm audit
npm --prefix frontend audit
npm --prefix backend audit
```

Le `typecheck`, les **103 tests back-end** et le **build back-end** ont été validés après l'intégration du middleware. L'audit technique précédent a aussi porté sur les compilations, les dépendances et les contrôles de qualité. La campagne `test:all` valide les tests et la couverture ; **elle ne remplace pas** l'exécution séparée d'ESLint, des builds et de `npm audit`.

## 7. Performances et conformité

Des audits Lighthouse ont été réalisés sur les principales interfaces et conservés dans [`docs/lighthouse/`](docs/lighthouse/).

- **Accueil mobile :** performance 92/100 ; accessibilité, bonnes pratiques et SEO à 100/100 lors de l'audit consigné.
- **Liste des articles mobile :** performance 67/100 ; optimisation possible si le produit évolue.
- **Optimisations présentes :** composants serveur lorsque pertinents, `next/image`, requêtes Prisma ciblées, sélection des champs utiles, limitation à 50 articles dans le fil et gestion des états de chargement.

Les captures Lighthouse rendent compte des mesures réalisées à un instant donné ; elles ne garantissent pas les mêmes scores dans tous les environnements. Les mentions légales sont accessibles à `/legal` et la politique de confidentialité à `/privacy`.

## 8. Revue technique et supervision de l'IA

### 8.1. Corrections issues de la revue

| Point identifié                                   | Décision et vérification                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Fil d'actualité initialement non filtré           | Filtre Prisma sur les abonnements de l'utilisateur, tri conservé et tests adaptés                                                     |
| Dépendances vulnérables                           | Mises à jour ciblées et adaptation de la dépendance transitive `effect` utilisée par Prisma 7 ; contrôles `npm audit` lors de l'audit |
| Erreurs inattendues répétées dans les contrôleurs | Middleware `errorHandler` centralisé, propagation via Express 5 et deux tests dédiés                                                  |
| Accès aux pages après connexion                   | Fonction serveur partagée `redirectIfAuthenticated()` pour limiter les doublons                                                       |
| Cohérence du projet                               | Actualisation de la documentation, de la configuration et des tests associés                                                          |

Le correctif de dépendance transitive doit être réévalué lors d'une future mise à jour majeure de Prisma. La revue intermédiaire de la consultation des thèmes est conservée dans [`docs/REVUE_TECHNIQUE_ETAPE_4_MDD.md`](docs/REVUE_TECHNIQUE_ETAPE_4_MDD.md).

### 8.2. Tâches assistées par IA et validation humaine

**ChatGPT** a été utilisé comme aide à l'analyse de l'architecture, à la proposition de code, aux tests et à la documentation. **Codex** a été mobilisé pour la revue technique et l'identification de risques fonctionnels ou de dépendances.

Le développeur a conservé la décision finale : comparaison aux spécifications et aux maquettes, lecture du code proposé, corrections ciblées, exécution des vérifications et rejet des propositions non nécessaires au MVP.

Exemple concret : après signalement du défaut de filtrage du fil d'actualité, la correction a été vérifiée au regard du besoin fonctionnel puis contrôlée par les tests. L'usage de l'IA s'est donc inscrit dans une démarche de **supervision**, et non de validation automatique de ses réponses.

## 9. Documentation utilisateur — FAQ

**Comment créer un compte ?** Depuis l'accueil, sélectionner « S'inscrire », renseigner pseudonyme, e-mail et mot de passe, puis valider.

**Comment se connecter ?** Utiliser la page « Se connecter » avec son adresse e-mail et son mot de passe.

**Comment suivre un thème ?** Ouvrir « Thèmes », utiliser le bouton d'abonnement ; un désabonnement est possible depuis la liste ou le profil.

**Comment fonctionne le fil d'actualité ?** Il affiche les articles des thèmes suivis par le compte connecté, triés du plus récent au plus ancien ou inversement.

**Comment publier ?** Ouvrir « Articles », cliquer sur « Créer un article », choisir un thème, compléter le titre et le contenu, puis valider.

**Comment commenter ?** Ouvrir un article et envoyer un commentaire via le formulaire prévu.

**Comment modifier son profil ?** Ouvrir « Profil », modifier les informations et confirmer avec le mot de passe actuel.

**Que faire en cas d'échec de chargement ?** Réessayer depuis l'interface et vérifier l'état du front-end, de l'API et de PostgreSQL dans l'environnement local.

## 10. Livrables, maintenance et limites

### 10.1. Éléments disponibles

- [Code et historique du projet sur GitHub](https://github.com/AlainDev97/DFSJS-Prenez-en-charge-le-d-veloppement-d-une-application-full-stack-JavaScript-compl-te).
- [`README.md`](README.md) : installation, configuration, commandes et dépannage local.
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) : définition des entités et relations ; migrations dans le même dossier.
- [`docs/screenshots/`](docs/screenshots/) : 16 captures des huit vues desktop/mobile.
- [`docs/lighthouse/`](docs/lighthouse/) : huit captures d'audits Lighthouse.
- [`docs/REVUE_TECHNIQUE_ETAPE_4_MDD.md`](docs/REVUE_TECHNIQUE_ETAPE_4_MDD.md) : revue technique intermédiaire.
- Tests dans `frontend/tests/`, `backend/tests/` et `e2e/`, avec génération locale des rapports HTML.
- PDF distinct « Documentation et rapport du projet MDD » : justification des choix techniques, schémas, FAQ, audit et références aux annexes.

### 10.2. Exploitation et évolutions

**Maintenance locale :** conserver les secrets hors Git, relancer les migrations si le schéma évolue, exécuter les tests et les vérifications de qualité avant une livraison, et consulter les logs serveur en cas d'erreur.

**Déploiement :** aucun déploiement public n'a été réalisé dans le périmètre validé. Une éventuelle mise en production exigerait un hébergement Next.js et Express, une base PostgreSQL accessible de manière sécurisée, HTTPS, des secrets et variables d'environnement adaptés, une stratégie de logs et de sauvegarde et des vérifications dans l'environnement cible. Ces opérations ne sont **pas présentées comme déjà réalisées**.

**Axes d'amélioration non prioritaires pour le MVP :** performance de certaines pages mobiles, pagination au-delà des limites actuelles, stratégie de cache, revue de la journalisation en production et maintien à jour des dépendances.

---

**Références :** [Next.js](https://nextjs.org/docs) · [Express](https://expressjs.com/) · [Prisma](https://www.prisma.io/docs) · [Vitest](https://vitest.dev/) · [Playwright](https://playwright.dev/)
