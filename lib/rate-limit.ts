import { db } from "@/lib/db";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * DB tabanlı rate limiter — serverless ortamlarda güvenli çalışır.
 * key: örn. "tc-verify:userId", "register:ip"
 * maxAttempts: penceredeki maksimum istek sayısı
 * windowSeconds: pencere süresi (saniye)
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  const existing = await db.rateLimit.findUnique({ where: { key } });

  // Kayıt yok veya pencere dolmuş → yeni pencere başlat
  if (!existing || existing.resetAt < now) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt },
    });
    return { allowed: true, remaining: maxAttempts - 1, resetAt };
  }

  // Limit aşıldı
  if (existing.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  // Sayacı artır
  const updated = await db.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return {
    allowed: true,
    remaining: maxAttempts - updated.count,
    resetAt: existing.resetAt,
  };
}

/** Belirli bir key'in limitini sıfırla (başarılı işlem sonrası) */
export async function resetRateLimit(key: string) {
  await db.rateLimit.deleteMany({ where: { key } });
}
