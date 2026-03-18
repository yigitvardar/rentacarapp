import { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, User, Car, CheckCheck } from "lucide-react";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = { title: "Admin — Sorun Bildirimleri" };

async function markAsRead(id: string) {
  "use server";
  await db.issueReport.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/admin/issues");
}

async function markAllAsRead() {
  "use server";
  await db.issueReport.updateMany({ where: { isRead: false }, data: { isRead: true } });
  revalidatePath("/admin/issues");
}

export default async function AdminIssuesPage() {
  const issues = await db.issueReport.findMany({
    include: {
      user: true,
      rental: { include: { vehicle: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = issues.filter((i) => !i.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Sorun Bildirimleri
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {issues.length} bildirim • {unreadCount} okunmamış
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllAsRead}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tümünü Okundu İşaretle
            </button>
          </form>
        )}
      </div>

      {issues.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Henüz sorun bildirimi yok.</p>
        </div>
      )}

      <div className="space-y-3">
        {issues.map((issue) => (
          <Card
            key={issue.id}
            className={`transition-colors ${!issue.isRead ? "border-orange-200 bg-orange-50/50" : ""}`}
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                {/* Okunmamış göstergesi */}
                <div className="mt-1 shrink-0">
                  {!issue.isRead ? (
                    <span className="block w-2 h-2 rounded-full bg-orange-500" />
                  ) : (
                    <span className="block w-2 h-2 rounded-full bg-gray-200" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  {/* Başlık */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{issue.subject}</p>
                    {!issue.isRead && (
                      <Badge variant="destructive" className="text-xs">Yeni</Badge>
                    )}
                  </div>

                  {/* Meta bilgiler */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {issue.user.name} ({issue.user.email})
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {issue.rental.vehicle.brand} {issue.rental.vehicle.model} — {issue.rental.vehicle.plate}
                    </span>
                    <span>{formatDate(issue.createdAt)}</span>
                  </div>

                  {/* Mesaj */}
                  <p className="text-sm text-foreground whitespace-pre-wrap bg-white border rounded-lg px-3 py-2 mt-1">
                    {issue.message}
                  </p>
                </div>

                {/* Okundu butonu */}
                {!issue.isRead && (
                  <form action={markAsRead.bind(null, issue.id)} className="shrink-0">
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-green-600 border border-green-200 hover:bg-green-50 transition-colors"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Okundu
                    </button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
