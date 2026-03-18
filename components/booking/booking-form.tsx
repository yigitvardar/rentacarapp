"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { CreditCard, Calendar, AlertCircle, ExternalLink, Tag, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createBookingAction, type BookingState } from "@/app/actions/booking";
import { validateDiscountCode } from "@/app/actions/discount";
import { formatCurrency } from "@/lib/utils";

const initialState: BookingState = { success: false };

type BookedRange = { start: string; end: string };

function isDateConflicting(selectedStart: string, durationDays: number, ranges: BookedRange[]): boolean {
  if (!selectedStart || ranges.length === 0) return false;
  const start = new Date(selectedStart);
  const end = new Date(selectedStart);
  end.setDate(end.getDate() + durationDays);
  return ranges.some((r) => start < new Date(r.end) && end > new Date(r.start));
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending} disabled={pending || disabled}>
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
  basePrice: number;
  packageBasePrice: number;
  packageDiscountRate: number;
}

export function BookingForm({ packageId, vehicleId, durationDays, maxDate, basePrice, packageBasePrice, packageDiscountRate }: BookingFormProps) {
  const [state, action] = useFormState(createBookingAction, initialState);
  const iframeRef = useRef<HTMLDivElement>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState<{ code: string; percent: number; amount: number; finalPrice: number } | null>(null);
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [startDate, setStartDate] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const dateConflict = isDateConflicting(startDate, durationDays, bookedRanges);

  useEffect(() => {
    fetch(`/api/vehicles/${vehicleId}/availability`)
      .then((r) => r.json())
      .then((data) => setBookedRanges(data))
      .catch(() => {});
  }, [vehicleId]);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    const result = await validateDiscountCode(couponInput, basePrice);
    setCouponLoading(false);
    if (result.valid) {
      setDiscount({ code: couponInput.toUpperCase(), percent: result.discountPercent!, amount: result.discountAmount!, finalPrice: result.finalPrice! });
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

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

  const displayTotal = discount ? discount.finalPrice : basePrice;

  return (
    <div className="space-y-6">
      {/* Dinamik Fiyat Özeti */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Paket fiyatı</span>
          <span>{formatCurrency(packageBasePrice)}</span>
        </div>
        {packageDiscountRate > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Paket indirimi (%{packageDiscountRate.toFixed(0)})</span>
            <span>- {formatCurrency(packageBasePrice - basePrice)}</span>
          </div>
        )}
        {discount && (
          <div className="flex justify-between text-blue-600">
            <span>Kupon ({discount.code}, %{discount.percent})</span>
            <span>- {formatCurrency(discount.amount)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Toplam</span>
          <span className="text-primary">{formatCurrency(displayTotal)}</span>
        </div>
      </div>

      {/* Güvenceler */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {["3D Secure ile güvenli ödeme", "İyzico ödeme güvencesi", "Sigorta kapsamında kiralama"].map((item) => (
          <div key={item} className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
            {item}
          </div>
        ))}
      </div>

      <Separator />

      <form action={action} className="space-y-4">
        <input type="hidden" name="packageId" value={packageId} />
        <input type="hidden" name="vehicleId" value={vehicleId} />
        {discount && <input type="hidden" name="discountCode" value={discount.code} />}

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
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={state.errors?.startDate?.[0]}
          />
          {dateConflict ? (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Bu araç seçilen tarihler için müsait değil, lütfen farklı bir tarih seçin.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Süre: <strong>{durationDays} gün</strong> — Bitiş tarihi otomatik hesaplanır
            </p>
          )}
        </div>

        {/* İndirim Kodu */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Tag className="h-4 w-4" /> İndirim Kodu</Label>
          {discount ? (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg text-sm">
              <Check className="h-4 w-4 text-green-600 shrink-0" />
              <span className="font-medium text-green-800 flex-1">{discount.code} — %{discount.percent} indirim ({formatCurrency(discount.amount)} kazanç)</span>
              <button type="button" onClick={() => setDiscount(null)} className="text-green-600 hover:text-green-800"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input placeholder="Kodu girin" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())} />
              <Button type="button" variant="outline" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}>
                {couponLoading ? "..." : "Uygula"}
              </Button>
            </div>
          )}
        </div>

        {/* Hata mesajı */}
        {!state.success && state.message && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.message}
          </div>
        )}

        <SubmitButton disabled={dateConflict} />

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
