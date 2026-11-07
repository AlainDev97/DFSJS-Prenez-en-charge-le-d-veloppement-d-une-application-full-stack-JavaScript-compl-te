Auteur : \[Nom et prénom de l'étudiant\]

Version : \[ex. 1.0.0\]

Date : \[JJ/MM/AAAA\]

**Version 0.0.1**

# **Documentation et rapport du projet MDD**

## **Sommaire**

1. Présentation générale du projet
   1.1 Objectifs du projet
   1.2 Périmètre fonctionnel
2. Architecture et conception technique
   2.1 Schéma global de l'architecture
   2.2 Choix techniques
   2.3 API (Server Actions) et schémas de données
3. Tests, performance et qualité
   3.1 Stratégie de test
   3.2 Rapport de performance et optimisation
   3.3 Revue technique
4. Documentation utilisateur et supervision
   4.1 FAQ utilisateur
   4.2 Supervision et tâches déléguées à l'IA
5. **Annexes**

---

## **1\. Présentation générale du projet**

### **1.1 Objectifs du projet**

Brièvement, présentez le **but** du projet, les **besoins** métiers et les **principales fonctionnalités** développées. Expliquez le **contexte** de l'entreprise et la **valeur ajoutée** attendue du produit.

### **1.2 Périmètre fonctionnel**

Présentez les **fonctionnalités livrées** (liste synthétique), en précisant leur état (terminée / en cours / à venir).

| Fonctionnalités                      | Description                                         | Statut |
| :----------------------------------- | :-------------------------------------------------- | :----- |
| **Création d'un compte utilisateur** | Formulaire et validation d'inscription (Zod)        |        |
| **Publication d'un article**         | Gestion CRUD via Server Actions                     |        |
| **Commentaires**                     | Association article/commentaires (Prisma Relations) |        |
| **Authentification**                 | Sécurisation (Auth.js / NextAuth)                   |        |

---

## **2\. Architecture et conception technique**

### **2.1 Schéma global de l'architecture**

Intégrez un diagramme d'architecture (UML, C4 ou équivalent) illustrant les liens entre :

- les Client Components (Front-end),
- les Server Actions (Logique métier / API),
- la base de données (Prisma ORM),
- les outils externes ou services tiers.

Ajoutez une légende explicative et précisez les **choix d'organisation technique** (modules, dossiers /app, conventions internes).

### **2.2 Choix techniques**

Présentez ici **chaque choix structurant** du projet. Pour chaque élément, complétez le tableau suivant :

| Éléments choisis    | Type                 | Lien documentation         | Objectif du choix                         | Justification                                                           |
| :------------------ | :------------------- | :------------------------- | :---------------------------------------- | :---------------------------------------------------------------------- |
| Ex : **Next.js 16** | Framework Full-stack | [docs](https://nextjs.org) | Architecture unifiée et Server Components | Performance, SEO et simplification de la stack (pas d'API REST séparée) |
|                     |                      |                            |                                           |                                                                         |

### **2.3 API et schémas de données**

Présentez ici la **conception et la structuration de votre logique serveur** (Server Actions ou Route Handlers) :

- Server Actions créées,
- Types d'opérations (Query/Mutation),
- exemples d'objets retournés,
- schémas de données Prisma (modèles, relations, contraintes).

| Server Action / Endpoint | Type     | Description                    | Retour / Réponse          |
| :----------------------- | :------- | :----------------------------- | :------------------------ |
| getArticles              | Query    | Récupère la liste des articles | JSON – liste d'articles   |
| getUserProfile           | Query    | Détail d'un utilisateur        | JSON – profil utilisateur |
| signIn                   | Mutation | Authentifie un utilisateur     | Session / Cookie          |

Ajoutez une représentation visuelle des relations (Schéma Prisma / Diagramme ERD).

---

## **3\. Tests, performance et qualité**

### **3.1 Stratégie de test**

Décrivez les tests mis en place :

- **unitaires** (Vitest/Jest), **d'intégration**, **end-to-end** (Playwright/Cypress),
- frameworks utilisés,
- taux de couverture.

| Type de test       | Outil / framework     | Portée                     | Résultats |
| :----------------- | :-------------------- | :------------------------- | :-------- |
| Test unitaire      | Vitest                | Server Actions / Utils     |           |
| Test d'intégration | React Testing Library | Composants Client / Server |           |
| Test e2e           | Playwright            | Parcours critiques         |           |

### **3.2 Rapport de performance et optimisation**

Décrivez les actions menées pour **améliorer la performance** du code et du rendu :

- résultats d'audit (Lighthouse, Vercel Analytics, etc.),
- points d'amélioration identifiés,
- actions correctives appliquées.

_Exemple : "Après audit Lighthouse, la performance est passée de 65 à 95/100 grâce à l'utilisation du composant Next/Image et au rendu statique partiel (PPR)."_

### **3.3 Revue technique - Première fonctionnalité end-to-end**

Une revue technique a été réalisée sur la consultation des thèmes de programmation.

Elle a permis d'identifier et de corriger un problème de validation des paramètres HTTP, ainsi qu'un écart entre l'interface initialement générée par l'IA et les maquettes Figma.

Les corrections concernent notamment la validation stricte avec Zod, l'organisation des composants et l'adaptation responsive de l'interface.

Le compte rendu détaillé et les vérifications restantes sont disponibles dans REVUE_TECHNIQUE_ETAPE_4_MDD.md.

_Exemple :_

- **Point fort :** Typage strict de bout en bout avec Prisma et TypeScript.
- **À améliorer :** Duplication de la logique de validation dans plusieurs Server Actions.
- **Action corrective :** Centralisation des schémas Zod dans un dossier lib/definitions.

---

## **4\. Documentation utilisateur et supervision**

### **4.1 FAQ utilisateur**

Rédigez une courte section d'aide destinée aux utilisateurs internes ou finaux. Structurez-la en format **Question / Réponse**.

Q : Comment créer un compte ?

R : Cliquez sur "S'inscrire", remplissez le formulaire et validez. Vous serez automatiquement connecté.

Q : Que faire si l'application ne charge pas ?

R : Rafraîchissez la page. Si le problème persiste, vérifiez votre connexion ou contactez le support technique.

### **4.2 Supervision et tâches déléguées à l'IA**

Décrivez les tâches confiées à l'IA ou à des collaborateurs juniors, et comment vous avez **revérifié, validé ou corrigé** leur travail.

Pour cette première fonctionnalité, le développement du composant de consultation des thèmes a été confié à ChatGPT.

En tant que Lead Developer, j'ai assuré la revue du code proposé, analysé la conformité aux maquettes officielles et demandé les corrections nécessaires.

Cette démarche démontre l'importance de la supervision humaine : un code fonctionnel ne suffit pas à garantir la conformité aux exigences techniques et fonctionnelles.

Les critères d'acceptation, anomalies identifiées, décisions et corrections sont détaillés dans le rapport de revue technique.

| Tâche déléguée                 | Outil / collaborateur | Objectif                        | Vérification effectuée                          |
| :----------------------------- | :-------------------- | :------------------------------ | :---------------------------------------------- |
| Ex : Génération de schémas Zod | ChatGPT / Copilot     | Gain de temps sur la validation | Revue des règles de validation et tests manuels |
|                                |                       |                                 |                                                 |

---

## **5\. Annexes**

Intégrez ici toutes les pièces justificatives :

- **Captures d'écran de l'UI** et vues principales.
- **Analyse des besoins front-end** (liens avec les spécifications ou maquettes).
- **Définition des données** (schémas Prisma, types TypeScript, règles Zod).
- **Rapports de couverture et de tests** (exports ou impressions d'écran).
- **Rapport de revue technique** (version complète, datée et signée si applicable).
