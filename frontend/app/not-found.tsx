import Link from "next/link";

export const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="text-8xl font-bold text-primary">404</div>
        <h1 className="text-2xl font-semibold text-foreground">
          Page introuvable
        </h1>
        <p className="text-muted-foreground max-w-md">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
