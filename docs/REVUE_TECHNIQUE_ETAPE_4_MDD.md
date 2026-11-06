# MDD – Étape 4 : revue technique et supervision de l'IA

**Projet :** Monde de Dév (MDD) – OpenClassrooms RNCP 7, projet P5  
**Date de rédaction :** 03/11/2026  
**Branche de travail :** `feature/topics-e2e`  
**Périmètre :** première fonctionnalité de consultation des thèmes, du navigateur à PostgreSQL  
**Statut :** revue intermédiaire ; validation finale à compléter après vérification du lint, du build et de la page responsive.

## 1. Objectif de l'étape

Valider la cohérence des choix techniques sur un parcours simple : consultation des thèmes de programmation dans l'application MDD. La fonctionnalité doit récupérer de vraies données en base, et non afficher un tableau codé en dur dans le front-end.

### Chaîne technique parcourue

```text
Navigateur
  -> Next.js 16 / React (Client Component : TopicsList)
  -> GET http://localhost:4000/api/topics
  -> Express 5 / Router / Controller
  -> Validation des paramètres avec Zod 4
  -> Service métier
  -> Repository Prisma 7
  -> PostgreSQL 17 (Docker)
  -> Réponse JSON, validée par Zod côté front-end
  -> Affichage des thèmes
```

**Choix architectural :** ce projet utilise une API REST Express distincte de Next.js, au lieu d'une Server Action mentionnée comme recommandation dans l'énoncé. Ce choix doit être justifié dans la section 2.2 de la documentation et, de préférence, confirmé auprès du mentor.

## 2. Tâche confiée à l'IA et critères d'acceptation

**Outil :** ChatGPT.  
**Travail délégué :** proposer la page Next.js de consultation des thèmes et son Client Component, connecté à l'API Express.

Critères d'acceptation demandés :

- Récupérer les thèmes avec `GET /api/topics` depuis PostgreSQL, sans données fictives côté front-end.
- Afficher le nom et la description de chaque thème.
- Gérer le chargement, l'absence de résultats et l'échec réseau.
- Permettre une nouvelle tentative en cas d'erreur.
- Offrir un affichage responsive.
- Respecter la maquette officielle desktop et mobile de la page « Thèmes ».
- Préserver une séparation claire entre la page Next.js et le composant interactif.

**Rôle du Lead Developer :** analyser la proposition, contrôler son comportement, confronter l'interface à Figma, demander des corrections et décider de sa validation.

## 3. Résultats de la revue technique

### 3.1. Vérification du fonctionnement de l'API

La consultation de `GET /api/topics` a retourné quatre thèmes issus des données de test : JavaScript, Node.js, React et TypeScript. La requête `GET /api/topics?search=react` a retourné uniquement React. Ces résultats ont été observés à partir des réponses fournies pendant les tests manuels.

### 3.2. Anomalie de validation des paramètres HTTP

**Constat :** l'appel `GET /api/topics?search[]=React` retournait initialement l'ensemble des thèmes, au lieu de signaler une requête invalide.

**Analyse :** avec le parseur de requêtes utilisé, `search[]` était traité comme une clé distincte de `search`. `z.object()` supprimait silencieusement cette propriété inconnue. La recherche devenait donc absente, ce qui désactivait le filtre dans le repository.

**Correction proposée et appliquée :** remplacer `z.object()` par `z.strictObject()` pour le schéma des paramètres de recherche. Le contrôleur répond désormais en `400 Bad Request` lorsque la requête contient un paramètre non autorisé.

**Vérification rapportée :** le cas `search[]=React` est corrigé, et `search=React` reste fonctionnel.

**Enseignement :** tester les paramètres inattendus, pas seulement les entrées nominales, et expliciter le comportement attendu face aux champs supplémentaires.

### 3.3. Écart entre le code généré et la maquette Figma

**Constat :** la première proposition de ChatGPT affichait un titre « Explorer les thèmes », un champ de recherche et des cartes blanches bordées. Elle ne reproduisait pas complètement la maquette officielle de la page « Thèmes ».

**Revue réalisée :** comparaison de la proposition avec les captures fournies par l'étudiant (desktop et mobile). La maquette prévoit notamment un en-tête MDD, une grille de deux colonnes sur ordinateur, une seule colonne sur mobile, des cartes gris clair et des boutons « S'abonner » / « Déjà abonné ».

**Corrections proposées :**

- Ajouter `SiteHeader` avec la navigation MDD et un menu mobile.
- Remplacer la présentation de recherche visible par `TopicsList`.
- Adapter les cartes : fond gris clair, deux colonnes desktop, une colonne mobile.
- Afficher des boutons « S'abonner » **désactivés**, car l'authentification et les actions d'abonnement ne sont pas encore réalisées.
- Conserver la consommation réelle de l'API Express.

**Limites assumées :** le logo en forme de nuage est provisoire ; le menu et les éléments Articles / Déconnexion ne disposent pas encore de toutes leurs fonctionnalités ; l'état « Déjà abonné » ne peut pas être calculé sans utilisateur authentifié. Les boutons désactivés ne doivent pas être présentés comme une fonctionnalité d'abonnement livrée.

**Enseignement :** une réponse techniquement fonctionnelle de l'IA ne garantit pas la conformité aux maquettes. La revue visuelle fait partie des critères de validation.

### 3.4. Points positifs de l'implémentation

- Séparation `routes / controllers / services / repositories` côté Express.
- Typage TypeScript et validation Zod de la réponse API côté navigateur.
- Gestion des états de chargement, d'erreur et de résultat vide.
- Annulation des requêtes lors du démontage via `AbortController`.
- Possibilité de relancer le chargement après un échec.
- Les données affichées proviennent de PostgreSQL via Prisma et non d'un tableau local.

### 3.5. Points restant à contrôler

- Exécuter et conserver la sortie de `npm --prefix frontend run lint`.
- Exécuter et conserver la sortie de `npm --prefix frontend run build`.
- Vérifier les versions desktop et mobile dans le navigateur et enregistrer des captures d'écran.
- Tester la coupure de l'API et le bouton « Réessayer ».
- Vérifier les états de chargement et de liste vide.
- Prévoir ultérieurement des tests automatisés (API et composant React) pour limiter les régressions.
- Comparer plus finement couleurs, espacements et logo à la maquette de référence.

## 4. Synthèse des vérifications

| Vérification | Constat | Statut |
|---|---|---|
| `GET /api/topics` | Quatre thèmes retournés | Confirmé manuellement |
| `GET /api/topics?search=react` | React uniquement | Confirmé manuellement |
| `GET /api/topics?search[]=React` après correction | HTTP 400 rapporté par l'étudiant | Confirmé manuellement |
| Page `/topics` : données provenant de l'API | Implémentation proposée | À confirmer par capture/test navigateur |
| Respect de la maquette desktop/mobile | Corrections proposées après revue | À confirmer visuellement |
| Front-end : lint | Pas de résultat consigné dans ce rapport | À vérifier |
| Front-end : build | Pas de résultat consigné dans ce rapport | À vérifier |
| Erreur réseau et bouton Réessayer | Implémentation proposée | À tester |

## 5. Décisions et suites

La consultation des thèmes constitue l'action simple choisie pour démontrer le parcours **front-end → API REST Express → Prisma → PostgreSQL** demandé à l'étape 4.

Les abonnements, l'authentification et la navigation vers les articles restent **hors périmètre de cette première action**. Ils seront implémentés au cours du développement du MVP.

Avant de déclarer l'étape 4 achevée : finaliser les vérifications manuelles et automatisées nécessaires, compléter le document `DOCUMENTATION.md`, joindre les captures et exporter la version demandée en PDF.

## 6. Pièces à joindre au livrable

- Captures Figma de la page « Thèmes » (desktop et mobile).
- Captures de l'interface `/topics` effectivement exécutée (desktop et mobile).
- Exemples de réponses de l'API et du test de paramètre invalide.
- Sorties des commandes de lint/build et, le cas échéant, des tests automatisés.
- Référence du commit et de la Pull Request de `feature/topics-e2e`.
