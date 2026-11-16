# Documentation et rapport technique — MDD (Monde de Dév)

**Projet :** P5 — OpenClassrooms, Lead Developer JavaScript (RNCP 7)  
**Auteur :** Alain Bonneau  
**Version :** 0.7.0  
**Dernière mise à jour :** 14/11/2026  
**Dépôt :** [GitHub — Projet MDD](https://github.com/AlainDev97/DFSJS-Prenez-en-charge-le-d-veloppement-d-une-application-full-stack-JavaScript-compl-te)

---

## 1. Présentation du projet

### 1.1 Objectifs

MDD (Monde de Dév) est une application web communautaire destinée aux développeurs. Elle permet de découvrir des thèmes de programmation, de suivre ses centres d'intérêt, de publier des articles et d'échanger au moyen de commentaires.

Le projet vise à développer une application full-stack JavaScript maintenable, sécurisée et conforme aux maquettes Figma.

### 1.2 Périmètre fonctionnel

| Fonctionnalité                                  | État     |
| ----------------------------------------------- | -------- |
| Inscription, connexion et déconnexion           | Réalisée |
| Authentification et gestion des sessions        | Réalisée |
| Consultation et recherche de thèmes             | Réalisée |
| Abonnement et désabonnement aux thèmes          | Réalisée |
| Consultation, création et tri des articles      | Réalisée |
| Publication et consultation des commentaires    | Réalisée |
| Fil d'actualité personnalisé                    | Réalisée |
| Consultation et modification du profil          | Réalisée |
| Changement de mot de passe                      | Réalisée |
| Interface responsive et navigation mobile       | Réalisée |
| Contrôle d'accès aux pages publiques et privées | Réalisé  |

La première fonctionnalité développée de bout en bout consistait à récupérer les thèmes depuis PostgreSQL, à travers l'API Express, puis à les afficher dans Next.js. Cette étape a permis de valider l'architecture avant la réalisation des autres fonctionnalités.

---

## 2. Architecture et conception

### 2.1 Architecture générale

L'application repose sur un monorepo séparant le front-end et le back-end.

**Flux principal :**

Navigateur → Next.js / React → API REST Express → Controller → Service → Repository → Prisma → PostgreSQL.

Chaque couche possède une responsabilité :

- **Front-end :** affichage, formulaires, navigation et interactions utilisateur.
- **Controller :** réception des requêtes HTTP et validation des données.
- **Service :** logique métier et gestion des exceptions.
- **Repository :** accès aux données à travers Prisma.
- **PostgreSQL :** persistance des utilisateurs, thèmes, abonnements, articles et commentaires.

**Organisation simplifiée :**

| Dossier                             | Contenu                                |
| ----------------------------------- | -------------------------------------- |
| `frontend/app`                      | Pages et layouts Next.js               |
| `frontend/features`                 | Composants métier React                |
| `frontend/components`               | Composants partagés et navigation      |
| `frontend/lib`                      | Client API et fonctions utilitaires    |
| `backend/src`                       | API Express et architecture en couches |
| `backend/prisma`                    | Schéma, migrations et seed             |
| `frontend/tests` et `backend/tests` | Tests Vitest                           |
| `e2e`                               | Parcours Playwright                    |
| `scripts`                           | Préparation de la base E2E et rapports |

### 2.2 Choix techniques

| Technologie                     | Rôle et justification                |
| ------------------------------- | ------------------------------------ |
| Next.js 16 / React 19           | Interface et routage avec App Router |
| TypeScript                      | Typage et maintenabilité             |
| Express 5                       | API REST indépendante du front-end   |
| Prisma 7                        | Accès typé à la base et migrations   |
| PostgreSQL 17                   | Stockage relationnel                 |
| Docker Compose                  | Reproductibilité des environnements  |
| Tailwind CSS 4                  | Intégration des maquettes responsive |
| Zod 4                           | Validation des entrées               |
| Argon2                          | Hachage des mots de passe            |
| Vitest / Supertest / Playwright | Tests unitaires, HTTP et E2E         |

**Pourquoi une API Express indépendante ?**

Cette architecture sépare clairement l'interface, les règles métier et l'accès aux données. Elle facilite les tests et permet la réutilisation future de l'API.

En contrepartie, elle nécessite une configuration CORS et une gestion explicite des sessions entre Next.js et Express.

### 2.3 Modèle de données

Le schéma Prisma repose sur cinq modèles principaux :

| Modèle         | Responsabilité                           |
| -------------- | ---------------------------------------- |
| `User`         | Comptes et informations des utilisateurs |
| `Topic`        | Thèmes de programmation                  |
| `Subscription` | Relation utilisateur–thème               |
| `Post`         | Articles publiés                         |
| `Comment`      | Commentaires associés aux articles       |

Les relations utilisent des clés étrangères. Les identifiants sont des UUID et les contraintes d'unicité évitent notamment les doublons de comptes et d'abonnements.

Les migrations sont versionnées dans `backend/prisma/migrations`.

Le seed de développement initialise des utilisateurs fictifs, des thèmes, des abonnements, des articles et des commentaires.

### 2.4 API REST

Les principaux endpoints sont regroupés par domaine :

| Domaine          | Endpoints principaux                                                |
| ---------------- | ------------------------------------------------------------------- |
| Santé            | `GET /api/health`, `GET /api/health/db`                             |
| Authentification | `POST /api/auth/register`, `/login`, `/logout`                      |
| Session / profil | `GET /api/auth/me`, `PATCH /api/auth/me`                            |
| Sécurité         | `GET /api/auth/csrf`                                                |
| Thèmes           | `GET /api/topics` avec recherche facultative                        |
| Abonnements      | `GET/POST /api/subscriptions`, `DELETE /api/subscriptions/:topicId` |
| Articles         | `GET/POST /api/articles`, `GET /api/articles/:id`                   |
| Commentaires     | `POST /api/articles/:id/comments`                                   |

Les données reçues sont validées par Zod avant traitement. Les opérations nécessitant un utilisateur connecté utilisent son identifiant provenant de la session, et non d'un champ librement transmis par le navigateur.

---

## 3. Authentification et sécurité

### 3.1 Gestion des sessions

L'authentification utilise `express-session` avec `connect-pg-simple` pour stocker les sessions dans PostgreSQL.

Le navigateur reçoit un cookie de session `mdd.sid` avec l'attribut `HttpOnly`.

Les mots de passe sont hachés avec Argon2 et ne sont jamais retournés par l'API.

Les principales protections implémentées sont :

- Validation des données avec Zod.
- Middleware `requireAuth` pour les routes privées.
- Protection CSRF des requêtes de modification.
- Limitation des tentatives d'authentification avec `express-rate-limit`.
- En-têtes de sécurité Helmet et configuration CORS.
- Contrôle des erreurs HTTP : 400, 401, 403, 404 et 409 selon les situations.

### 3.2 Protection des pages Next.js

Les pages privées utilisent `app/(protected)/layout.tsx`, qui vérifie la session Express avant d'autoriser l'accès.

Une vérification inverse a également été ajoutée aux pages publiques.

La fonction serveur **`redirectIfAuthenticated()`**, située dans `frontend/lib/redirect-if-authenticated.ts`, vérifie la présence du cookie puis sa validité auprès de `GET /api/auth/me`.

Son comportement est le suivant :

| Page                               | Utilisateur non connecté | Utilisateur connecté  |
| ---------------------------------- | ------------------------ | --------------------- |
| `/`                                | Accueil                  | Redirection `/topics` |
| `/login`                           | Connexion                | Redirection `/topics` |
| `/register`                        | Inscription              | Redirection `/topics` |
| `/topics`, `/articles`, `/profile` | Redirection `/login`     | Accès autorisé        |

Une session expirée (HTTP 401) autorise l'accès aux pages publiques. Une erreur inattendue de l'API est remontée plutôt que d'être interprétée comme une déconnexion.

Cette fonction partagée évite de dupliquer la logique dans les trois pages publiques.

---

## 4. Tests et qualité

### 4.1 Stratégie de test

Trois niveaux de tests ont été mis en place :

- **Unitaires et composants :** logique métier et interactions React avec Vitest.
- **HTTP :** validation, authentification, sécurité et réponses des endpoints avec Supertest.
- **E2E :** parcours réels dans Chromium avec Playwright, Next.js, Express et PostgreSQL.

Les tests unitaires utilisent des mocks pour isoler les composants et repositories. Les tests E2E complètent cette approche en vérifiant les interactions et la persistance sur une base réelle.

### 4.2 Résultats

**Dernière campagne complète : 14/11/2026.**

| Suite                                      | Tests réussis |
| ------------------------------------------ | ------------: |
| Front-end — Vitest / React Testing Library |            56 |
| Back-end — Vitest / Supertest              |           101 |
| E2E — Playwright / Chromium                |             5 |
| **Total**                                  |       **162** |

Les cinq parcours E2E couvrent l'accès non authentifié, la connexion, les abonnements, la publication d'un article et d'un commentaire, ainsi que l'inscription et la modification du profil.

**Résultat : 162 tests réussis, aucun échec.**

### 4.3 Couverture du code

La couverture est mesurée avec Vitest et V8.

| Indicateur   | Front-end | Back-end |      Global |
| ------------ | --------: | -------: | ----------: |
| Instructions |   82,94 % |  80,60 % | **82,04 %** |
| Branches     |   76,65 % |  71,21 % | **75,29 %** |
| Fonctions    |   77,19 % |  95,08 % | **83,43 %** |
| Lignes       |   84,20 % |  80,99 % | **82,93 %** |

**L'objectif de 70 % est atteint sur les quatre indicateurs, séparément pour le front-end et le back-end.**

La couverture globale est pondérée à partir des éléments réellement couverts et non calculée comme une moyenne simple.

Les tests Playwright ne sont pas inclus dans ces pourcentages, car leur exécution n'est pas instrumentée pour la couverture V8.

Les repositories affichent 100 % de couverture Vitest grâce à des tests avec Prisma simulé. Cela ne signifie pas que chaque requête a été testée individuellement sur PostgreSQL.

### 4.4 Exécution des tests

Une commande centralisée a été ajoutée au `package.json` racine :

`npm run test:all`

Elle exécute les tests front-end et back-end avec couverture, démarre la base PostgreSQL E2E, prépare les données, lance Playwright et génère un résumé global.

| Commande                  | Utilité                          |
| ------------------------- | -------------------------------- |
| `npm run test:all`        | Campagne complète                |
| `npm run test:coverage`   | Couverture front-end et back-end |
| `npm run test:summary`    | Résumé global de couverture      |
| `npm run test:e2e:report` | Rapport HTML Playwright          |
| `npm run db:e2e:down`     | Arrêt de PostgreSQL E2E          |
| `npm run build`           | Compilation du front et du back  |

Les rapports HTML Vitest sont disponibles dans les répertoires `frontend/coverage` et `backend/coverage`.

Les tests E2E utilisent une base séparée `mdd_e2e_db` sur le port 5434, évitant de modifier la base de développement. Les données temporaires créées pendant les scénarios sont nettoyées.

Les contrôles complémentaires comprennent ESLint, TypeScript et les builds applicatifs. Après les dernières modifications de redirection, une nouvelle campagne complète permettra d'actualiser les résultats si nécessaire.

---

## 5. Revue technique et améliorations

### 5.1 Principales décisions et corrections

| Problème ou besoin                        | Solution retenue                              |
| ----------------------------------------- | --------------------------------------------- |
| Paramètres HTTP inattendus                | Validation stricte avec `z.strictObject()`    |
| Accès non autorisé aux pages privées      | Layout protégé et vérification Express        |
| Accès aux pages publiques après connexion | Fonction partagée `redirectIfAuthenticated()` |
| Protection des mutations                  | Jetons CSRF et session serveur                |
| Écarts avec les maquettes Figma           | Corrections du responsive et de la navigation |
| Risques de régression                     | Tests Vitest, Supertest et Playwright         |
| Besoin d'une campagne reproductible       | Script `test:all` et résumé de couverture     |

La revue technique de la première fonctionnalité est également conservée dans `docs/REVUE_TECHNIQUE_ETAPE_4_MDD.md`.

### 5.2 Performance

Plusieurs pratiques limitent les traitements inutiles :

- Sélection des champs nécessaires dans les requêtes Prisma.
- Limitation des résultats sur les listes principales.
- Tri des articles côté back-end.
- Annulation de requêtes avec `AbortController`.
- Séparation des responsabilités entre les composants et les services.

### Audits Lighthouse

Des audits Lighthouse ont été réalisés sur les principales pages de MDD, en versions Desktop et Mobile.

Les résultats Desktop sont globalement satisfaisants. Sur Mobile, la page d'accueil obtient 92/100 en performance et 100/100 sur les trois autres catégories. La liste des articles obtient 67/100 en performance, ce qui constitue un axe d'optimisation.

Les captures des audits sont disponibles dans [`docs/lighthouse/`](docs/lighthouse/).

Les analyses de performance seront complétées par l'étude des métriques et recommandations Lighthouse.

Les points d'amélioration identifiés comprennent la pagination des listes volumineuses, la gestion du cache et la suppression des avertissements non bloquants de Next.js.

---

## 6. Supervision du travail assisté par IA

ChatGPT a été utilisé comme assistant pour proposer des structures de code, des implémentations, des scénarios de tests et des améliorations documentaires.

Les principales tâches déléguées ont concerné :

- La proposition de composants React et de couches API.
- La préparation de tests unitaires, HTTP et E2E.
- L'aide à la configuration de l'environnement PostgreSQL de test.
- L'analyse des erreurs techniques et des rapports de couverture.
- La rédaction et la synthèse de la documentation.

**La supervision a été assurée par le développeur**, qui a défini les besoins, étudié les propositions, vérifié leur cohérence avec l'architecture et les maquettes, puis exécuté les tests avant validation.

Certaines suggestions ont nécessité des corrections, notamment sur les interfaces et la configuration E2E.

L'utilisation de l'IA n'a donc pas remplacé les décisions techniques ni la validation humaine. Le développeur reste responsable du code et des livrables.

---

## 7. Livrables et prochaines étapes

### 7.1 Livrables

Les principaux éléments disponibles sont :

- Application Next.js et API Express.
- Schéma Prisma, migrations et seed.
- Documentation technique et README.
- Tests automatisés et rapports de couverture.
- Tests E2E et rapport Playwright.
- Historique Git, branches et Pull Requests.
- Revue technique de l'étape 4.

### 7.2 Points restant à finaliser

- Réaliser les audits Lighthouse et d'accessibilité.
- Corriger les avertissements techniques pertinents.
- Vérifier les derniers builds et la campagne complète de tests.
- Vérifier la conformité avec la fiche d'autoévaluation OpenClassrooms.
- Préparer les captures, preuves et démonstrations pour la soutenance.

### 7.3 Conclusion

Le projet MDD dispose d'une architecture full-stack séparant les responsabilités, d'une authentification sécurisée et des principales fonctionnalités communautaires prévues.

La campagne automatisée de **162 tests réussis** et les couvertures supérieures à **70 % sur les quatre indicateurs** fournissent des preuves de qualité et de non-régression.

Les prochaines étapes portent principalement sur les audits complémentaires, la consolidation des livrables et la préparation de la soutenance.

---

**Références :** [Next.js](https://nextjs.org/docs) · [Express](https://expressjs.com/) · [Prisma](https://www.prisma.io/docs) · [Vitest](https://vitest.dev/) · [Playwright](https://playwright.dev/)

_Document évolutif — version 0.7.0, 14 novembre 2026._
