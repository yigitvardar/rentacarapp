import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Bir araç için gelecekteki dolu tarih aralıklarını döndürür
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const { vehicleId } = await params;
  const rentals = await db.rental.findMany({
    where: {
      vehicleId,
      status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
      endDate: { gte: new Date() },
    },
    select: { startDate: true, endDate: true },
  });

  return NextResponse.json(
    rentals.map((r) => ({
      start: r.startDate.toISOString().split("T")[0],
      end: r.endDate.toISOString().split("T")[0],
    }))
  );
}
