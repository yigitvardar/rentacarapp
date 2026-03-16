/**
 * Paket sorgulama yardımcıları
 * Kullanıcının poliçe kapsamına göre uygun paketleri filtreler
 */

import { db } from "@/lib/db";

interface PolicyScope {
  vehicleCategories?: string[];
  maxDailyRate?: number;
  maxDuration?: number;
  additionalBenefits?: string[];
}

export async function getPackagesForUser(userId: string) {
  // Kullanıcının aktif TC doğrulamasını getir
  const tcVerification = await db.tcVerification.findFirst({
    where: { userId, policyStatus: "ACTIVE" },
    orderBy: { verifiedAt: "desc" },
  });

  if (!tcVerification) {
    return { packages: [], hasPolicy: false, scope: null };
  }

  const scope = tcVerification.policyScope as PolicyScope | null;

  // Poliçe kapsamına göre uygun kategorileri belirle
  const allowedCategories = scope?.vehicleCategories ?? [];
  const maxDailyRate = scope?.maxDailyRate;
  const maxDuration = scope?.maxDuration;

  // Uygun paketleri filtrele
  const packages = await db.rentalPackage.findMany({
    where: {
      isActive: true,
      ...(allowedCategories.length > 0
        ? {
            category: {
              name: { in: allowedCategories },
            },
          }
        : {}),
      ...(maxDailyRate
        ? { finalPrice: { lte: maxDailyRate * (maxDuration ?? 30) } }
        : {}),
      ...(maxDuration ? { durationDays: { lte: maxDuration } } : {}),
    },
    include: {
      category: true,
    },
    orderBy: [{ durationDays: "asc" }, { finalPrice: "asc" }],
  });

  return {
    packages,
    hasPolicy: true,
    scope,
    policyNumber: tcVerification.policyNumber,
    expiresAt: tcVerification.expiresAt,
  };
}

export async function getAvailableVehiclesForPackage(packageId: string, userId: string) {
  // Paketi getir
  const pkg = await db.rentalPackage.findUnique({
    where: { id: packageId },
    include: { category: true },
  });

  if (!pkg) return { vehicles: [], pkg: null };

  // Kullanıcının poliçesini kontrol et
  const tcVerification = await db.tcVerification.findFirst({
    where: { userId, policyStatus: "ACTIVE" },
    orderBy: { verifiedAt: "desc" },
  });

  if (!tcVerification) return { vehicles: [], pkg, hasPolicy: false };

  const scope = tcVerification.policyScope as PolicyScope | null;
  const allowedCategories = scope?.vehicleCategories ?? [];

  // Kategori izin kontrolü
  if (
    pkg.categoryId &&
    allowedCategories.length > 0 &&
    !allowedCategories.includes(pkg.category?.name ?? "")
  ) {
    return { vehicles: [], pkg, hasPolicy: true, notAllowed: true };
  }

  // Müsait araçları getir
  const vehicles = await db.vehicle.findMany({
    where: {
      status: "AVAILABLE",
      ...(pkg.categoryId ? { categoryId: pkg.categoryId } : {}),
    },
    include: { category: true },
    orderBy: { dailyRate: "asc" },
  });

  return { vehicles, pkg, hasPolicy: true };
}
