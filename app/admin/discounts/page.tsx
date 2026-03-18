import { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddDiscountDialog } from "@/components/admin/add-discount-dialog";
import { toggleDiscountCodeAction } from "@/app/actions/admin";
import { Tag, Calendar, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin — İndirim Kodları" };

export default async function AdminDiscountsPage() {
  const codes = await db.discountCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">İndirim Kodları</h1>
          <p className="text-muted-foreground mt-1">{codes.length} kod tanımlanmış</p>
        </div>
        <AddDiscountDialog />
      </div>

      <div className="space-y-3">
        {codes.length === 0 && (
          <Card><CardContent className="pt-8 pb-8 text-center text-muted-foreground">Henüz indirim kodu yok.</CardContent></Card>
        )}
        {codes.map((code) => {
          const expired = code.expiresAt && code.expiresAt < new Date();
          const limitReached = code.maxUses && code.usedCount >= code.maxUses;
          return (
            <Card key={code.id} className={!code.isActive || expired || limitReached ? "opacity-60" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold font-mono text-base tracking-wider">{code.code}</p>
                      <Badge variant="success" className="text-xs">%{Number(code.discountPercent).toFixed(0)} İndirim</Badge>
                      <Badge variant={code.isActive && !expired && !limitReached ? "success" : "secondary"} className="text-xs">
                        {!code.isActive ? "Pasif" : expired ? "Süresi Dolmuş" : limitReached ? "Limit Doldu" : "Aktif"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {code.usedCount}/{code.maxUses ?? "∞"} kullanım</span>
                      {code.expiresAt && (
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Bitiş: {formatDate(code.expiresAt)}</span>
                      )}
                    </div>
                  </div>
                  <form action={async () => {
                    "use server";
                    await toggleDiscountCodeAction(code.id);
                  }}>
                    <button type="submit" className={`text-xs px-2 py-1 rounded border transition-colors ${
                      code.isActive ? "text-orange-600 border-orange-200 hover:bg-orange-50" : "text-green-600 border-green-200 hover:bg-green-50"
                    }`}>
                      {code.isActive ? "Pasife Al" : "Aktife Al"}
                    </button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
