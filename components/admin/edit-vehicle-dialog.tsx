"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateVehicleAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";

interface Category { id: string; name: string; }
interface Vehicle {
  id: string; brand: string; model: string; year: number; plate: string;
  categoryId: string; fuelType: string; transmission: string; seats: number; dailyRate: number;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? "Kaydediliyor..." : "Kaydet"}
    </Button>
  );
}

export function EditVehicleDialog({ vehicle, categories }: { vehicle: Vehicle; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const updateWithId = updateVehicleAction.bind(null, vehicle.id);
  const [state, formAction] = useFormState(updateWithId, { success: false, message: "" });

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      setOpen(false);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Düzenle"
        className="p-1.5 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-50 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Araç Düzenle</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form ref={formRef} action={formAction} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-brand">Marka</Label>
                  <Input id="edit-brand" name="brand" defaultValue={vehicle.brand} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-model">Model</Label>
                  <Input id="edit-model" name="model" defaultValue={vehicle.model} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-year">Yıl</Label>
                  <Input id="edit-year" name="year" type="number" min={2000} max={2030} defaultValue={vehicle.year} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-plate">Plaka</Label>
                  <Input id="edit-plate" name="plate" defaultValue={vehicle.plate} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-category">Kategori</Label>
                <select id="edit-category" name="categoryId" defaultValue={vehicle.categoryId} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-fuel">Yakıt Tipi</Label>
                  <select id="edit-fuel" name="fuelType" defaultValue={vehicle.fuelType} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                    <option value="GASOLINE">Benzin</option>
                    <option value="DIESEL">Dizel</option>
                    <option value="HYBRID">Hibrit</option>
                    <option value="ELECTRIC">Elektrik</option>
                    <option value="LPG">LPG</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-trans">Vites</Label>
                  <select id="edit-trans" name="transmission" defaultValue={vehicle.transmission} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
                    <option value="MANUAL">Manuel</option>
                    <option value="AUTOMATIC">Otomatik</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-seats">Koltuk</Label>
                  <Input id="edit-seats" name="seats" type="number" min={2} max={9} defaultValue={vehicle.seats} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-rate">Günlük Fiyat (₺)</Label>
                  <Input id="edit-rate" name="dailyRate" type="number" min={1} defaultValue={vehicle.dailyRate} required />
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
