import { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, rentalStatusLabels } from "@/lib/utils";
import { AdminRentalActions } from "@/components/admin/rental-actions";
import { Car, User } from "lucide-react";

export const metadata: Metadata = { title: "Admin — Kiralamalar" };

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  CONFIRMED: "success",
  ACTIVE: "success",
  COMPLETED: "secondary",
  PENDING: "warning",
  CANCELLED: "destructive",
};

export default async function AdminRentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const statusFilter = status;

  const rentals = await db.rental.findMany({
    where: statusFilter
      ? { status: statusFilter as any }
      : { status: { not: "PENDING" as any } },
    include: {
      user: true,
      vehicle: { include: { category: true } },
      package: true,
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = await db.rental.groupBy({
    by: ["status"],
    _count: true,
    where: { status: { not: "PENDING" as any } },
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  const filters = [
    { label: "Tümü", value: "" },
    { label: "Beklemede", value: "CONFIRMED" },
    { label: "Aktif", value: "ACTIVE" },
    { label: "Tamamlandı", value: "COMPLETED" },
    { label: "İptal", value: "CANCELLED" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kiralamalar</h1>
        <p className="text-muted-foreground mt-1">{rentals.length} kiralama</p>
      </div>

      {/* Filtreler */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(({ label, value }) => {
          const count = value ? (countMap[value] ?? 0) : Object.values(countMap).reduce((a, b) => a + b, 0);
          const isActive = (statusFilter ?? "") === value;
          return (
            <a
              key={value}
              href={value ? `/admin/rentals?status=${value}` : "/admin/rentals"}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label} ({count})
            </a>
          );
        })}
      </div>

      <div className="space-y-3">
        {rentals.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-12">Kiralama bulunamadı.</p>
        )}
        {rentals.map((rental) => (
          <Card key={rental.id}>
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Başlık satırı */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {rental.id.slice(-8).toUpperCase()}
                    </code>
                    <Badge variant={statusVariant[rental.status] ?? "secondary"} className="text-xs">
                      {rentalStatusLabels[rental.status] ?? rental.status}
                    </Badge>
                    {rental.payment?.status === "SUCCESS" && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">Ödendi</Badge>
                    )}
                  </div>

                  {/* Kullanıcı & Araç */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {rental.user.name} ({rental.user.email})
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {rental.vehicle.brand} {rental.vehicle.model} — {rental.vehicle.plate}
                    </span>
                    <span>{formatDate(rental.startDate)} → {formatDate(rental.endDate)} ({rental.totalDays} gün)</span>
                    <span className="font-semibold text-foreground">{formatCurrency(Number(rental.totalPrice))}</span>
                  </div>
                </div>

                <AdminRentalActions
                  rentalId={rental.id}
                  currentStatus={rental.status}
                  vehicleId={rental.vehicle.id}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
