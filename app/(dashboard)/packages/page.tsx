import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, AlertCircle, ArrowRight, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageCard } from "@/components/packages/package-card";
import { getPackagesForUser } from "@/lib/packages";
import { formatDate } from "@/lib/utils";
import { coverageTypeLabels } from "@/lib/insurance";

export const metadata: Metadata = { title: "Paketler" };

export default async function PackagesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { packages, hasPolicy, scope, policyNumber, expiresAt } =
    await getPackagesForUser(session.user.id);

  // Poliçe yoksa yönlendir
  if (!hasPolicy) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Poliçe Doğrulaması Gerekiyor</h1>
          <p className="text-muted-foreground mt-2">
            Size özel araç kiralama paketlerini görmek için önce TC kimlik
            numaranızı doğrulayın.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/tc-verify">
            <Shield className="h-4 w-4" />
            TC Kimliğimi Doğrula
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const allowedCategories = scope?.vehicleCategories ?? [];
  const coverageType = (scope as Record<string, unknown> & { minCoverage?: string })?.minCoverage;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold">Size Özel Paketler</h1>
        <p className="text-muted-foreground mt-1">
          Sigorta poliçenize göre filtrelenmiş araç kiralama paketleri
        </p>
      </div>

      {/* Poliçe Bilgisi */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm">
                  {policyNumber} —{" "}
                  {coverageType
                    ? coverageTypeLabels[coverageType] ?? coverageType
                    : "Aktif Poliçe"}
                </p>
                <p className="text-xs text-green-600">
                  Bitiş: {expiresAt ? formatDate(expiresAt) : "-"} •{" "}
                  {allowedCategories.join(", ")} kategorileri
                </p>
              </div>
            </div>
            <Badge variant="success">Aktif Poliçe</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Paket Sayısı */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          <span className="font-semibold text-foreground">{packages.length}</span> paket
          listeleniyor
        </p>
        <div className="flex gap-2">
          {allowedCategories.map((cat) => (
            <Badge key={cat} variant="secondary">
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Paket Listesi */}
      {packages.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">Uygun paket bulunamadı</p>
            <p className="text-sm text-muted-foreground mt-1">
              Poliçenizin kapsamında şu an aktif paket bulunmuyor.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg, i) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              featured={i === 1 && packages.length >= 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}
