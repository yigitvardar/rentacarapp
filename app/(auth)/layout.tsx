import Link from "next/link";
import { Car } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <Car className="h-7 w-7" />
          <span className="text-xl font-bold">
            {process.env.NEXT_PUBLIC_APP_NAME || "Araç Kiralama"}
          </span>
        </Link>
      </header>

      {/* İçerik */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-white/40 text-xs">
          © 2026 Araç Kiralama. Tüm hakları saklıdır.
        </p>
      </footer>
    </div>
  );
}
