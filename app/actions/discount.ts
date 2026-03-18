"use server";

import { db } from "@/lib/db";

export async function validateDiscountCode(code: string, price: number): Promise<{
  valid: boolean;
  message: string;
  discountPercent?: number;
  discountAmount?: number;
  finalPrice?: number;
}> {
  try {
    const discount = await db.discountCode.findUnique({ where: { code: code.toUpperCase().trim() } });

    if (!discount) return { valid: false, message: "Geçersiz indirim kodu" };
    if (!discount.isActive) return { valid: false, message: "Bu indirim kodu artık geçerli değil" };
    if (discount.expiresAt && discount.expiresAt < new Date()) return { valid: false, message: "İndirim kodunun süresi dolmuş" };
    if (discount.maxUses && discount.usedCount >= discount.maxUses) return { valid: false, message: "Bu indirim kodu kullanım limitine ulaştı" };

    const discountPercent = Number(discount.discountPercent);
    const discountAmount = Math.round(price * discountPercent / 100);
    const finalPrice = price - discountAmount;

    return { valid: true, message: `%${discountPercent} indirim uygulandı!`, discountPercent, discountAmount, finalPrice };
  } catch {
    return { valid: false, message: "Kod doğrulanamadı" };
  }
}
