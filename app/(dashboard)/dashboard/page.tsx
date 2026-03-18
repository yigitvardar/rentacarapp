import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Car, FileText, Clock, CheckCircle, Shield, ArrowRight, AlertCircle, Printer, Receipt } from "lucide-react";
import { CancelRentalButton } from "@/components/dashboard/cancel-rental-button";
import { ReportIssueDialog } from "@/components/dashboard/report-issue-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { formatCurrency, formatDate, rentalStatusLabels } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  CONFIRMED: "warning",
  ACTIVE: "success",
  PENDING: "warning",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [tcVerification, rentalStats, myRentals] = await Promise.all([
    db.tcVerification.findFirst({
      where: { userId: session.user.id },
      orderBy: { verifiedAt: "desc" },
    }),
    db.rental.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: true,
    }),
    db.rental.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["CONFIRMED", "ACTIVE", "COMPLETED"] },
      },
      include: {
        vehicle: { include: { category: true } },
        package: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const rentalCounts = {
    active: rentalStats.find((r) => r.status === "ACTIVE")?._count ?? 0,
    pending: rentalStats.find((r) => r.status === "CONFIRMED")?._count ?? 0,
    completed: rentalStats.find((r) => r.status === "COMPLETED")?._count ?? 0,
  };

  const hasActivePolicy = tcVerification?.policyStatus === "ACTIVE";
  const hasExpiredPolicy = tcVerification?.policyStatus === "EXPIRED";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Karşılama */}
      <div>
        <h1 className="text-2xl font-bold">
          Hoş geldiniz, {session.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Sigorta poliçenize özel araç kiralama fırsatlarını keşfedin.
        </p>
      </div>

      {/* TC / Poliçe Durum Kartı */}
      {!tcVerification && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              TC Kimlik Doğrulaması Gerekiyor
            </CardTitle>
            <CardDescription>
              Size özel araç kiralama paketlerini görmek için TC kimlik
              numaranızı doğrulayın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/tc-verify">
                Şimdi Doğrula
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasActivePolicy && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800 text-sm">
                    Poliçe Doğrulandı — {tcVerification?.policyNumber}
                  </p>
                  <p className="text-xs text-green-600">
                    Bitiş: {tcVerification?.expiresAt ? formatDate(tcVerification.expiresAt) : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Aktif</Badge>
                <Button asChild size="sm" variant="outline">
                  <Link href="/packages">Paketleri Gör</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasExpiredPolicy && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-orange-800 text-sm">
                    Poliçe Süresi Dolmuş
                  </p>
                  <p className="text-xs text-orange-600">
                    Poliçenizi yenileyip tekrar sorgulayın.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/tc-verify">Yeniden Sorgula</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rentalCounts.active}</p>
                <p className="text-sm text-muted-foreground">Aktif Kiralama</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rentalCounts.pending}</p>
                <p className="text-sm text-muted-foreground">Bekleyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rentalCounts.completed}</p>
                <p className="text-sm text-muted-foreground">Tamamlanan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Araçlarım */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Car className="h-5 w-5" />
          Araçlarım
        </h2>

        {myRentals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Henüz kiraladığınız araç yok.</p>
              {hasActivePolicy && (
                <Button asChild size="sm" className="mt-4">
                  <Link href="/packages">Araç Kirala</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myRentals.map((rental) => (
              <Card key={rental.id} className="overflow-hidden">
                <CardContent className="pt-0 pb-0">
                  <div className="flex items-center gap-4 py-4">
                    {/* Araç İkonu */}
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Car className="h-6 w-6 text-muted-foreground" />
                    </div>

                    {/* Ana Bilgi */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">
                          {rental.vehicle.brand} {rental.vehicle.model}
                        </p>
                        <Badge variant={statusVariant[rental.status] ?? "secondary"} className="text-xs">
                          {rentalStatusLabels[rental.status] ?? rental.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rental.vehicle.plate} • {rental.vehicle.category.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(rental.startDate)} – {formatDate(rental.endDate)} • {rental.totalDays} gün
                      </p>
                    </div>

                    {/* Fiyat & Butonlar */}
                    <div className="text-right shrink-0 space-y-2">
                      <p className="font-semibold text-sm text-primary">
                        {formatCurrency(Number(rental.totalPrice))}
                      </p>
                      {rental.status === "CONFIRMED" && (
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                          <Link href={`/policy/${rental.id}`}>
                            <Printer className="h-3 w-3" />
                            Poliçe
                          </Link>
                        </Button>
                      )}
                      {(rental.status === "ACTIVE" || rental.status === "COMPLETED") && rental.payment?.status === "SUCCESS" && (
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                          <Link href={`/invoice/${rental.id}`}>
                            <Receipt className="h-3 w-3" />
                            Fatura
                          </Link>
                        </Button>
                      )}
                      {rental.status === "ACTIVE" && (
                        <ReportIssueDialog
                          rentalId={rental.id}
                          vehicleLabel={`${rental.vehicle.brand} ${rental.vehicle.model}`}
                        />
                      )}
                      {(rental.status === "PENDING" || rental.status === "CONFIRMED") && (
                        <CancelRentalButton rentalId={rental.id} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Hızlı Erişim */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/tc-verify">
              <CardContent className="pt-5 pb-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Poliçe Sorgula</p>
                  <p className="text-xs text-muted-foreground">TC ile sigorta sorgulama</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Link>
          </Card>

          <Card className={`transition-shadow ${hasActivePolicy ? "hover:shadow-md cursor-pointer" : "opacity-60"}`}>
            <Link href={hasActivePolicy ? "/packages" : "/tc-verify"}>
              <CardContent className="pt-5 pb-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                  <Car className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Araç Kirala</p>
                  <p className="text-xs text-muted-foreground">
                    {hasActivePolicy ? "Paketleri incele & kirala" : "Önce poliçe doğrulama gerekli"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
