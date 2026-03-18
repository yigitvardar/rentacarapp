"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createVehicleAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? "Ekleniyor..." : "Araç Ekle"}
    </Button>
  );
}

export function AddVehicleDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useFormState(createVehicleAction, {
    success: false,
    message: "",
  });

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      setOpen(false);
      formRef.current?.reset();
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" /> Araç Ekle
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Yeni Araç Ekle</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form ref={formRef} action={formAction} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="brand">Marka *</Label>
                  <Input id="brand" name="brand" placeholder="Toyota" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="model">Model *</Label>
                  <Input id="model" name="model" placeholder="Corolla" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="year">Yıl *</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    min={2000}
                    max={2030}
                    defaultValue={2024}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="plate">Plaka *</Label>
                  <Input id="plate" name="plate" placeholder="34 ABC 123" required />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="categoryId">Kategori *</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  required
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="">Kategori seçin</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="fuelType">Yakıt Tipi *</Label>
                  <select
                    id="fuelType"
                    name="fuelType"
                    required
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="GASOLINE">Benzin</option>
                    <option value="DIESEL">Dizel</option>
                    <option value="HYBRID">Hibrit</option>
                    <option value="ELECTRIC">Elektrik</option>
                    <option value="LPG">LPG</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="transmission">Vites *</Label>
                  <select
                    id="transmission"
                    name="transmission"
                    required
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    <option value="MANUAL">Manuel</option>
                    <option value="AUTOMATIC">Otomatik</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="seats">Koltuk Sayısı</Label>
                  <Input
                    id="seats"
                    name="seats"
                    type="number"
                    min={2}
                    max={9}
                    defaultValue={5}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dailyRate">Günlük Fiyat (₺) *</Label>
                  <Input
                    id="dailyRate"
                    name="dailyRate"
                    type="number"
                    min={1}
                    placeholder="1000"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <SubmitButton />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
