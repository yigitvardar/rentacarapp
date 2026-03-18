"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalı"),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Geçerli bir telefon numarası girin")
    .optional()
    .or(z.literal("")),
});

export type ProfileState = { success: boolean; message?: string; errors?: Record<string, string[]> };

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Oturum açmanız gerekiyor" };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });

  revalidatePath("/profile");
  return { success: true, message: "Profil güncellendi" };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifreyi girin"),
    newPassword: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalı")
      .regex(/[A-Z]/, "En az bir büyük harf içermeli")
      .regex(/[0-9]/, "En az bir rakam içermeli"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Oturum açmanız gerekiyor" };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
  if (!user?.password) return { success: false, message: "Şifre değiştirilemedi" };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) return { success: false, errors: { currentPassword: ["Mevcut şifre hatalı"] } };

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return { success: true, message: "Şifre değiştirildi" };
}
