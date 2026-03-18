"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateVehicleStatusAction } from "@/app/actions/admin";

const statuses = [
  { value: "AVAILABLE", label: "Müsait" },
  { value: "MAINTENANCE", label: "Bakımda" },
  { value: "INACTIVE", label: "Pasif" },
];

export function VehicleStatusToggle({
  vehicleId,
  currentStatus,
}: {
  vehicleId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;
    setLoading(true);
    const result = await updateVehicleStatusAction(vehicleId, newStatus);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
    setLoading(false);
  }

  // Kiradaysa sadece göster, değiştirme
  if (currentStatus === "RENTED") {
    return (
      <span className="text-xs text-yellow-600 font-medium bg-yellow-50 border border-yellow-200 px-2 py-1 rounded">
        Kirada
      </span>
    );
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      disabled={loading}
      className="text-xs border rounded px-2 py-1 bg-white disabled:opacity-50 cursor-pointer"
    >
      {statuses.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}
