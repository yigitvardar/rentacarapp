import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, rentalStatusLabels } from "@/lib/utils";
import {
  User, Mail, Phone, Calendar, Shield, Car,
  ArrowLeft, TrendingUp, ClipboardList, CheckCircle, XCircle,
} from "lucide-react";

export const metadata: Metadata = { title: "Admin — Kullanıcı Detayı" };

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  CONFIRMED: "warning",
  ACTIVE: "success",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

const policyStatusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Aktif", color: "text-green-600 bg-green-50 border-green-200" },
  EXPIRED: { label: "Süresi Dolmuş", color: "text-red-600 bg-red-50 border-red-200" },
  NONE: { label: "Poliçe Yok", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      tcVerifications: { orderBy: { verifiedAt: "desc" }, take: 1 },
      rentals: {
        include: {
          vehicle: { include: { category: true } },
          package: true,
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  const latestTc = user.tcVerifications[0];
  const rentals = user.rentals;

  const stats = {
    total: rentals.length,
    active: rentals.filter((r) => r.status === "ACTIVE").length,
    completed: rentals.filter((r) => r.status === "COMPLETED").length,
    cancelled: rentals.filter((r) => r.status === "CANCELLED").length,
    totalSpent: rentals
      .filter((r) => r.payment?.status === "SUCCESS")
      .reduce((sum, r) => sum + Number(r.totalPrice), 0),
  };

  const policyConf = policyStatusConfig[latestTc?.policyStatus ?? "NONE"];

  return (
    <div className="space-y-6">
      {/* Geri */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
            Kullanıcılara Dön
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{user.name ?? "İsimsiz Kullanıcı"}</h1>
        <p className="text-muted-foreground mt-1">Kullanıcı detayı ve kiralama geçmişi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Kullanıcı Bilgisi */}
        <div className="space-y-4">
          {/* Profil Kartı */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Hesap Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>Kayıt: {formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === "ADMIN" ? "secondary" : "outline"} className="text-xs">
                  {user.role === "ADMIN" ? "Admin" : "Kullanıcı"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Poliçe Kartı */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Sigorta Poliçesi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {latestTc ? (
                <>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${policyConf.color}`}>
                    {latestTc.policyStatus === "ACTIVE" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {policyConf.label}
                  </div>
                  {latestTc.policyNumber && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Poliçe No:</span>{" "}
                      {latestTc.policyNumber}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">TC:</span>{" "}
                    {latestTc.tcNumber}
                  </p>
                  {latestTc.expiresAt && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Bitiş:</span>{" "}
                      {formatDate(latestTc.expiresAt)}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Sorgulandı:</span>{" "}
                    {formatDate(latestTc.verifiedAt)}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-xs">Henüz poliçe sorgulanmamış.</p>
              )}
            </CardContent>
          </Card>

          {/* İstatistikler */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Özet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toplam Kiralama</span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aktif</span>
                <span className="font-semibold text-green-600">{stats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tamamlanan</span>
                <span className="font-semibold">{stats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">İptal</span>
                <span className="font-semibold text-red-500">{stats.cancelled}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toplam Harcama</span>
                <span className="font-bold text-primary">{formatCurrency(stats.totalSpent)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ: Kiralama Geçmişi */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Kiralama Geçmişi</h2>
            <span className="text-sm text-muted-foreground">({rentals.length})</span>
          </div>

          {rentals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                Henüz kiralama kaydı yok.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rentals.map((rental) => (
                <Card key={rental.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Car className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            {rental.id.slice(-8).toUpperCase()}
                          </code>
                          <Badge variant={statusVariant[rental.status] ?? "secondary"} className="text-xs">
                            {rentalStatusLabels[rental.status] ?? rental.status}
                          </Badge>
                          {rental.payment?.status === "SUCCESS" && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                              Ödendi
                            </Badge>
                          )}
                          {rental.discountCode && (
                            <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                              {rental.discountCode}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">
                          {rental.vehicle.brand} {rental.vehicle.model}
                          <span className="font-normal text-muted-foreground">
                            {" "}— {rental.vehicle.plate} • {rental.vehicle.category.name}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(rental.startDate)} → {formatDate(rental.endDate)} • {rental.totalDays} gün
                        </p>
                        {rental.package && (
                          <p className="text-xs text-muted-foreground">Paket: {rental.package.name}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm text-primary">
                          {formatCurrency(Number(rental.totalPrice))}
                        </p>
                        {rental.discountAmount && Number(rental.discountAmount) > 0 && (
                          <p className="text-xs text-blue-600">
                            -{formatCurrency(Number(rental.discountAmount))} indirim
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(rental.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
