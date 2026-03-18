import Link from "next/link";
import { Fuel, Settings2, Users, CheckCircle } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { VehicleWithCategory } from "@/types";

interface VehicleCardProps {
  vehicle: VehicleWithCategory;
  packageId: string;
  durationDays: number;
}

const fuelLabels: Record<string, string> = {
  GASOLINE: "Benzin",
  DIESEL: "Dizel",
  ELECTRIC: "Elektrik",
  HYBRID: "Hibrit",
  LPG: "LPG",
};

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuel",
  AUTOMATIC: "Otomatik",
};

const fuelColors: Record<string, string> = {
  GASOLINE: "bg-orange-100 text-orange-700",
  DIESEL: "bg-gray-100 text-gray-700",
  ELECTRIC: "bg-green-100 text-green-700",
  HYBRID: "bg-teal-100 text-teal-700",
  LPG: "bg-blue-100 text-blue-700",
};

export function VehicleCard({ vehicle, packageId, durationDays }: VehicleCardProps) {
  const features = vehicle.features as Record<string, boolean> | null;
  const featureLabels: Record<string, string> = {
    ac: "Klima",
    navigation: "Navigasyon",
    bluetooth: "Bluetooth",
    sunroof: "Cam Tavan",
    parking_sensor: "Park Sensörü",
    blind_spot: "Kör Nokta",
    usb: "USB",
  };

  const activeFeatures = features
    ? Object.entries(features)
        .filter(([, v]) => v)
        .map(([k]) => featureLabels[k] ?? k)
        .slice(0, 4)
    : [];

  return (
    <Card className="flex flex-col hover:shadow-lg transition-all hover:border-primary/30">
      {/* Araç Başlık */}
      <CardContent className="pt-5 flex-1 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-lg">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">
              {vehicle.year} • {vehicle.category.name}
            </p>
          </div>
          <Badge
            className={`shrink-0 ${fuelColors[vehicle.fuelType] ?? "bg-gray-100 text-gray-700"}`}
          >
            {fuelLabels[vehicle.fuelType] ?? vehicle.fuelType}
          </Badge>
        </div>

        {/* Teknik Özellikler */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex flex-col items-center bg-muted/50 rounded-lg py-2 px-1 text-center">
            <Users className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="font-medium">{vehicle.seats}</span>
            <span className="text-xs text-muted-foreground">Kişi</span>
          </div>
          <div className="flex flex-col items-center bg-muted/50 rounded-lg py-2 px-1 text-center">
            <Settings2 className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="font-medium text-xs">
              {transmissionLabels[vehicle.transmission] ?? vehicle.transmission}
            </span>
            <span className="text-xs text-muted-foreground">Vites</span>
          </div>
          <div className="flex flex-col items-center bg-muted/50 rounded-lg py-2 px-1 text-center">
            <Fuel className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="font-medium text-xs">
              {fuelLabels[vehicle.fuelType] ?? vehicle.fuelType}
            </span>
            <span className="text-xs text-muted-foreground">Yakıt</span>
          </div>
        </div>

        {/* Donanımlar */}
        {activeFeatures.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeFeatures.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 text-xs bg-primary/5 text-primary px-2 py-0.5 rounded-full"
              >
                <CheckCircle className="h-3 w-3" />
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Fiyat */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {durationDays} günlük toplam
            </span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(Number(vehicle.dailyRate) * durationDays)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-right">
            ({formatCurrency(Number(vehicle.dailyRate))}/gün)
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/vehicles/${vehicle.id}`}>Detaylar</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href={`/packages/${packageId}/book?vehicleId=${vehicle.id}`}>
            Bu Aracı Seç
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
