import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Car,
  Calendar,
  Gauge,
  Shield,
  CreditCard,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingForm } from "@/components/booking/booking-form";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Rezervasyon Özeti" };

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ packageId: string }>;
  searchParams: Promise<{ vehicleId?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { packageId } = await params;
  const { vehicleId } = await searchParams;
  if (!vehicleId) redirect(`/packages/${packageId}`);

  // Tüm verileri paralel çek
  const [pkg, vehicle, tcVerification] = await Promise.all([
    db.rentalPackage.findUnique({
      where: { id: packageId },
      include: { category: true },
    }),
    db.vehicle.findUnique({
      where: { id: vehicleId },
      include: { category: true },
    }),
    db.tcVerification.findFirst({
      where: { userId: session.user.id, policyStatus: "ACTIVE" },
      orderBy: { verifiedAt: "desc" },
    }),
  ]);

  if (!pkg || !vehicle) notFound();

  if (!tcVerification) redirect("/tc-verify");

  // Poliçe bitiş tarihi (form max date olarak)
  const maxDate = tcVerification.expiresAt
    ? new Date(tcVerification.expiresAt).toISOString().split("T")[0]
    : "";

  const totalPrice = Number(pkg.finalPrice);

  const fuelLabels: Record<string, string> = {
    GASOLINE: "Benzin",
    DIESEL: "Dizel",
    ELECTRIC: "Elektrik",
    HYBRID: "Hibrit",
    LPG: "LPG",
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      {/* Geri */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href={`/packages/${packageId}`}>
            <ArrowLeft className="h-4 w-4" />
            Araç Seçimine Dön
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Rezervasyon Özeti</h1>
        <p className="text-muted-foreground mt-1">
          Bilgilerinizi kontrol edin ve ödemeye geçin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sol: Özet */}
        <div className="lg:col-span-3 space-y-4">
          {/* Araç Bilgisi */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Seçilen Araç
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-lg">
                    {vehicle.brand} {vehicle.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.year} • {vehicle.category.name} •{" "}
                    {fuelLabels[vehicle.fuelType] ?? vehicle.fuelType}
                  </p>
                </div>
                <Badge variant="success">Müsait</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Plaka: <span className="font-medium text-foreground">{vehicle.plate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Paket Bilgisi */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Paket Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-semibold">{pkg.name}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{pkg.durationDays} günlük</span>
                </div>
                {pkg.includedKm && (
                  <div className="flex items-center gap-2">
                    <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{pkg.includedKm.toLocaleString("tr-TR")} km dahil</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Poliçe Bilgisi */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-green-800">
                    {tcVerification.policyNumber}
                  </p>
                  <p className="text-green-600 text-xs">
                    Poliçe bitiş:{" "}
                    {tcVerification.expiresAt
                      ? formatDate(tcVerification.expiresAt)
                      : "-"}
                  </p>
                </div>
                <Badge variant="success" className="ml-auto">
                  Aktif
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ: Fiyat & Ödeme */}
        <div className="lg:col-span-2 space-y-4">
          {/* Fiyat Özeti + Form */}
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Ödeme Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BookingForm
                packageId={packageId}
                vehicleId={vehicleId}
                durationDays={pkg.durationDays}
                maxDate={maxDate}
                basePrice={totalPrice}
                packageBasePrice={Number(pkg.basePrice)}
                packageDiscountRate={Number(pkg.discountRate)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
