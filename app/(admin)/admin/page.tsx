import { db } from "@/lib/db";
import { Car, Users, Package, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminPage() {
  const [userCount, vehicleCount, packageCount, rentalCount] =
    await Promise.all([
      db.user.count({ where: { role: "USER" } }),
      db.vehicle.count(),
      db.rentalPackage.count({ where: { isActive: true } }),
      db.rental.count(),
    ]);

  const stats = [
    {
      label: "Toplam Kullanıcı",
      value: userCount,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Toplam Araç",
      value: vehicleCount,
      icon: Car,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Aktif Paket",
      value: packageCount,
      icon: Package,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Toplam Kiralama",
      value: rentalCount,
      icon: CreditCard,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Sistemin genel durumu
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
