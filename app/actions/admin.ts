"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Yetkisiz erişim");
  }
  return session;
}

// Araç durumu güncelle
export async function updateVehicleStatusAction(
  vehicleId: string,
  status: string
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
    await db.vehicle.update({ where: { id: vehicleId }, data: { status: status as any } });
    revalidatePath("/admin/vehicles");
    return { success: true, message: "Araç durumu güncellendi" };
  } catch {
    return { success: false, message: "İşlem başarısız" };
  }
}

// Kiralama durumu güncelle
export async function updateRentalStatusAction(
  rentalId: string,
  status: string,
  vehicleId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();

    await db.rental.update({ where: { id: rentalId }, data: { status: status as any } });

    // Araç durumunu buna göre ayarla
    if (status === "ACTIVE") {
      await db.vehicle.update({ where: { id: vehicleId }, data: { status: "RENTED" } });
    } else if (status === "COMPLETED" || status === "CANCELLED") {
      await db.vehicle.update({ where: { id: vehicleId }, data: { status: "AVAILABLE" } });
    }

    revalidatePath("/admin/rentals");
    return { success: true, message: "Kiralama durumu güncellendi" };
  } catch {
    return { success: false, message: "İşlem başarısız" };
  }
}

// İndirim kodu ekle
export async function createDiscountCodeAction(
  _: unknown,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
    const code = (formData.get("code") as string).toUpperCase().trim();
    const discountPercent = parseFloat(formData.get("discountPercent") as string);
    const maxUses = formData.get("maxUses") ? parseInt(formData.get("maxUses") as string) : null;
    const expiresAt = formData.get("expiresAt") ? new Date(formData.get("expiresAt") as string) : null;

    if (!code || !discountPercent) return { success: false, message: "Zorunlu alanları doldurun" };
    const existing = await db.discountCode.findUnique({ where: { code } });
    if (existing) return { success: false, message: "Bu kod zaten mevcut" };

    await db.discountCode.create({ data: { code, discountPercent, maxUses, expiresAt } });
    revalidatePath("/admin/discounts");
    return { success: true, message: "İndirim kodu oluşturuldu" };
  } catch {
    return { success: false, message: "İşlem başarısız" };
  }
}

// İndirim kodu aktif/pasif
export async function toggleDiscountCodeAction(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
    const code = await db.discountCode.findUnique({ where: { id } });
    if (!code) return { success: false, message: "Kod bulunamadı" };
    await db.discountCode.update({ where: { id }, data: { isActive: !code.isActive } });
    revalidatePath("/admin/discounts");
    return { success: true, message: "Durum güncellendi" };
  } catch {
    return { success: false, message: "İşlem başarısız" };
  }
}

// Araç güncelle
export async function updateVehicleAction(
  vehicleId: string,
  _: unknown,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
    const brand = formData.get("brand") as string;
    const model = formData.get("model") as string;
    const year = parseInt(formData.get("year") as string);
    const plate = (formData.get("plate") as string).toUpperCase().trim();
    const categoryId = formData.get("categoryId") as string;
    const fuelType = formData.get("fuelType") as string;
    const transmission = formData.get("transmission") as string;
    const seats = parseInt(formData.get("seats") as string) || 5;
    const dailyRate = parseFloat(formData.get("dailyRate") as string);

    const existing = await db.vehicle.findFirst({ where: { plate, NOT: { id: vehicleId } } });
    if (existing) return { success: false, message: "Bu plaka başka bir araçta kayıtlı" };

    await db.vehicle.update({
      where: { id: vehicleId },
      data: { brand, model, year, plate, categoryId, fuelType: fuelType as any, transmission: transmission as any, seats, dailyRate },
    });
    revalidatePath("/admin/vehicles");
    return { success: true, message: "Araç güncellendi" };
  } catch {
    return { success: false, message: "İşlem başarısız" };
  }
}

// Araç ekle
export async function createVehicleAction(
  _: unknown,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();

    const brand = formData.get("brand") as string;
    const model = formData.get("model") as string;
    const year = parseInt(formData.get("year") as string);
    const plate = (formData.get("plate") as string).toUpperCase().trim();
    const categoryId = formData.get("categoryId") as string;
    const fuelType = formData.get("fuelType") as string;
    const transmission = formData.get("transmission") as string;
    const seats = parseInt(formData.get("seats") as string) || 5;
    const dailyRate = parseFloat(formData.get("dailyRate") as string);

    if (!brand || !model || !plate || !categoryId || !fuelType || !transmission || !dailyRate) {
      return { success: false, message: "Tüm zorunlu alanları doldurun" };
    }

    const existing = await db.vehicle.findUnique({ where: { plate } });
    if (existing) return { success: false, message: "Bu plaka zaten kayıtlı" };

    await db.vehicle.create({
      data: { brand, model, year, plate, categoryId, fuelType: fuelType as any, transmission: transmission as any, seats, dailyRate, status: "AVAILABLE" },
    });

    revalidatePath("/admin/vehicles");
    return { success: true, message: "Araç başarıyla eklendi" };
  } catch {
    return { success: false, message: "İşlem başarısız" };
  }
}

// Paket ekle
export async function createPackageAction(
  _: unknown,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("categoryId") as string || null;
    const durationDays = parseInt(formData.get("durationDays") as string);
    const basePrice = parseFloat(formData.get("basePrice") as string);
    const discountRate = parseFloat(formData.get("discountRate") as string) || 0;
    const finalPrice = basePrice * (1 - discountRate / 100);
    const includedKm = parseInt(formData.get("includedKm") as string) || null;

    if (!name || !durationDays || !basePrice) return { success: false, message: "Zorunlu alanları doldurun" };

    await db.rentalPackage.create({
      data: { name, description, categoryId, durationDays, basePrice, discountRate, finalPrice: Math.round(finalPrice), includedKm, policyTypes: ["ACTIVE"], isActive: true },
    });
    revalidatePath("/admin/packages");
    revalidatePath("/(dashboard)/packages");
    return { success: true, message: "Paket eklendi" };
  } catch {
    return { success: false, message: "İşlem başarısız" };
  }
}

// Paket güncelle
export async function updatePackageAction(
  packageId: string,
  _: unknown,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("categoryId") as string || null;
    const durationDays = parseInt(formData.get("durationDays") as string);
    const basePrice = parseFloat(formData.get("basePrice") as string);
    const discountRate = parseFloat(formData.get("discountRate") as string) || 0;
    const finalPrice = basePrice * (1 - discountRate / 100);
    const includedKm = parseInt(formData.get("includedKm") as string) || null;
    const isActive = formData.get("isActive") === "true";

    await db.rentalPackage.update({
      where: { id: packageId },
      data: { name, description, categoryId, durationDays, basePrice, discountRate, finalPrice: Math.round(finalPrice), includedKm, isActive },
    });
    revalidatePath("/admin/packages");
    revalidatePath("/(dashboard)/packages");
    return { success: true, message: "Paket güncellendi" };
  } catch {
    return { success: false, message: "İşlem başarısız" };
  }
}

// Paket sil
export async function deletePackageAction(packageId: string): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();
    await db.rentalPackage.update({ where: { id: packageId }, data: { isActive: false } });
    revalidatePath("/admin/packages");
    return { success: true, message: "Paket devre dışı bırakıldı" };
  } catch {
    return { success: false, message: "İşlem başarısız" };
  }
}

// Araç sil
export async function deleteVehicleAction(
  vehicleId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();

    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      include: { _count: { select: { rentals: { where: { status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] } } } } } },
    });

    if (!vehicle) return { success: false, message: "Araç bulunamadı" };
    if (vehicle.status === "RENTED") return { success: false, message: "Kiradaki araç silinemez" };
    if (vehicle._count.rentals > 0) return { success: false, message: "Aktif kiralaması olan araç silinemez" };

    await db.vehicle.delete({ where: { id: vehicleId } });
    revalidatePath("/admin/vehicles");
    return { success: true, message: "Araç silindi" };
  } catch {
    return { success: false, message: "İşlem başarısız" };
  }
}
