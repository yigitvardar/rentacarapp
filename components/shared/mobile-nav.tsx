"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Car, LayoutDashboard, User, Shield, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tc-verify", label: "Poliçe Sorgula", icon: Shield },
  { href: "/packages", label: "Araçlar & Paketler", icon: Car },
  { href: "/profile", label: "Profilim", icon: User },
];

interface MobileNavProps {
  userName: string;
  userEmail: string;
}

export function MobileNav({ userName, userEmail }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Sayfa değişince kapat
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* Mobil header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          <span className="font-bold">Araç Kiralama</span>
        </Link>
      </header>

      {/* Spacer */}
      <div className="md:hidden h-14" />

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col transform transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <span className="font-bold">Araç Kiralama</span>
          </Link>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b bg-gray-50">
          <p className="font-medium text-sm truncate">{userName}</p>
          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href ? "bg-primary/10 text-primary" : "hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
