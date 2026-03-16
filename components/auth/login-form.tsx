"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "@/app/actions/auth";

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

  const [state, action] = useFormState(loginAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Giriş başarılı!", {
        description: "Yönlendiriliyorsunuz...",
      });
      router.push(callbackUrl);
      router.refresh();
    }
    if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state, router, callbackUrl]);

  return (
    <form action={action} className="space-y-4">
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

      {/* Şifre */}
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
          disabled={false}
          error={state.errors?.password?.[0]}
        />
      </div>

      {/* Submit */}
      <SubmitButton />

      {/* Register Link */}
      <p className="text-center text-sm text-muted-foreground">
        Hesabınız yok mu?{" "}
        <Link
          href="/register"
          className="text-primary font-medium hover:underline"
        >
          Üye olun
        </Link>
      </p>
    </form>
  );
}
