import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Car, Calendar, ArrowRight, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Ödeme Başarılı" };

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ rentalId?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { rentalId } = await searchParams;
  if (!rentalId) redirect("/dashboard");

  const rental = await db.rental.findUnique({
    where: { id: rentalId, userId: session.user.id },
    include: {
      vehicle: { include: { category: true } },
      package: true,
      payment: true,
    },
  });

  if (!rental) redirect("/dashboard");

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6 animate-fade-in">
      {/* Başarı İkonu */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-green-800">
            Ödeme Başarılı!
          </h1>
          <p className="text-muted-foreground mt-1">
            Rezervasyonunuz onaylandı. İyi yolculuklar!
          </p>
        </div>
      </div>

      {/* Rezervasyon Detayları */}
      <Card className="border-green-200">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Rezervasyon No</p>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
              {rental.id.slice(-8).toUpperCase()}
            </code>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">
                {rental.vehicle.brand} {rental.vehicle.model}
              </p>
              <p className="text-sm text-muted-foreground">
                {rental.vehicle.plate} • {rental.vehicle.category.name}
              </p>
            </div>
            <Badge variant="success" className="ml-auto">
              Onaylandı
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Başlangıç
              </p>
              <p className="font-semibold">{formatDate(rental.startDate)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Bitiş
              </p>
              <p className="font-semibold">{formatDate(rental.endDate)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Süre</p>
              <p className="font-semibold">{rental.totalDays} gün</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Ödenen Tutar</p>
              <p className="font-semibold text-primary">
                {formatCurrency(Number(rental.totalPrice))}
              </p>
            </div>
          </div>

          {rental.payment?.iyzicoPaymentId && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              İyzico Ödeme ID: {rental.payment.iyzicoPaymentId}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bilgi Kartı */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 pb-4 text-sm text-blue-800 space-y-2">
          <p className="font-semibold">Sonraki Adımlar</p>
          <ul className="space-y-1 text-blue-700">
            <li>• Araç teslim için belirtilen adreste olun</li>
            <li>• Yanınızda TC kimliğinizi ve ehliyetinizi bulundurun</li>
            <li>• Kiralama belgesi e-posta adresinize gönderilecektir</li>
          </ul>
        </CardContent>
      </Card>

      {/* Butonlar */}
      <div className="flex flex-col gap-3">
        <Button asChild size="lg">
          <Link href="/dashboard">
            Dashboard'a Dön
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={`/policy/${rental.id}`}>
            <Printer className="h-4 w-4" />
            Poliçeyi Görüntüle &amp; Yazdır
          </Link>
        </Button>
      </div>
    </div>
  );
}
