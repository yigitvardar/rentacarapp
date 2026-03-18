import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatDateTime, maskTcNumber } from "@/lib/utils";
import { PrintButton } from "@/components/policy/print-button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, Car, Calendar, User, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Araç Kiralama Poliçesi" };

const coverageLabels: Record<string, string> = {
  BASIC: "Temel Kasko",
  COMPREHENSIVE: "Tam Kasko",
  PREMIUM: "Premium Kasko",
};

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ rentalId: string }>;
}) {
  const { rentalId } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const rental = await db.rental.findUnique({
    where: { id: rentalId, userId: session.user.id },
    include: {
      vehicle: { include: { category: true } },
      package: true,
      payment: true,
      user: true,
    },
  });

  if (!rental || rental.status !== "CONFIRMED") redirect("/dashboard");

  const tcVerification = await db.tcVerification.findFirst({
    where: { userId: session.user.id, policyStatus: "ACTIVE" },
    orderBy: { verifiedAt: "desc" },
  });

  const policyScope = tcVerification?.policyScope as {
    coverageType?: string;
    benefits?: string[];
    policyNumber?: string;
  } | null;

  const coverageType = policyScope?.coverageType ?? "BASIC";
  const benefits: string[] = policyScope?.benefits ?? [];
  const issueDate = rental.payment?.paidAt ?? rental.createdAt;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      {/* Geri dön butonu — yazdırmada gizli */}
      <div className="print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard'a Dön
          </Link>
        </Button>
      </div>

      {/* Poliçe Belgesi */}
      <div className="border rounded-xl p-8 space-y-6 bg-white print:border-0 print:p-0">
        {/* Başlık */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Sigorta Destekli Araç Kiralama Poliçesi</h1>
          <p className="text-sm text-muted-foreground">
            Düzenleme Tarihi: {formatDateTime(issueDate)}
          </p>
          <Badge variant="success" className="mt-1">
            {coverageLabels[coverageType] ?? coverageType}
          </Badge>
        </div>

        <Separator />

        {/* Poliçe No & Rezervasyon No */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Rezervasyon No</p>
            <code className="font-mono font-semibold text-base">
              {rental.id.slice(-8).toUpperCase()}
            </code>
          </div>
          {rental.payment?.iyzicoPaymentId && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Ödeme ID</p>
              <code className="font-mono text-sm">{rental.payment.iyzicoPaymentId}</code>
            </div>
          )}
        </div>

        <Separator />

        {/* Sigortalı Bilgileri */}
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <User className="h-4 w-4" />
            Sigortalı Bilgileri
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Ad Soyad</p>
              <p className="font-semibold">{rental.user.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">E-posta</p>
              <p className="font-semibold">{rental.user.email}</p>
            </div>
            {tcVerification?.tcNumber && (
              <div>
                <p className="text-muted-foreground">TC Kimlik No</p>
                <p className="font-semibold font-mono">{maskTcNumber(tcVerification.tcNumber)}</p>
              </div>
            )}
            {tcVerification?.policyNumber && (
              <div>
                <p className="text-muted-foreground">Poliçe Numarası</p>
                <p className="font-semibold">{tcVerification.policyNumber}</p>
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* Araç Bilgileri */}
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <Car className="h-4 w-4" />
            Araç Bilgileri
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Marka / Model</p>
              <p className="font-semibold">{rental.vehicle.brand} {rental.vehicle.model}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Plaka</p>
              <p className="font-semibold font-mono">{rental.vehicle.plate}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kategori</p>
              <p className="font-semibold">{rental.vehicle.category.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Yıl</p>
              <p className="font-semibold">{rental.vehicle.year}</p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Kiralama Bilgileri */}
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Kiralama Bilgileri
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Başlangıç Tarihi</p>
              <p className="font-semibold">{formatDate(rental.startDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bitiş Tarihi</p>
              <p className="font-semibold">{formatDate(rental.endDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kiralama Süresi</p>
              <p className="font-semibold">{rental.totalDays} gün</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ödenen Tutar</p>
              <p className="font-semibold text-primary">{formatCurrency(Number(rental.totalPrice))}</p>
            </div>
          </div>
        </section>

        {/* Sigorta Kapsamı */}
        {benefits.length > 0 && (
          <>
            <Separator />
            <section className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                <Shield className="h-4 w-4" />
                Sigorta Kapsamı
              </h2>
              <ul className="space-y-1.5 text-sm">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <Separator />

        {/* Alt Bilgi */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Bu belge, aracı teslim alırken yanınızda bulundurmanız gerekmektedir.
          </p>
          <p>Yanınızda TC kimliğinizi ve sürücü belgenizi de bulundurun.</p>
        </div>
      </div>

      {/* Yazdır Butonu */}
      <div className="print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
