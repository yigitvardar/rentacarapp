import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Car, LayoutDashboard, User, LogOut, Shield } from "lucide-react";
import { signOut } from "@/lib/auth";
import { MobileNav } from "@/components/shared/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobil Nav */}
      <MobileNav userName={session.user.name ?? ""} userEmail={session.user.email ?? ""} />

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-r flex-col min-h-screen sticky top-0">
          <div className="p-6 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Araç Kiralama</span>
            </Link>
          </div>

          <div className="p-4 border-b bg-gray-50">
            <p className="font-medium text-sm truncate">{session.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/tc-verify" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              <Shield className="h-4 w-4" />
              Poliçe Sorgula
            </Link>
            <Link href="/packages" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              <Car className="h-4 w-4" />
              Araçlar & Paketler
            </Link>
            <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              <User className="h-4 w-4" />
              Profilim
            </Link>
          </nav>

          <div className="p-4 border-t">
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full">
                <LogOut className="h-4 w-4" />
                Çıkış Yap
              </button>
            </form>
          </div>
        </aside>

        {/* Ana İçerik */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
