import "dotenv/config";
import argon2 from "argon2";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed interdit en production.");
  }

  const password = process.env.SEED_PASSWORD;

  if (
    !password ||
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)
  ) {
    throw new Error(
      "SEED_PASSWORD doit contenir au moins 8 caractères, " +
        "une majuscule, une minuscule, un chiffre et un caractère spécial.",
    );
  }

  const passwordHash = await argon2.hash(password);

  // 1. Utilisateurs fictifs
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.test" },
    update: {},
    create: {
      email: "alice@example.test",
      username: "alice_dev",
      passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.test" },
    update: {},
    create: {
      email: "bob@example.test",
      username: "bob_dev",
      passwordHash,
    },
  });

  // 2. Thèmes
  const topicData = [
    {
      name: "JavaScript",
      description: "Langage de programmation pour le web.",
    },
    {
      name: "TypeScript",
      description: "JavaScript avec typage statique.",
    },
    {
      name: "React",
      description: "Bibliothèque de création d'interfaces.",
    },
    {
      name: "Node.js",
      description: "Environnement JavaScript côté serveur.",
    },
  ];

  const topics = [];

  for (const topic of topicData) {
    const createdTopic = await prisma.topic.upsert({
      where: { name: topic.name },
      update: { description: topic.description },
      create: topic,
    });

    topics.push(createdTopic);
  }

  const javascript = topics[0];
  const typescript = topics[1];
  const react = topics[2];

  // 3. Abonnements
  const subscriptions = [
    { userId: alice.id, topicId: javascript.id },
    { userId: alice.id, topicId: react.id },
    { userId: bob.id, topicId: javascript.id },
    { userId: bob.id, topicId: typescript.id },
  ];

  for (const subscription of subscriptions) {
    await prisma.subscription.upsert({
      where: {
        userId_topicId: subscription,
      },
      update: {},
      create: subscription,
    });
  }

  // 4. Articles
  const post1 = await prisma.post.upsert({
    where: {
      id: "e8100000-0000-4000-8000-000000000001",
    },
    update: {},
    create: {
      id: "e8100000-0000-4000-8000-000000000001",
      title: "Bienvenue dans le monde de JavaScript",
      content:
        "JavaScript est un langage incontournable du " +
        "développement web. Quels sont vos conseils pour débuter ?",
      authorId: alice.id,
      topicId: javascript.id,
    },
  });

  const post2 = await prisma.post.upsert({
    where: {
      id: "e8100000-0000-4000-8000-000000000002",
    },
    update: {},
    create: {
      id: "e8100000-0000-4000-8000-000000000002",
      title: "Pourquoi utiliser React ?",
      content:
        "React permet de construire des interfaces " +
        "réutilisables grâce aux composants. " +
        "Quelles fonctionnalités appréciez-vous le plus ?",
      authorId: bob.id,
      topicId: react.id,
    },
  });

  // 5. Commentaires
  await prisma.comment.upsert({
    where: {
      id: "e8200000-0000-4000-8000-000000000001",
    },
    update: {},
    create: {
      id: "e8200000-0000-4000-8000-000000000001",
      content:
        "Je conseille de commencer par les fondamentaux " +
        "avant de découvrir les frameworks !",
      authorId: bob.id,
      postId: post1.id,
    },
  });

  await prisma.comment.upsert({
    where: {
      id: "e8200000-0000-4000-8000-000000000002",
    },
    update: {},
    create: {
      id: "e8200000-0000-4000-8000-000000000002",
      content: "Les composants réutilisables sont un gros avantage !",
      authorId: alice.id,
      postId: post2.id,
    },
  });

  // 6. Vérification des données
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.topic.count(),
    prisma.subscription.count(),
    prisma.post.count(),
    prisma.comment.count(),
  ]);

  console.log("Seed MDD terminé !");
  console.log({
    users: counts[0],
    topics: counts[1],
    subscriptions: counts[2],
    posts: counts[3],
    comments: counts[4],
  });
}

main()
  .catch((error) => {
    console.error("Erreur pendant le seed :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
