import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { PrintButton } from "@/components/policy/print-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Fatura" };

export default async function InvoicePage({ params }: { params: Promise<{ rentalId: string }> }) {
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

  if (!rental || rental.status === "CANCELLED") notFound();
  if (!rental.payment || rental.payment.status !== "SUCCESS") {
    redirect("/dashboard");
  }

  const invoiceNo = `INV-${rental.id.slice(-8).toUpperCase()}`;
  const kdvRate = 0.20; // %20 KDV
  const netPrice = Math.round(Number(rental.totalPrice) / (1 + kdvRate));
  const kdv = Number(rental.totalPrice) - netPrice;

  return (
    <>
      {/* Üst bar - sadece ekranda görünür */}
      <div className="print:hidden mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /> Geri</Link>
        </Button>
        <PrintButton label="Faturayı İndir / Yazdır" />
      </div>

      {/* Fatura */}
      <div id="invoice" className="max-w-2xl mx-auto bg-white p-8 print:p-0 print:max-w-none print:shadow-none rounded-xl shadow-sm border print:border-0">
        {/* Başlık */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">FATURA</h1>
            <p className="text-muted-foreground text-sm mt-1">Araç Kiralama Hizmet Faturası</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg font-mono">{invoiceNo}</p>
            <p className="text-sm text-muted-foreground">
              {rental.payment?.paidAt ? formatDate(rental.payment.paidAt) : formatDate(rental.createdAt)}
            </p>
          </div>
        </div>

        {/* Satıcı & Müşteri */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Satıcı</p>
            <p className="font-bold">Araç Kiralama A.Ş.</p>
            <p className="text-sm text-muted-foreground">İstanbul, Türkiye</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Müşteri</p>
            <p className="font-bold">{rental.user.name}</p>
            <p className="text-sm text-muted-foreground">{rental.user.email}</p>
          </div>
        </div>

        {/* Kira Detayları */}
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-muted-foreground font-medium">Açıklama</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Birim</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Adet</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Tutar</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3">
                <p className="font-medium">{rental.vehicle.brand} {rental.vehicle.model} Kiralama</p>
                <p className="text-xs text-muted-foreground">{rental.vehicle.plate} • {formatDate(rental.startDate)} – {formatDate(rental.endDate)}</p>
                {rental.package && <p className="text-xs text-muted-foreground">{rental.package.name}</p>}
              </td>
              <td className="text-right py-3">{formatCurrency(Number(rental.totalPrice) / rental.totalDays)}/gün</td>
              <td className="text-right py-3">{rental.totalDays} gün</td>
              <td className="text-right py-3 font-medium">{formatCurrency(netPrice)}</td>
            </tr>
            {rental.discountCode && (
              <tr className="border-b border-gray-100 text-green-700">
                <td className="py-2">İndirim Kodu ({rental.discountCode})</td>
                <td /><td />
                <td className="text-right py-2">-{formatCurrency(Number(rental.discountAmount ?? 0))}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Toplam */}
        <div className="border-t-2 border-gray-200 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ara Toplam (KDV Hariç)</span>
            <span>{formatCurrency(netPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">KDV (%20)</span>
            <span>{formatCurrency(kdv)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
            <span>TOPLAM</span>
            <span className="text-primary">{formatCurrency(Number(rental.totalPrice))}</span>
          </div>
        </div>

        {/* Ödeme Bilgisi */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-xs text-muted-foreground space-y-1 print:bg-transparent print:border print:border-gray-200">
          <p><strong>Ödeme Yöntemi:</strong> Online — İyzico</p>
          {rental.payment?.iyzicoPaymentId && (
            <p><strong>Ödeme ID:</strong> {rental.payment.iyzicoPaymentId}</p>
          )}
          <p><strong>Ödeme Tarihi:</strong> {rental.payment?.paidAt ? formatDateTime(rental.payment.paidAt) : "-"}</p>
          <p><strong>Rezervasyon No:</strong> {rental.id.slice(-12).toUpperCase()}</p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>Bu fatura elektronik ortamda düzenlenmiştir.</p>
          <p>Araç Kiralama A.Ş. — arac-kiralama-two.vercel.app</p>
        </div>
      </div>
    </>
  );
}
