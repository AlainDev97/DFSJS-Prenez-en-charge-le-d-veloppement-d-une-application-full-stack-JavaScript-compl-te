import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { ProfilePage } from "@/features/profile/components/profile-page";

export const metadata: Metadata = {
  title: "Profil utilisateur | MDD",
  description: "Gérez votre compte et vos abonnements.",
};

export default function UserProfilePage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <ProfilePage />
      </main>
    </>
  );
}
