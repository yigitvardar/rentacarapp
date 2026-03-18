import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Car, LayoutDashboard, Users, ClipboardList,
  LogOut, ShieldCheck, ArrowLeft, Package, Tag, AlertTriangle,
} from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const unreadIssues = await db.issueReport.count({ where: { isRead: false } });

  const navItems = [
    { href: "/admin", label: "Genel Bakış", icon: LayoutDashboard, badge: 0 },
    { href: "/admin/vehicles", label: "Araçlar", icon: Car, badge: 0 },
    { href: "/admin/packages", label: "Paketler", icon: Package, badge: 0 },
    { href: "/admin/rentals", label: "Kiralamalar", icon: ClipboardList, badge: 0 },
    { href: "/admin/issues", label: "Sorun Bildirimleri", icon: AlertTriangle, badge: unreadIssues },
    { href: "/admin/discounts", label: "İndirim Kodları", icon: Tag, badge: 0 },
    { href: "/admin/users", label: "Kullanıcılar", icon: Users, badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <p className="text-xs text-muted-foreground">Araç Kiralama Yönetimi</p>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <p className="font-medium text-sm truncate">{session.user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {badge}
                </span>
              )}
            </Link>
          ))}

          <div className="pt-4 border-t mt-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kullanıcı Paneline Dön
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
