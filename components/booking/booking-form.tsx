"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { CreditCard, Calendar, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBookingAction, type BookingState } from "@/app/actions/booking";

const initialState: BookingState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      {!pending && <CreditCard className="h-4 w-4" />}
      {pending ? "Hazırlanıyor..." : "Ödemeye Geç"}
    </Button>
  );
}

interface BookingFormProps {
  packageId: string;
  vehicleId: string;
  durationDays: number;
  maxDate: string;
}

export function BookingForm({ packageId, vehicleId, durationDays, maxDate }: BookingFormProps) {
  const [state, action] = useFormState(createBookingAction, initialState);
  const iframeRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!state.success) {
      if (state.message) toast.error(state.message);
      return;
    }

    // İyzico ödeme sayfasına yönlendir (client-side)
    if (state.paymentPageUrl) {
      toast.loading("İyzico ödeme sayfasına yönlendiriliyorsunuz...");
      window.location.href = state.paymentPageUrl;
      return;
    }

    // Embed form varsa DOM'a ekle
    if (state.checkoutFormContent && iframeRef.current) {
      iframeRef.current.innerHTML = state.checkoutFormContent;
      iframeRef.current.querySelectorAll("script").forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value)
        );
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [state]);

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4">
        <input type="hidden" name="packageId" value={packageId} />
        <input type="hidden" name="vehicleId" value={vehicleId} />

        {/* Başlangıç Tarihi */}
        <div className="space-y-1.5">
          <Label htmlFor="startDate" className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Kiralama Başlangıç Tarihi
          </Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            min={today}
            max={maxDate || undefined}
            required
            error={state.errors?.startDate?.[0]}
          />
          <p className="text-xs text-muted-foreground">
            Süre: <strong>{durationDays} gün</strong> — Bitiş tarihi otomatik hesaplanır
          </p>
        </div>

        {/* Hata mesajı */}
        {!state.success && state.message && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.message}
          </div>
        )}

        <SubmitButton />

        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <ExternalLink className="h-3 w-3" />
          İyzico güvencesiyle 3D Secure ödeme
        </p>
      </form>

      {/* İyzico embed form */}
      {state.success && state.checkoutFormContent && (
        <div className="border rounded-xl overflow-hidden">
          <div ref={iframeRef} id="iyzipay-checkout-form" />
        </div>
      )}
    </div>
  );
}
