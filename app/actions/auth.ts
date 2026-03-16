"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

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
  try {
    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { name, email, phone, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return {
        success: false,
        errors: { email: ["Bu e-posta adresi zaten kullanılıyor"] },
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

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
  } catch (error) {
    console.error("Register error:", error);
    return {
      success: false,
      message: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.",
    };
  }
}

// ============================================================
// KİMLİK DOĞRULAMA — Client-side signIn için şifre kontrolü
// ============================================================

export type LoginState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre giriniz"),
});

// Sadece kimlik doğrulama yapar, oturum açmaz
// Oturum açma client-side next-auth/react signIn ile yapılır
export async function verifyCredentialsAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    const raw = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return {
        success: false,
        errors: { email: ["E-posta veya şifre hatalı"] },
      };
    }

    const isValid = await bcrypt.compare(parsed.data.password, user.password);
    if (!isValid) {
      return {
        success: false,
        errors: { email: ["E-posta veya şifre hatalı"] },
      };
    }

    // Başarılı — client signIn için email'i döndür
    return {
      success: true,
      message: parsed.data.email,
    };
  } catch (error) {
    console.error("Login verify error:", error);
    return {
      success: false,
      message: "Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.",
    };
  }
}
