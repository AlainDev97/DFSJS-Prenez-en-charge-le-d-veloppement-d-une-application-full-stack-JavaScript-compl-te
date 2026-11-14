import type { Metadata } from "next";

import { redirectIfAuthenticated } from "@/lib/redirect-if-authenticated";
import { AuthPageLayout } from "@/components/layout/auth-page-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Inscription | MDD",
  description: "Créez votre compte Monde de Dév.",
};

/**
 * Page d'inscription de MDD.
 */
export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return (
    <AuthPageLayout title="Inscription">
      <RegisterForm />
    </AuthPageLayout>
  );
}
