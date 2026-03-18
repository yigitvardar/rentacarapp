"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Poliçeyi Yazdır" }: { label?: string }) {
  return (
    <Button
      onClick={() => window.print()}
      size="lg"
      className="print:hidden"
    >
      <Printer className="h-4 w-4" />
      {label}
    </Button>
  );
}
