import { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { VehicleStatusToggle } from "@/components/admin/vehicle-status-toggle";
import { AddVehicleDialog } from "@/components/admin/add-vehicle-dialog";
import { EditVehicleDialog } from "@/components/admin/edit-vehicle-dialog";
import { DeleteVehicleButton } from "@/components/admin/delete-vehicle-button";
import { Car } from "lucide-react";

export const metadata: Metadata = { title: "Admin — Araçlar" };

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  AVAILABLE: { label: "Müsait", variant: "success" },
  RENTED: { label: "Kirada", variant: "warning" },
  MAINTENANCE: { label: "Bakımda", variant: "secondary" },
  INACTIVE: { label: "Pasif", variant: "destructive" },
};

export default async function AdminVehiclesPage() {
  const [vehicles, categories] = await Promise.all([
    db.vehicle.findMany({
      include: { category: true },
      orderBy: [{ status: "asc" }, { brand: "asc" }],
    }),
    db.vehicleCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Araçlar</h1>
          <p className="text-muted-foreground mt-1">{vehicles.length} araç kayıtlı</p>
        </div>
        <AddVehicleDialog categories={categories} />
      </div>

      <div className="space-y-3">
        {vehicles.map((vehicle) => {
          const sc = statusConfig[vehicle.status] ?? { label: vehicle.status, variant: "secondary" as const };
          return (
            <Card key={vehicle.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Car className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </p>
                      <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.plate} • {vehicle.category.name} • {vehicle.fuelType} • {vehicle.transmission}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.seats} kişilik • {formatCurrency(Number(vehicle.dailyRate))}/gün
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <VehicleStatusToggle vehicleId={vehicle.id} currentStatus={vehicle.status} />
                    <EditVehicleDialog
                      vehicle={{ ...vehicle, dailyRate: Number(vehicle.dailyRate) }}
                      categories={categories}
                    />
                    <DeleteVehicleButton vehicleId={vehicle.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
