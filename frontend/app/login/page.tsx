import type { Metadata } from "next";

import { redirectIfAuthenticated } from "@/lib/redirect-if-authenticated";
import { AuthPageLayout } from "@/components/layout/auth-page-layout";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Connexion | MDD",
  description: "Connectez-vous à Monde de Dév.",
};

/**
 * Page de connexion de MDD.
 */
export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <AuthPageLayout title="Se connecter">
      <LoginForm />
    </AuthPageLayout>
  );
}
