"use client";

import { useState } from "react";
import { toast } from "sonner";
import { XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelRentalAction } from "@/app/actions/rental";

export function CancelRentalButton({ rentalId }: { rentalId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleCancel() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    setLoading(true);
    const result = await cancelRentalAction(rentalId);
    if (result.success) {
      toast.success("Kiralama iptal edildi");
    } else {
      toast.error(result.message);
    }
    setLoading(false);
    setConfirmed(false);
  }

  return (
    <Button
      size="sm"
      variant={confirmed ? "destructive" : "outline"}
      className="h-7 text-xs"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {confirmed ? "Emin misiniz?" : "İptal Et"}
    </Button>
  );
}
