"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createDiscountCodeAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="flex-1">{pending ? "Oluşturuluyor..." : "Kod Oluştur"}</Button>;
}

export function AddDiscountDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(createDiscountCodeAction, { success: false, message: "" });

  useEffect(() => {
    if (!state.message) return;
    if (state.success) { toast.success(state.message); setOpen(false); formRef.current?.reset(); }
    else toast.error(state.message);
  }, [state]);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Yeni Kod</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">İndirim Kodu Oluştur</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form ref={formRef} action={formAction} className="p-5 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="dc-code">Kod *</Label>
                <Input id="dc-code" name="code" placeholder="YAZI2024" required className="font-mono uppercase" />
                <p className="text-xs text-muted-foreground">Harf ve rakamdan oluşan kod (otomatik büyük harfe çevrilir)</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="dc-pct">İndirim Oranı (%) *</Label>
                <Input id="dc-pct" name="discountPercent" type="number" min={1} max={100} placeholder="10" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="dc-max">Maks. Kullanım</Label>
                  <Input id="dc-max" name="maxUses" type="number" min={1} placeholder="Sınırsız" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dc-exp">Bitiş Tarihi</Label>
                  <Input id="dc-exp" name="expiresAt" type="date" min={new Date().toISOString().split("T")[0]} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <SubmitButton />
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
