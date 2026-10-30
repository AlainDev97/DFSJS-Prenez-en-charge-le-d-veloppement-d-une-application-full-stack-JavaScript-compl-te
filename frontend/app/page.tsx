import Link from "next/link";

export const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-8">
        <div className="flex justify-center">
          <div className="bg-primary text-primary-foreground text-4xl font-bold px-8 py-4 rounded-2xl">
            MDD
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground">
          Monde de Dév
        </h1>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
