import nodemailer from "nodemailer";
import { formatCurrency, formatDate } from "./utils";

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const transporter = createTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({ from: `Araç Kiralama <${process.env.SMTP_USER}>`, to, subject, html });
  } catch (err) {
    console.error("E-posta gönderilemedi:", err);
  }
}

export async function sendPaymentConfirmationEmail(data: {
  to: string;
  userName: string;
  rentalId: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalPrice: number;
  paymentId?: string;
}) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP_USER veya SMTP_PASS tanımlı değil, e-posta atlandı");
    return;
  }

  const from = `Araç Kiralama <${process.env.SMTP_USER}>`;

  try {
    await transporter.sendMail({
      from,
      to: data.to,
      subject: "Rezervasyonunuz Alındı — Araç Kiralama",
      html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

    <div style="background: #16a34a; padding: 32px; text-align: center;">
      <span style="font-size: 40px;">✅</span>
      <h1 style="color: white; margin: 12px 0 0; font-size: 22px; font-weight: 700;">Ödeme Başarılı!</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Rezervasyonunuz alındı, onay bekleniyor</p>
    </div>

    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 15px; margin: 0 0 24px;">
        Merhaba <strong>${data.userName}</strong>, ödemeniz başarıyla alındı. Rezervasyonunuz admin onayından sonra aktif hale gelecektir.
      </p>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #15803d; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px;">Rezervasyon Detayları</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="color:#6b7280;padding:6px 0;">Rezervasyon No</td><td style="color:#111827;font-weight:600;text-align:right;font-family:monospace;">${data.rentalId.slice(-8).toUpperCase()}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0;">Araç</td><td style="color:#111827;font-weight:600;text-align:right;">${data.vehicleBrand} ${data.vehicleModel}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0;">Plaka</td><td style="color:#111827;font-weight:600;text-align:right;font-family:monospace;">${data.vehiclePlate}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0;">Başlangıç</td><td style="color:#111827;font-weight:600;text-align:right;">${formatDate(data.startDate)}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0;">Bitiş</td><td style="color:#111827;font-weight:600;text-align:right;">${formatDate(data.endDate)}</td></tr>
          <tr><td style="color:#6b7280;padding:6px 0;">Süre</td><td style="color:#111827;font-weight:600;text-align:right;">${data.totalDays} gün</td></tr>
          <tr style="border-top:1px solid #bbf7d0;">
            <td style="color:#15803d;padding:10px 0 6px;font-weight:600;">Ödenen Tutar</td>
            <td style="color:#15803d;font-weight:700;text-align:right;font-size:16px;">${formatCurrency(data.totalPrice)}</td>
          </tr>
        </table>
      </div>

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;font-size:13px;color:#1d4ed8;">
        <p style="margin:0 0 8px;font-weight:600;">📋 Teslim için gerekli belgeler:</p>
        <ul style="margin:0;padding-left:16px;line-height:1.8;">
          <li>TC Kimlik Belgesi</li>
          <li>Sürücü Belgesi</li>
          <li>Bu onay e-postası</li>
        </ul>
      </div>

      ${data.paymentId ? `<p style="color:#9ca3af;font-size:11px;margin:16px 0 0;">İyzico Ödeme ID: ${data.paymentId}</p>` : ""}
    </div>

    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Araç Kiralama — Sigorta Destekli Hizmet</p>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (err) {
    console.error("E-posta gönderilemedi:", err);
  }
}
