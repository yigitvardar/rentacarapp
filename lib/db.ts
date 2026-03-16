import { PrismaClient } from "@prisma/client";

// Prisma client singleton — Next.js hot-reload sırasında birden fazla
// instance oluşmasını önler (geliştirme ortamı için önemli)
declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
