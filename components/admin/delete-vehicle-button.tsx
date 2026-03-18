"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteVehicleAction } from "@/app/actions/admin";

export function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    setLoading(true);
    const result = await deleteVehicleAction(vehicleId);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
    setLoading(false);
    setConfirm(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title={confirm ? "Emin misiniz? Tekrar tıklayın" : "Aracı sil"}
      className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
        confirm
          ? "bg-red-100 text-red-600 hover:bg-red-200"
          : "text-muted-foreground hover:text-red-500 hover:bg-red-50"
      }`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
