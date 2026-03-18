"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createPackageAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { PackageFormFields } from "./package-form-fields";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Category { id: string; name: string; }

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="flex-1">{pending ? "Ekleniyor..." : "Paket Ekle"}</Button>;
}

export function AddPackageDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(createPackageAction, { success: false, message: "" });

  useEffect(() => {
    if (!state.message) return;
    if (state.success) { toast.success(state.message); setOpen(false); formRef.current?.reset(); }
    else toast.error(state.message);
  }, [state]);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Paket Ekle</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Yeni Paket Ekle</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form ref={formRef} action={formAction} className="p-5 space-y-4">
              <PackageFormFields categories={categories} />
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
