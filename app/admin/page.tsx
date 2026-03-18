import { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, ClipboardList, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RevenueChart, OccupancyChart } from "@/components/admin/revenue-chart";

export const metadata: Metadata = { title: "Admin — Genel Bakış" };

const TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export default async function AdminPage() {
  const [
    totalVehicles, availableVehicles, rentedVehicles,
    totalUsers, totalRentals, pendingRentals, confirmedRentals, cancelledRentals,
    revenue, recentPayments,
  ] = await Promise.all([
    db.vehicle.count(),
    db.vehicle.count({ where: { status: "AVAILABLE" } }),
    db.vehicle.count({ where: { status: "RENTED" } }),
    db.user.count({ where: { role: "USER" } }),
    db.rental.count(),
    db.rental.count({ where: { status: "PENDING" } }),
    db.rental.count({ where: { status: { in: ["CONFIRMED", "ACTIVE", "COMPLETED"] } } }),
    db.rental.count({ where: { status: "CANCELLED" } }),
    db.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    db.payment.findMany({
      where: { status: "SUCCESS", paidAt: { not: null } },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    }),
  ]);

  const totalRevenue = Number(revenue._sum.amount ?? 0);

  // Son 6 ay gelir grafiği
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: TR_MONTHS[d.getMonth()] };
  }).map(({ year, month, label }) => {
    const revenue = recentPayments
      .filter((p) => {
        const d = new Date(p.paidAt!);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return { month: label, revenue: Math.round(revenue), count: 0 };
  });

  const stats = [
    { label: "Toplam Araç", value: totalVehicles, sub: `${availableVehicles} müsait`, icon: Car, color: "bg-blue-100 text-blue-600" },
    { label: "Kullanıcılar", value: totalUsers, sub: "kayıtlı kullanıcı", icon: Users, color: "bg-purple-100 text-purple-600" },
    { label: "Toplam Kiralama", value: totalRentals, sub: `${confirmedRentals} onaylı`, icon: ClipboardList, color: "bg-green-100 text-green-600" },
    { label: "Toplam Gelir", value: formatCurrency(totalRevenue), sub: "başarılı ödemeler", icon: TrendingUp, color: "bg-yellow-100 text-yellow-600" },
  ];

  const rentalStats = [
    { label: "Beklemede", value: pendingRentals, icon: Clock, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
    { label: "Onaylı / Aktif", value: confirmedRentals, icon: CheckCircle, color: "text-green-600 bg-green-50 border-green-200" },
    { label: "İptal Edildi", value: cancelledRentals, icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
  ];

  const occupancyData = [
    { label: "Müsait Araçlar", value: availableVehicles, color: "bg-green-500" },
    { label: "Kiradaki Araçlar", value: rentedVehicles, color: "bg-blue-500" },
    { label: "Bakım / Pasif", value: totalVehicles - availableVehicles - rentedVehicles, color: "bg-gray-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Genel Bakış</h1>
        <p className="text-muted-foreground mt-1">Sistemin anlık durumu</p>
      </div>

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gelir Grafiği + Doluluk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aylık Gelir (Son 6 Ay)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={monthlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Araç Doluluk Oranı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">doluluk oranı</p>
            </div>
            <OccupancyChart data={occupancyData} />
          </CardContent>
        </Card>
      </div>

      {/* Kiralama Dağılımı */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Kiralama Durumu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rentalStats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className={`border ${color.split(" ")[2]}`}>
              <CardContent className={`pt-5 pb-5 ${color.split(" ")[1]}`}>
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${color.split(" ")[0]}`} />
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
