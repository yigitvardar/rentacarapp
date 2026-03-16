import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Shield, CheckCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TcVerifyForm } from "@/components/auth/tc-verify-form";
import { formatDate } from "@/lib/utils";
import { coverageTypeLabels } from "@/lib/insurance";

export const metadata: Metadata = {
  title: "TC Kimlik Doğrulama",
};

export default async function TcVerifyPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Mevcut doğrulama kaydını getir
  const existing = await db.tcVerification.findFirst({
    where: { userId: session.user.id },
    orderBy: { verifiedAt: "desc" },
  });

  const hasActive = existing?.policyStatus === "ACTIVE";
  const scope = existing?.policyScope as {
    vehicleCategories?: string[];
    maxDailyRate?: number;
    maxDuration?: number;
    additionalBenefits?: string[];
  } | null;

  return (
    <div className="max-w-xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">TC Kimlik Doğrulama</h1>
        <p className="text-muted-foreground mt-1">
          Sigorta poliçenize özel araç kiralama paketlerini görmek için TC
          kimlik numaranızı doğrulayın.
        </p>
      </div>

      {/* Mevcut aktif doğrulama varsa göster */}
      {existing && hasActive && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Doğrulanmış Poliçe
              </CardTitle>
              <Badge variant="success">Aktif</Badge>
            </div>
            <CardDescription className="text-green-700">
              Poliçe No: {existing.policyNumber ?? "-"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground text-xs">TC (Maskeli)</span>
                <p className="font-mono font-medium">{existing.tcNumber}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Kapsam</span>
                <p className="font-medium">
                  {scope
                    ? coverageTypeLabels[
                        (existing.policyScope as { vehicleCategories?: string[] } & Record<string, unknown>)
                          ?.coverageType as string ?? ""
                      ] ?? "Aktif Kapsam"
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  Uygun Kategoriler
                </span>
                <p className="font-medium">
                  {scope?.vehicleCategories?.join(", ") ?? "-"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  Poliçe Bitişi
                </span>
                <p className="font-medium">
                  {existing.expiresAt ? formatDate(existing.expiresAt) : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sorgulama Formu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            {existing ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                Yeniden Sorgula
              </span>
            ) : (
              "Poliçe Sorgula"
            )}
          </CardTitle>
          <CardDescription>
            {existing
              ? "Farklı bir TC kimliği ile sorgulayabilir veya mevcut poliçenizi güncelleyebilirsiniz."
              : "TC kimlik numaranızı girerek sigorta poliçenizi sorgulayın."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TcVerifyForm />
        </CardContent>
      </Card>

      {/* Güvenlik notu */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              TC kimlik numaranız yalnızca sigorta poliçenizi sorgulamak
              amacıyla kullanılır. Sistemimizde maskelenmiş biçimde saklanır
              ve üçüncü taraflarla paylaşılmaz.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
