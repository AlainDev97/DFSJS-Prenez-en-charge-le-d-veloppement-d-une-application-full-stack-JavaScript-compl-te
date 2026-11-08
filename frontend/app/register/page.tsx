import type { Metadata } from "next";

import { AuthPageLayout } from "@/components/layout/auth-page-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Inscription | MDD",
  description: "Créez votre compte Monde de Dév.",
};

/**
 * Page d'inscription de MDD.
 */
export default function RegisterPage() {
  return (
    <AuthPageLayout title="Inscription">
      <RegisterForm />
    </AuthPageLayout>
  );
}
