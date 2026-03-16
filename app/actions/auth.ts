"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

// ============================================================
// VALIDASYON ŞEMALARI
// ============================================================

const registerSchema = z
  .object({
    name: z.string().min(2, "Ad en az 2 karakter olmalı"),
    email: z.string().email("Geçerli bir e-posta girin"),
    phone: z
      .string()
      .regex(/^[0-9]{10,11}$/, "Geçerli bir telefon numarası girin")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalı")
      .regex(/[A-Z]/, "En az bir büyük harf içermeli")
      .regex(/[0-9]/, "En az bir rakam içermeli"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre giriniz"),
});

// ============================================================
// KAYIT SERVER ACTION
// ============================================================

export type RegisterState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validasyon
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, phone, password } = parsed.data;

  // E-posta kontrolü
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false,
      errors: { email: ["Bu e-posta adresi zaten kullanılıyor"] },
    };
  }

  // Şifreyi hashle
  const hashedPassword = await bcrypt.hash(password, 12);

  // Kullanıcıyı oluştur
  await db.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: "USER",
    },
  });

  return {
    success: true,
    message: "Hesabınız oluşturuldu! Giriş yapabilirsiniz.",
  };
}

// ============================================================
// GİRİŞ SERVER ACTION
// ============================================================

export type LoginState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validasyon
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            errors: { email: ["E-posta veya şifre hatalı"] },
          };
        default:
          return {
            success: false,
            message: "Giriş sırasında bir hata oluştu",
          };
      }
    }
    throw error;
  }
}
