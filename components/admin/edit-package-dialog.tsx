"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updatePackageAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { PackageFormFields } from "./package-form-fields";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";

interface Category { id: string; name: string; }
interface Pkg {
  id: string; name: string; description: string | null; categoryId: string | null;
  durationDays: number; basePrice: number; discountRate: number; includedKm: number | null; isActive: boolean;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="flex-1">{pending ? "Kaydediliyor..." : "Kaydet"}</Button>;
}

export function EditPackageDialog({ pkg, categories }: { pkg: Pkg; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const updateWithId = updatePackageAction.bind(null, pkg.id);
  const [state, formAction] = useFormState(updateWithId, { success: false, message: "" });

  useEffect(() => {
    if (!state.message) return;
    if (state.success) { toast.success(state.message); setOpen(false); }
    else toast.error(state.message);
  }, [state]);

  return (
    <>
      <button onClick={() => setOpen(true)} title="Düzenle" className="p-1.5 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-50 transition-colors">
        <Pencil className="h-4 w-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Paket Düzenle</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form action={formAction} className="p-5 space-y-4">
              <PackageFormFields
                categories={categories}
                defaults={{
                  name: pkg.name, description: pkg.description ?? "", categoryId: pkg.categoryId ?? "",
                  durationDays: pkg.durationDays, basePrice: pkg.basePrice, discountRate: pkg.discountRate,
                  includedKm: pkg.includedKm ?? undefined, isActive: pkg.isActive,
                }}
                showActive
              />
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
