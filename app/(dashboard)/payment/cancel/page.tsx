import { Metadata } from "next";
import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Ödeme İptal" };

const cancelReasons: Record<string, string> = {
  no_token: "Ödeme token'ı bulunamadı.",
  not_found: "Ödeme kaydı bulunamadı.",
  payment_failed: "Ödeme işlemi başarısız oldu.",
  error: "Beklenmeyen bir hata oluştu.",
};

export default async function PaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason: reasonParam } = await searchParams;
  const reason = reasonParam ?? "payment_failed";
  const message = cancelReasons[reason] ?? decodeURIComponent(reason);

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 animate-fade-in">
      {/* İptal İkonu */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-red-800">Ödeme Başarısız</h1>
          <p className="text-muted-foreground mt-1">
            Ödeme işlemi tamamlanamadı.
          </p>
        </div>
      </div>

      {/* Hata Detayı */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-red-700">{message}</p>
        </CardContent>
      </Card>

      {/* Test Kart Bilgisi (sadece geliştirme) */}
      {process.env.NODE_ENV !== "production" && (
        <Card className="border-dashed bg-muted/50">
          <CardContent className="pt-4 pb-4 text-sm space-y-2">
            <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
              Sandbox Test Kartları
            </p>
            <div className="font-mono text-xs space-y-1">
              <p>
                <span className="text-green-600">Başarılı:</span> 4506 3490
                0000 0006
              </p>
              <p>
                <span className="text-red-600">Başarısız:</span> 4508 0348
                1005 0003
              </p>
              <p className="text-muted-foreground">Son Kullanma: Herhangi bir gelecek tarih</p>
              <p className="text-muted-foreground">CVV: 000 | 3D Şifre: a</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Butonlar */}
      <div className="flex flex-col gap-3">
        <Button asChild size="lg">
          <Link href="/packages">
            <RefreshCw className="h-4 w-4" />
            Tekrar Dene
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard'a Dön
          </Link>
        </Button>
      </div>
    </div>
  );
}
