"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { toast } from "sonner";
import { updateProfileAction, changePasswordAction, type ProfileState } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Lock } from "lucide-react";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending} disabled={pending}>{label}</Button>;
}

const initial: ProfileState = { success: false };

export function ProfileForm({ name, phone }: { name: string; phone?: string | null }) {
  const [state, action] = useFormState(updateProfileAction, initial);

  useEffect(() => {
    if (state.message) {
      state.success ? toast.success(state.message) : toast.error(state.message);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          Kişisel Bilgiler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input id="name" name="name" defaultValue={name} required />
            {state.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefon (opsiyonel)</Label>
            <Input id="phone" name="phone" defaultValue={phone ?? ""} placeholder="05xxxxxxxxx" />
            {state.errors?.phone && <p className="text-xs text-destructive">{state.errors.phone[0]}</p>}
          </div>
          <SubmitButton label="Kaydet" />
        </form>
      </CardContent>
    </Card>
  );
}

export function PasswordForm() {
  const [state, action] = useFormState(changePasswordAction, initial);

  useEffect(() => {
    if (state.message) {
      state.success ? toast.success(state.message) : toast.error(state.message);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4" />
          Şifre Değiştir
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Mevcut Şifre</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required />
            {state.errors?.currentPassword && <p className="text-xs text-destructive">{state.errors.currentPassword[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Yeni Şifre</Label>
            <Input id="newPassword" name="newPassword" type="password" required />
            {state.errors?.newPassword && <p className="text-xs text-destructive">{state.errors.newPassword[0]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
            {state.errors?.confirmPassword && <p className="text-xs text-destructive">{state.errors.confirmPassword[0]}</p>}
          </div>
          <SubmitButton label="Şifreyi Değiştir" />
        </form>
      </CardContent>
    </Card>
  );
}
