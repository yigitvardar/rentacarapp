import { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { AddPackageDialog } from "@/components/admin/add-package-dialog";
import { EditPackageDialog } from "@/components/admin/edit-package-dialog";
import { DeleteVehicleButton } from "@/components/admin/delete-vehicle-button";
import { deletePackageAction } from "@/app/actions/admin";
import { Package, Clock, Route } from "lucide-react";

export const metadata: Metadata = { title: "Admin — Paketler" };

// Paketi silmek için server action wrapper
async function DeletePackageButton({ packageId }: { packageId: string }) {
  // Reuse delete vehicle button pattern with package action
  return null; // handled below inline
}

export default async function AdminPackagesPage() {
  const [packages, categories] = await Promise.all([
    db.rentalPackage.findMany({
      include: { category: true },
      orderBy: [{ isActive: "desc" }, { durationDays: "asc" }],
    }),
    db.vehicleCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kiralama Paketleri</h1>
          <p className="text-muted-foreground mt-1">{packages.length} paket kayıtlı</p>
        </div>
        <AddPackageDialog categories={categories} />
      </div>

      <div className="space-y-3">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={pkg.isActive ? "" : "opacity-60"}>
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{pkg.name}</p>
                    <Badge variant={pkg.isActive ? "success" : "secondary"} className="text-xs">
                      {pkg.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                    {pkg.category && (
                      <Badge variant="outline" className="text-xs">{pkg.category.name}</Badge>
                    )}
                  </div>
                  {pkg.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {pkg.durationDays} gün
                    </span>
                    {pkg.includedKm && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Route className="h-3 w-3" /> {pkg.includedKm} km dahil
                      </span>
                    )}
                    <span className="text-xs font-medium text-green-700">
                      {formatCurrency(Number(pkg.finalPrice))}
                      {Number(pkg.discountRate) > 0 && (
                        <span className="ml-1 text-muted-foreground line-through font-normal">
                          {formatCurrency(Number(pkg.basePrice))}
                        </span>
                      )}
                    </span>
                    {Number(pkg.discountRate) > 0 && (
                      <Badge variant="destructive" className="text-xs">%{Number(pkg.discountRate)} indirim</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <EditPackageDialog
                    pkg={{ ...pkg, basePrice: Number(pkg.basePrice), discountRate: Number(pkg.discountRate) }}
                    categories={categories}
                  />
                  <TogglePackageActive packageId={pkg.id} isActive={pkg.isActive} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Aktif/Pasif toggle
function TogglePackageActive({ packageId, isActive }: { packageId: string; isActive: boolean }) {
  return (
    <form action={async () => {
      "use server";
      const { db } = await import("@/lib/db");
      const { revalidatePath } = await import("next/cache");
      const { auth } = await import("@/lib/auth");
      const session = await auth();
      if (session?.user?.role !== "ADMIN") return;
      await db.rentalPackage.update({ where: { id: packageId }, data: { isActive: !isActive } });
      revalidatePath("/admin/packages");
    }}>
      <button
        type="submit"
        title={isActive ? "Pasife al" : "Aktife al"}
        className={`text-xs px-2 py-1 rounded border transition-colors ${
          isActive
            ? "text-orange-600 border-orange-200 hover:bg-orange-50"
            : "text-green-600 border-green-200 hover:bg-green-50"
        }`}
      >
        {isActive ? "Pasife Al" : "Aktife Al"}
      </button>
    </form>
  );
}
