import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { TopicsList } from "@/features/topics/components/topics-list";

export const metadata: Metadata = {
  title: "Thèmes | MDD",
  description: "Découvrez les thèmes de programmation.",
};

export default function TopicsPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="sr-only">Thèmes de programmation</h1>
        <TopicsList />
      </main>
    </>
  );
}
