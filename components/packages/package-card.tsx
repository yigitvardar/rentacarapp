import Link from "next/link";
import {
  Calendar,
  Car,
  Gauge,
  CheckCircle,
  ArrowRight,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { PackageWithCategory } from "@/types";

interface PackageCardProps {
  pkg: PackageWithCategory;
  featured?: boolean;
}

export function PackageCard({ pkg, featured = false }: PackageCardProps) {
  const hasDiscount = Number(pkg.discountRate) > 0;
  const insuranceCoverage = pkg.insuranceCoverage as {
    minCoverage?: string;
  } | null;

  const coverageBadge: Record<string, { label: string; variant: "success" | "info" | "default" }> = {
    BASIC: { label: "Temel Kasko", variant: "default" },
    COMPREHENSIVE: { label: "Tam Kasko", variant: "info" },
    PREMIUM: { label: "Premium Kasko", variant: "success" },
  };

  const coverage = insuranceCoverage?.minCoverage
    ? coverageBadge[insuranceCoverage.minCoverage]
    : null;

  return (
    <Card
      className={`flex flex-col transition-all hover:shadow-lg ${
        featured
          ? "border-2 border-primary shadow-md ring-2 ring-primary/10"
          : "border hover:border-primary/30"
      }`}
    >
      {featured && (
        <div className="bg-primary text-primary-foreground text-center text-xs font-semibold py-1.5 rounded-t-xl">
          ⭐ En Popüler
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-lg leading-tight">{pkg.name}</h3>
            {pkg.category && (
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                <Car className="h-3.5 w-3.5" />
                {pkg.category.name}
              </p>
            )}
          </div>
          {coverage && (
            <Badge variant={coverage.variant} className="shrink-0 text-xs">
              {coverage.label}
            </Badge>
          )}
        </div>

        {pkg.description && (
          <p className="text-sm text-muted-foreground">{pkg.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Fiyat */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(Number(pkg.finalPrice))}
            </span>
            {hasDiscount && (
              <span className="text-muted-foreground line-through text-sm mb-1">
                {formatCurrency(Number(pkg.basePrice))}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {pkg.durationDays} günlük toplam fiyat
          </p>
          {hasDiscount && (
            <div className="flex items-center gap-1 mt-1.5">
              <Tag className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-600">
                %{Number(pkg.discountRate).toFixed(0)} indirim uygulandı
              </span>
            </div>
          )}
        </div>

        {/* Detaylar */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary/60" />
            <span>{pkg.durationDays} gün</span>
          </div>
          {pkg.includedKm && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gauge className="h-4 w-4 text-primary/60" />
              <span>{pkg.includedKm.toLocaleString("tr-TR")} km</span>
            </div>
          )}
          {pkg.extraKmRate && (
            <div className="col-span-2 text-xs text-muted-foreground">
              Ekstra km: {formatCurrency(Number(pkg.extraKmRate))}/km
            </div>
          )}
        </div>

        {/* Dahil özellikler */}
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            Sigorta poliçesi kapsamında
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            Güvenli online ödeme
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            7/24 müşteri desteği
          </li>
        </ul>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full" variant={featured ? "default" : "outline"}>
          <Link href={`/packages/${pkg.id}`}>
            Aracı Seç
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
