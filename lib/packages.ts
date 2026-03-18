import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

interface PolicyScope {
  vehicleCategories?: string[];
  maxDailyRate?: number;
  maxDuration?: number;
  additionalBenefits?: string[];
}

export async function getPackagesForUser(userId: string) {
  const tcVerification = await db.tcVerification.findFirst({
    where: { userId, policyStatus: "ACTIVE" },
    orderBy: { verifiedAt: "desc" },
  });

  if (!tcVerification) {
    return { packages: [], hasPolicy: false, scope: null };
  }

  const scope = tcVerification.policyScope as PolicyScope | null;
  const allowedCategories = scope?.vehicleCategories ?? [];
  const maxDailyRate = scope?.maxDailyRate;
  const maxDuration = scope?.maxDuration;

  const cacheKey = `packages-${allowedCategories.join("-")}-${maxDailyRate ?? 0}-${maxDuration ?? 0}`;

  const getCachedPackages = unstable_cache(
    async () =>
      db.rentalPackage.findMany({
        where: {
          isActive: true,
          ...(allowedCategories.length > 0
            ? { category: { name: { in: allowedCategories } } }
            : {}),
          ...(maxDailyRate
            ? { finalPrice: { lte: maxDailyRate * (maxDuration ?? 30) } }
            : {}),
          ...(maxDuration ? { durationDays: { lte: maxDuration } } : {}),
        },
        include: { category: true },
        orderBy: [{ durationDays: "asc" }, { finalPrice: "asc" }],
      }),
    [cacheKey],
    { revalidate: 60 }
  );

  const packages = await getCachedPackages();

  return {
    packages,
    hasPolicy: true,
    scope,
    policyNumber: tcVerification.policyNumber,
    expiresAt: tcVerification.expiresAt,
  };
}

export async function getAvailableVehiclesForPackage(packageId: string, userId: string) {
  const [pkg, tcVerification] = await Promise.all([
    db.rentalPackage.findUnique({
      where: { id: packageId },
      include: { category: true },
    }),
    db.tcVerification.findFirst({
      where: { userId, policyStatus: "ACTIVE" },
      orderBy: { verifiedAt: "desc" },
    }),
  ]);

  if (!pkg) return { vehicles: [], pkg: null };
  if (!tcVerification) return { vehicles: [], pkg, hasPolicy: false };

  const scope = tcVerification.policyScope as PolicyScope | null;
  const allowedCategories = scope?.vehicleCategories ?? [];

  if (
    pkg.categoryId &&
    allowedCategories.length > 0 &&
    !allowedCategories.includes(pkg.category?.name ?? "")
  ) {
    return { vehicles: [], pkg, hasPolicy: true, notAllowed: true };
  }

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
