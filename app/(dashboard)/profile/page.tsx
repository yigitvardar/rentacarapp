import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileForm, PasswordForm } from "@/components/profile/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, Phone, Calendar } from "lucide-react";
import { formatDate, maskTcNumber, policyStatusLabels } from "@/lib/utils";

export const metadata: Metadata = { title: "Profilim" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      tcVerifications: { orderBy: { verifiedAt: "desc" }, take: 5 },
    },
  });

  if (!user) redirect("/login");

  const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
    ACTIVE: "success",
    EXPIRED: "destructive",
    SUSPENDED: "warning",
    NONE: "secondary",
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profilim</h1>
        <p className="text-muted-foreground mt-1">Hesap bilgilerinizi yönetin</p>
      </div>

      {/* Hesap Özeti */}
      <Card>
        <CardContent className="pt-6 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {user.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{user.name}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{user.email}</span>
                {user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{user.phone}</span>}
                {user.createdAt && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Üye: {formatDate(user.createdAt)}</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profil Düzenleme */}
      <ProfileForm name={user.name ?? ""} phone={user.phone} />

      {/* Şifre */}
      <PasswordForm />

      {/* TC Doğrulama Geçmişi */}
      {user.tcVerifications.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold text-base flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4" />
              Poliçe Geçmişi
            </h2>
            <div className="space-y-3">
              {user.tcVerifications.map((tc) => (
                <div key={tc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-mono font-medium">{maskTcNumber(tc.tcNumber)}</p>
                    <p className="text-xs text-muted-foreground">
                      {tc.policyNumber ?? "Poliçe yok"} • {formatDate(tc.verifiedAt)}
                    </p>
                  </div>
                  <Badge variant={statusVariant[tc.policyStatus] ?? "secondary"} className="text-xs">
                    {policyStatusLabels[tc.policyStatus] ?? tc.policyStatus}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
