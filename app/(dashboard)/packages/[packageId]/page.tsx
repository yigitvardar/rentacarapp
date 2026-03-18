import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Car,
  Gauge,
  Shield,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/packages/vehicle-card";
import { getAvailableVehiclesForPackage } from "@/lib/packages";
import { formatCurrency } from "@/lib/utils";
import { coverageTypeLabels } from "@/lib/insurance";

export const metadata: Metadata = { title: "Araç Seç" };

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { packageId } = await params;
  const { vehicles, pkg, hasPolicy, notAllowed } =
    await getAvailableVehiclesForPackage(packageId, session.user.id);

  if (!pkg) notFound();

  const insuranceCoverage = pkg.insuranceCoverage as {
    minCoverage?: string;
  } | null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Geri & Başlık */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/packages">
            <ArrowLeft className="h-4 w-4" />
            Paketlere Dön
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{pkg.name}</h1>
        <p className="text-muted-foreground mt-1">
          {pkg.description ?? "Uygun araçlardan birini seçin"}
        </p>
      </div>

      {/* Paket Özeti */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Paket Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Süre</p>
                <p className="font-semibold">{pkg.durationDays} gün</p>
              </div>
            </div>
            {pkg.includedKm && (
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Dahil KM</p>
                  <p className="font-semibold">
                    {pkg.includedKm.toLocaleString("tr-TR")} km
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Kategori</p>
                <p className="font-semibold">{pkg.category?.name ?? "Tüm"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Kapsam</p>
                <p className="font-semibold">
                  {insuranceCoverage?.minCoverage
                    ? coverageTypeLabels[insuranceCoverage.minCoverage] ??
                      insuranceCoverage.minCoverage
                    : "Standart"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Paket Fiyatı</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(Number(pkg.finalPrice))}
              </p>
            </div>
            {Number(pkg.discountRate) > 0 && (
              <Badge variant="success">
                %{Number(pkg.discountRate).toFixed(0)} İndirim
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hata Durumları */}
      {!hasPolicy && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-5 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
            <div>
              <p className="font-semibold text-orange-800">
                Aktif poliçe bulunamadı
              </p>
              <p className="text-sm text-orange-700">
                Bu pakete erişmek için geçerli bir sigorta poliçeniz olması
                gerekiyor.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="ml-auto shrink-0">
              <Link href="/tc-verify">Poliçe Sorgula</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {notAllowed && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-5 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-800">
                Poliçeniz bu paketi kapsamıyor
              </p>
              <p className="text-sm text-red-700">
                Sigorta poliçeniz{" "}
                <strong>{pkg.category?.name}</strong> kategorisini
                kapsamıyor.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="ml-auto shrink-0">
              <Link href="/packages">Diğer Paketler</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Araç Listesi */}
      {hasPolicy && !notAllowed && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Müsait Araçlar</h2>
            <span className="text-sm text-muted-foreground">
              {vehicles.length} araç
            </span>
          </div>

          {vehicles.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold">Şu an müsait araç yok</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Bu kategoride tüm araçlar kirada. Lütfen daha sonra tekrar
                  deneyin.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  packageId={pkg.id}
                  durationDays={pkg.durationDays}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
