"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { queryInsurancePolicy } from "@/lib/insurance";
import { validateTcNumber } from "@/lib/utils";
import { revalidatePath } from "next/cache";

const tcSchema = z.object({
  tcNumber: z
    .string()
    .length(11, "TC kimlik numarası 11 haneli olmalıdır")
    .regex(/^\d+$/, "TC kimlik numarası sadece rakam içermelidir"),
});

export type TcVerifyState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  policyStatus?: string;
  policyData?: {
    policyNumber?: string;
    coverageType?: string;
    endDate?: string;
    categories?: string[];
    benefits?: string[];
    maxDailyRate?: number;
    maxDuration?: number;
  };
};

export async function tcVerifyAction(
  _prevState: TcVerifyState,
  formData: FormData
): Promise<TcVerifyState> {
  // Oturum kontrolü
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Oturum açmanız gerekiyor" };
  }

  const raw = { tcNumber: formData.get("tcNumber") as string };

  // Format validasyonu
  const parsed = tcSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { tcNumber } = parsed.data;

  // TC algoritma doğrulaması
  if (!validateTcNumber(tcNumber)) {
    return {
      success: false,
      errors: { tcNumber: ["Geçersiz TC kimlik numarası"] },
    };
  }

  // Sigorta API sorgusu
  const policyResult = await queryInsurancePolicy(tcNumber);

  // Veritabanına kaydet (önceki kaydı güncelle veya yeni oluştur)
  const tcMasked = `${tcNumber.slice(0, 3)}****${tcNumber.slice(7)}`;

  await db.tcVerification.upsert({
    where: {
      // userId başına tek kayıt tutuyoruz
      id: (
        await db.tcVerification.findFirst({
          where: { userId: session.user.id },
          select: { id: true },
        })
      )?.id ?? "new",
    },
    update: {
      tcNumber: tcMasked,
      policyNumber: policyResult.policyNumber ?? null,
      policyStatus: policyResult.policyStatus ?? "NONE",
      policyScope: policyResult.coverageDetails
        ? JSON.parse(JSON.stringify(policyResult.coverageDetails))
        : null,
      verifiedAt: new Date(),
      expiresAt: policyResult.endDate
        ? new Date(policyResult.endDate)
        : null,
    },
    create: {
      userId: session.user.id,
      tcNumber: tcMasked,
      policyNumber: policyResult.policyNumber ?? null,
      policyStatus: policyResult.policyStatus ?? "NONE",
      policyScope: policyResult.coverageDetails
        ? JSON.parse(JSON.stringify(policyResult.coverageDetails))
        : null,
      verifiedAt: new Date(),
      expiresAt: policyResult.endDate
        ? new Date(policyResult.endDate)
        : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/tc-verify");

  // Poliçe bulunamadı
  if (!policyResult.found || policyResult.policyStatus === "NONE") {
    return {
      success: true,
      policyStatus: "NONE",
      message:
        "Bu TC kimlik numarasına ait aktif bir sigorta poliçesi bulunamadı.",
    };
  }

  // Süresi dolmuş poliçe
  if (policyResult.policyStatus === "EXPIRED") {
    return {
      success: true,
      policyStatus: "EXPIRED",
      message: "Sigorta poliçenizin süresi dolmuştur. Yenilemeniz gerekiyor.",
      policyData: {
        policyNumber: policyResult.policyNumber,
        coverageType: policyResult.coverageType,
        endDate: policyResult.endDate,
      },
    };
  }

  // Aktif poliçe — başarılı
  return {
    success: true,
    policyStatus: "ACTIVE",
    message: "Sigorta poliçeniz doğrulandı! Size özel paketler hazırlanıyor.",
    policyData: {
      policyNumber: policyResult.policyNumber,
      coverageType: policyResult.coverageType,
      endDate: policyResult.endDate,
      categories: policyResult.coverageDetails?.vehicleCategories,
      benefits: policyResult.coverageDetails?.additionalBenefits,
      maxDailyRate: policyResult.coverageDetails?.maxDailyRate,
      maxDuration: policyResult.coverageDetails?.maxDuration,
    },
  };
}
