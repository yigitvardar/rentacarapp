"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";

export async function cancelRentalAction(rentalId: string): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Oturum açmanız gerekiyor" };
  }

  const rental = await db.rental.findUnique({
    where: { id: rentalId, userId: session.user.id },
  });

  if (!rental) {
    return { success: false, message: "Kiralama bulunamadı" };
  }

  if (!["PENDING", "CONFIRMED"].includes(rental.status)) {
    return { success: false, message: "Sadece onay bekleyen kiralamalar iptal edilebilir" };
  }

  await db.rental.update({
    where: { id: rentalId },
    data: { status: "CANCELLED" },
  });

  // Aracı tekrar müsait yap
  await db.vehicle.update({
    where: { id: rental.vehicleId },
    data: { status: "AVAILABLE" },
  });

  revalidatePath("/dashboard");
  return { success: true, message: "Kiralama iptal edildi" };
}

export async function reportIssueAction(
  rentalId: string,
  subject: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: "Oturum açmanız gerekiyor" };

  const rental = await db.rental.findUnique({
    where: { id: rentalId, userId: session.user.id },
    include: { vehicle: true, user: true },
  });

  if (!rental) return { success: false, message: "Kiralama bulunamadı" };
  if (rental.status !== "ACTIVE") return { success: false, message: "Sadece aktif kiralamalar için bildirim yapılabilir" };
  if (!subject.trim() || !message.trim()) return { success: false, message: "Konu ve mesaj alanları zorunludur" };

  // DB'ye kaydet
  await db.issueReport.create({
    data: { rentalId, userId: session.user.id, subject, message },
  });

  try {
    const adminUser = await db.user.findFirst({ where: { role: "ADMIN" } });
    if (adminUser?.email) {
      await sendEmail({
        to: adminUser.email,
        subject: `⚠️ Sorun Bildirimi: ${subject}`,
        html: `
          <h2>Kiralama Sorun Bildirimi</h2>
          <p><strong>Kullanıcı:</strong> ${rental.user.name} (${rental.user.email})</p>
          <p><strong>Araç:</strong> ${rental.vehicle.brand} ${rental.vehicle.model} — ${rental.vehicle.plate}</p>
          <p><strong>Kiralama ID:</strong> ${rentalId.slice(-8).toUpperCase()}</p>
          <p><strong>Kiralama Tarihleri:</strong> ${rental.startDate.toLocaleDateString("tr-TR")} – ${rental.endDate.toLocaleDateString("tr-TR")}</p>
          <hr/>
          <p><strong>Konu:</strong> ${subject}</p>
          <p><strong>Mesaj:</strong></p>
          <p style="background:#f5f5f5;padding:12px;border-radius:6px;">${message.replace(/\n/g, "<br/>")}</p>
        `,
      });
    }
    return { success: true, message: "Bildiriminiz admin'e iletildi. En kısa sürede dönüş yapılacaktır." };
  } catch {
    return { success: false, message: "Bildirim gönderilemedi, lütfen tekrar deneyin." };
  }
}

