"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyCredentialsAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" loading={pending}>
      Giriş Yap
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [state, action] = useFormState(verifyCredentialsAction, initialState);

  useEffect(() => {
    if (!state.success) {
      if (state.message && !state.errors) toast.error(state.message);
      return;
    }

    // Kimlik doğrulandı — şimdi client-side oturum aç
    const email = state.message!;
    const formData = document.querySelector("form");
    const password = (formData?.querySelector("#password") as HTMLInputElement)?.value;

    if (!email || !password) return;

    setIsSigningIn(true);
    signIn("credentials", { email, password, redirect: false })
      .then((result) => {
        if (result?.error) {
          toast.error("Giriş yapılamadı. Tekrar deneyin.");
        } else {
          toast.success("Giriş başarılı!");
          router.push(callbackUrl);
          router.refresh();
        }
      })
      .catch(() => toast.error("Beklenmeyen hata oluştu."))
      .finally(() => setIsSigningIn(false));
  }, [state, router, callbackUrl]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="ornek@email.com"
          autoComplete="email"
          error={state.errors?.email?.[0]}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Şifre</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Şifremi unuttum
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Şifrenizi girin"
          autoComplete="current-password"
          error={state.errors?.password?.[0]}
        />
      </div>

      {state.message && !state.success && !state.errors && (
        <p className="text-sm text-destructive text-center">{state.message}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={isSigningIn}
        disabled={isSigningIn}
      >
        Giriş Yap
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Hesabınız yok mu?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Üye olun
        </Link>
      </p>
    </form>
  );
}
