import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Car, LayoutDashboard, Users, Package, LogOut, Shield } from "lucide-react";
import { signOut } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-brand-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-300" />
            <div>
              <span className="font-bold text-lg block">Admin Panel</span>
              <span className="text-xs text-white/50">Araç Kiralama</span>
            </div>
          </Link>
        </div>

        {/* Admin Bilgisi */}
        <div className="p-4 border-b border-white/10 bg-white/5">
          <p className="font-medium text-sm truncate">{session.user.name}</p>
          <p className="text-xs text-white/50 truncate">{session.user.email}</p>
        </div>

        {/* Navigasyon */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/vehicles"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <Car className="h-4 w-4" />
            Araçlar
          </Link>
          <Link
            href="/admin/packages"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <Package className="h-4 w-4" />
            Paketler
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <Users className="h-4 w-4" />
            Kullanıcılar
          </Link>
        </nav>

        {/* Çıkış */}
        <div className="p-4 border-t border-white/10">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/20 transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </form>
        </div>
      </aside>

      {/* Ana İçerik */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
