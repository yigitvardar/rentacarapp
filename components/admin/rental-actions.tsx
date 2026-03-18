"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateRentalStatusAction } from "@/app/actions/admin";

const transitions: Record<string, { value: string; label: string; style: string }[]> = {
  PENDING: [
    { value: "CONFIRMED", label: "Onayla", style: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
    { value: "CANCELLED", label: "İptal Et", style: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
  ],
  CONFIRMED: [
    { value: "ACTIVE", label: "Aktife Al", style: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
    { value: "CANCELLED", label: "İptal Et", style: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
  ],
  ACTIVE: [
    { value: "COMPLETED", label: "Tamamlandı", style: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100" },
  ],
};

export function AdminRentalActions({
  rentalId,
  currentStatus,
  vehicleId,
}: {
  rentalId: string;
  currentStatus: string;
  vehicleId: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const actions = transitions[currentStatus] ?? [];

  if (actions.length === 0) return null;

  async function handleAction(newStatus: string) {
    setLoading(newStatus);
    const result = await updateRentalStatusAction(rentalId, newStatus, vehicleId);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
    setLoading(null);
  }

  return (
    <div className="flex gap-1.5 shrink-0">
      {actions.map(({ value, label, style }) => (
        <button
          key={value}
          onClick={() => handleAction(value)}
          disabled={loading !== null}
          className={`text-xs border rounded px-2.5 py-1 font-medium transition-colors disabled:opacity-50 ${style}`}
        >
          {loading === value ? "..." : label}
        </button>
      ))}
    </div>
  );
}
