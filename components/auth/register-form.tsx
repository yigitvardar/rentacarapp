"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction, type RegisterState } from "@/app/actions/auth";

const initialState: RegisterState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" loading={pending}>
      Hesap Oluştur
    </Button>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [state, action] = useFormState(registerAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Hesabınız oluşturuldu!", {
        description: "Giriş sayfasına yönlendiriliyorsunuz...",
      });
      setTimeout(() => router.push("/login"), 1500);
    }
    if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      {/* Ad Soyad */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Ad Soyad</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ahmet Yılmaz"
          autoComplete="name"
          disabled={false}
          error={state.errors?.name?.[0]}
        />
      </div>

      {/* E-posta */}
      <div className="space-y-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="ornek@email.com"
          autoComplete="email"
          disabled={false}
          error={state.errors?.email?.[0]}
        />
      </div>

      {/* Telefon */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">
          Telefon{" "}
          <span className="text-muted-foreground text-xs">(isteğe bağlı)</span>
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="05001234567"
          autoComplete="tel"
          disabled={false}
          error={state.errors?.phone?.[0]}
        />
      </div>

      {/* Şifre */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="En az 8 karakter"
          autoComplete="new-password"
          disabled={false}
          error={state.errors?.password?.[0]}
        />
        <p className="text-xs text-muted-foreground">
          En az 8 karakter, 1 büyük harf ve 1 rakam içermeli
        </p>
      </div>

      {/* Şifre Tekrar */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Şifrenizi tekrar girin"
          autoComplete="new-password"
          disabled={false}
          error={state.errors?.confirmPassword?.[0]}
        />
      </div>

      {/* Submit */}
      <SubmitButton />

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground">
        Zaten hesabınız var mı?{" "}
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}
