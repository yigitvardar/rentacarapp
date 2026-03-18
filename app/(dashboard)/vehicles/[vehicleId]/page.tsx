import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft, Car, Fuel, Settings2, Users, Calendar,
  CheckCircle, MapPin, Package,
} from "lucide-react";
import { AvailabilityCalendar } from "@/components/vehicles/availability-calendar";

const fuelLabels: Record<string, string> = { GASOLINE: "Benzin", DIESEL: "Dizel", ELECTRIC: "Elektrik", HYBRID: "Hibrit", LPG: "LPG" };
const transmissionLabels: Record<string, string> = { MANUAL: "Manuel", AUTOMATIC: "Otomatik" };
const featureLabels: Record<string, string> = {
  ac: "Klima", navigation: "Navigasyon", bluetooth: "Bluetooth", sunroof: "Cam Tavan",
  parking_sensor: "Park Sensörü", blind_spot: "Kör Nokta Uyarısı", usb: "USB",
  cruise_control: "Hız Sabitleyici", adaptive_cruise: "Adaptif Hız Sabitleyici",
  leather_seats: "Deri Koltuk", heads_up_display: "HUD", massage_seats: "Masajlı Koltuk",
  ambient_light: "Ambians Aydınlatma", burmester_sound: "Burmester Ses Sistemi",
  virtual_cockpit: "Virtual Cockpit", pilot_assist: "Pilot Assist",
  bowers_wilkins_sound: "B&W Ses Sistemi", harman_kardon: "Harman Kardon",
  driving_assistant: "Sürüş Asistanı", airmatic: "Airmatic Süspansiyon",
  awd: "4x4 Çekiş", third_row_seats: "3. Sıra Koltuk",
};

export default async function VehicleDetailPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const { vehicleId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const [vehicle, rentals] = await Promise.all([
    db.vehicle.findUnique({
      where: { id: vehicleId },
      include: { category: true },
    }),
    db.rental.findMany({
      where: {
        vehicleId: vehicleId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        endDate: { gte: new Date() },
      },
      select: { startDate: true, endDate: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  if (!vehicle) notFound();

  const features = vehicle.features as Record<string, boolean> | null;
  const activeFeatures = features
    ? Object.entries(features).filter(([, v]) => v).map(([k]) => ({ key: k, label: featureLabels[k] ?? k }))
    : [];

  const bookedRanges = rentals.map((r) => ({
    start: r.startDate.toISOString().split("T")[0],
    end: r.endDate.toISOString().split("T")[0],
  }));

  const isAvailable = vehicle.status === "AVAILABLE";

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/packages"><ArrowLeft className="h-4 w-4" /> Paketlere Dön</Link>
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{vehicle.brand} {vehicle.model}</h1>
            <p className="text-muted-foreground">{vehicle.year} • {vehicle.category.name} • {vehicle.plate}</p>
          </div>
          <Badge variant={isAvailable ? "success" : "secondary"} className="text-sm px-3 py-1">
            {isAvailable ? "Müsait" : "Müsait Değil"}
          </Badge>
        </div>
      </div>

      {/* Görsel Placeholder */}
      <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl flex items-center justify-center border">
        <Car className="h-20 w-20 text-slate-300" />
      </div>

      {/* Temel Bilgiler */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Fuel, label: "Yakıt", value: fuelLabels[vehicle.fuelType] ?? vehicle.fuelType },
          { icon: Settings2, label: "Vites", value: transmissionLabels[vehicle.transmission] ?? vehicle.transmission },
          { icon: Users, label: "Koltuk", value: `${vehicle.seats} Kişilik` },
          { icon: MapPin, label: "Günlük Fiyat", value: formatCurrency(Number(vehicle.dailyRate)) },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4 text-center">
              <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold text-sm mt-0.5">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Donanımlar */}
      {activeFeatures.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Donanımlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeFeatures.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Müsaitlik Takvimi */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Müsaitlik Takvimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookedRanges.length === 0 ? (
            <p className="text-sm text-green-600 font-medium">Bu araç şu an tamamen müsait.</p>
          ) : (
            <AvailabilityCalendar bookedRanges={bookedRanges} />
          )}
        </CardContent>
      </Card>

      {/* Paket Seç */}
      {isAvailable && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 pb-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Bu araçla devam etmek ister misiniz?</p>
                <p className="text-sm text-muted-foreground">Bir paket seçerek rezervasyon yapabilirsiniz.</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/packages">Paket Seç</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
