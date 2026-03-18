import { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { User, Shield, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Admin — Kullanıcılar" };

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    include: {
      tcVerifications: { orderBy: { verifiedAt: "desc" }, take: 1 },
      rentals: { where: { status: { in: ["CONFIRMED", "ACTIVE"] } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <p className="text-muted-foreground mt-1">{users.length} kayıtlı kullanıcı</p>
      </div>

      <div className="space-y-3">
        {users.map((user) => {
          const latestTc = user.tcVerifications[0];
          const activeRentals = user.rentals.length;

          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <Link href={`/admin/users/${user.id}`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {user.role === "ADMIN" ? (
                      <Shield className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{user.name ?? "—"}</p>
                      {user.role === "ADMIN" && (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      )}
                      {activeRentals > 0 && (
                        <Badge variant="success" className="text-xs">{activeRentals} aktif kiralama</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {latestTc && (
                      <p className="text-xs text-muted-foreground">
                        Poliçe: {latestTc.policyNumber ?? "—"} •{" "}
                        <span className={
                          latestTc.policyStatus === "ACTIVE" ? "text-green-600" :
                          latestTc.policyStatus === "EXPIRED" ? "text-red-600" : "text-muted-foreground"
                        }>
                          {latestTc.policyStatus}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="text-right text-xs text-muted-foreground shrink-0 flex items-center gap-3">
                    <div>
                      <p>Kayıt: {user.createdAt ? formatDate(user.createdAt) : "—"}</p>
                      {user.phone && <p>{user.phone}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
