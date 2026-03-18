import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed başlıyor...");

  // Admin kullanıcısı
  const adminPassword = await bcrypt.hash("admin", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@rentacar.com" },
    update: { password: adminPassword, role: "ADMIN" },
    create: {
      name: "Yiğit Vardar",
      email: "admin@rentacar.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin:", admin.email);

  // Test kullanıcısı
  const userPassword = await bcrypt.hash("123Deneme", 12);
  const user = await prisma.user.upsert({
    where: { email: "deneme@deneme.com" },
    update: { password: userPassword },
    create: {
      name: "Deneme Kullanıcı",
      email: "deneme@deneme.com",
      password: userPassword,
      phone: "05001234567",
      role: "USER",
    },
  });
  console.log("Test kullanıcısı:", user.email);

  // Araç kategorileri
  const [ekonomik, ortaSinif, suv, luks] = await Promise.all([
    prisma.vehicleCategory.upsert({
      where: { name: "Ekonomik" },
      update: {},
      create: {
        name: "Ekonomik",
        description: "Şehir içi kullanım için ideal, yakıt tasarruflu araçlar",
      },
    }),
    prisma.vehicleCategory.upsert({
      where: { name: "Orta Sınıf" },
      update: {},
      create: {
        name: "Orta Sınıf",
        description: "Konfor ve ekonominin buluştuğu araçlar",
      },
    }),
    prisma.vehicleCategory.upsert({
      where: { name: "SUV" },
      update: {},
      create: {
        name: "SUV",
        description: "Her yola uygun, geniş ve güçlü SUV araçlar",
      },
    }),
    prisma.vehicleCategory.upsert({
      where: { name: "Lüks" },
      update: {},
      create: {
        name: "Lüks",
        description: "Premium konfor ve prestij için lüks araçlar",
      },
    }),
  ]);
  console.log("Kategoriler oluşturuldu.");

  // Araçlar
  const vehicleData = [
    // Ekonomik
    {
      plate: "34 ABC 001", categoryId: ekonomik.id,
      brand: "Renault", model: "Clio", year: 2023,
      fuelType: "GASOLINE" as const, transmission: "MANUAL" as const,
      dailyRate: 800, seats: 5,
      features: { ac: true, bluetooth: true, usb: true },
    },
    {
      plate: "34 ABC 002", categoryId: ekonomik.id,
      brand: "Fiat", model: "Egea", year: 2023,
      fuelType: "GASOLINE" as const, transmission: "MANUAL" as const,
      dailyRate: 750, seats: 5,
      features: { ac: true, bluetooth: true },
    },
    {
      plate: "34 ABC 003", categoryId: ekonomik.id,
      brand: "Volkswagen", model: "Polo", year: 2024,
      fuelType: "GASOLINE" as const, transmission: "AUTOMATIC" as const,
      dailyRate: 900, seats: 5,
      features: { ac: true, bluetooth: true, usb: true, parking_sensor: true },
    },
    // Orta Sınıf
    {
      plate: "34 DEF 001", categoryId: ortaSinif.id,
      brand: "Toyota", model: "Corolla", year: 2024,
      fuelType: "HYBRID" as const, transmission: "AUTOMATIC" as const,
      dailyRate: 1200, seats: 5,
      features: { ac: true, navigation: true, bluetooth: true, parking_sensor: true },
    },
    {
      plate: "34 DEF 002", categoryId: ortaSinif.id,
      brand: "Volkswagen", model: "Passat", year: 2023,
      fuelType: "DIESEL" as const, transmission: "AUTOMATIC" as const,
      dailyRate: 1400, seats: 5,
      features: { ac: true, navigation: true, bluetooth: true, cruise_control: true },
    },
    {
      plate: "34 DEF 003", categoryId: ortaSinif.id,
      brand: "Honda", model: "Civic", year: 2024,
      fuelType: "GASOLINE" as const, transmission: "AUTOMATIC" as const,
      dailyRate: 1300, seats: 5,
      features: { ac: true, bluetooth: true, usb: true, lane_assist: true },
    },
    // SUV
    {
      plate: "34 GHI 001", categoryId: suv.id,
      brand: "Hyundai", model: "Tucson", year: 2024,
      fuelType: "DIESEL" as const, transmission: "AUTOMATIC" as const,
      dailyRate: 1800, seats: 5,
      features: { ac: true, navigation: true, sunroof: true, blind_spot: true },
    },
    {
      plate: "34 GHI 002", categoryId: suv.id,
      brand: "Toyota", model: "RAV4", year: 2024,
      fuelType: "HYBRID" as const, transmission: "AUTOMATIC" as const,
      dailyRate: 2000, seats: 5,
      features: { ac: true, navigation: true, awd: true, parking_sensor: true, blind_spot: true },
    },
    {
      plate: "34 GHI 003", categoryId: suv.id,
      brand: "Ford", model: "Kuga", year: 2023,
      fuelType: "HYBRID" as const, transmission: "AUTOMATIC" as const,
      dailyRate: 1900, seats: 5,
      features: { ac: true, navigation: true, sunroof: true, cruise_control: true },
    },
    // Lüks
    {
      plate: "34 JKL 001", categoryId: luks.id,
      brand: "Mercedes-Benz", model: "E 200", year: 2024,
      fuelType: "GASOLINE" as const, transmission: "AUTOMATIC" as const,
      dailyRate: 3500, seats: 5,
      features: { ac: true, navigation: true, leather: true, sunroof: true, massage: true },
    },
    {
      plate: "34 JKL 002", categoryId: luks.id,
      brand: "BMW", model: "5 Serisi", year: 2024,
      fuelType: "GASOLINE" as const, transmission: "AUTOMATIC" as const,
      dailyRate: 3800, seats: 5,
      features: { ac: true, navigation: true, leather: true, sunroof: true, harman_kardon: true },
    },
    {
      plate: "34 JKL 003", categoryId: luks.id,
      brand: "Audi", model: "A6", year: 2023,
      fuelType: "DIESEL" as const, transmission: "AUTOMATIC" as const,
      dailyRate: 3600, seats: 5,
      features: { ac: true, navigation: true, leather: true, adaptive_cruise: true, matrix_led: true },
    },
  ];

  for (const v of vehicleData) {
    await prisma.vehicle.upsert({
      where: { plate: v.plate },
      update: {},
      create: { ...v, status: "AVAILABLE" },
    });
  }
  console.log(`${vehicleData.length} araç oluşturuldu.`);

  // Mevcut paketleri temizle ve yeniden oluştur
  await prisma.rentalPackage.deleteMany({});

  const packageData = [
    // Ekonomik
    {
      categoryId: ekonomik.id,
      name: "Ekonomik — 3 Günlük",
      description: "Kısa süreli şehir içi seyahat için ideal",
      durationDays: 3, basePrice: 2400, discountRate: 5, finalPrice: 2280,
      includedKm: 600, extraKmRate: 2.5,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "BASIC" },
    },
    {
      categoryId: ekonomik.id,
      name: "Ekonomik — 7 Günlük",
      description: "Ekonomik araçlar için haftalık avantajlı paket",
      durationDays: 7, basePrice: 5600, discountRate: 15, finalPrice: 4760,
      includedKm: 1500, extraKmRate: 2.0,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "BASIC" },
    },
    {
      categoryId: ekonomik.id,
      name: "Ekonomik — 14 Günlük",
      description: "Uzun süre ekonomik araç kiralayanlara özel",
      durationDays: 14, basePrice: 11200, discountRate: 20, finalPrice: 8960,
      includedKm: 3500, extraKmRate: 1.8,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "BASIC" },
    },
    // Orta Sınıf
    {
      categoryId: ortaSinif.id,
      name: "Konfor — 3 Günlük",
      description: "Rahat bir hafta sonu için orta sınıf araç",
      durationDays: 3, basePrice: 3600, discountRate: 0, finalPrice: 3600,
      includedKm: 600, extraKmRate: 3.0,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "COMPREHENSIVE" },
    },
    {
      categoryId: ortaSinif.id,
      name: "Konfor — 7 Günlük",
      description: "Orta sınıf araçlar için haftalık konfor paketi",
      durationDays: 7, basePrice: 8400, discountRate: 10, finalPrice: 7560,
      includedKm: 2000, extraKmRate: 2.5,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "COMPREHENSIVE" },
    },
    {
      categoryId: ortaSinif.id,
      name: "Konfor — 30 Günlük",
      description: "Aylık konfor paketi, maksimum tasarruf",
      durationDays: 30, basePrice: 36000, discountRate: 25, finalPrice: 27000,
      includedKm: 8000, extraKmRate: 2.0,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "COMPREHENSIVE" },
    },
    // SUV
    {
      categoryId: suv.id,
      name: "SUV — 3 Günlük",
      description: "Kısa tatil ve doğa gezileri için SUV",
      durationDays: 3, basePrice: 5400, discountRate: 0, finalPrice: 5400,
      includedKm: 600, extraKmRate: 3.5,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "COMPREHENSIVE" },
    },
    {
      categoryId: suv.id,
      name: "SUV — 7 Günlük",
      description: "Haftalık SUV deneyimi",
      durationDays: 7, basePrice: 12600, discountRate: 10, finalPrice: 11340,
      includedKm: 2000, extraKmRate: 3.0,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "PREMIUM" },
    },
    {
      categoryId: suv.id,
      name: "SUV Premium — 30 Günlük",
      description: "SUV araçlar için 30 günlük premium paket",
      durationDays: 30, basePrice: 54000, discountRate: 20, finalPrice: 43200,
      includedKm: 6000, extraKmRate: 3.0,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "PREMIUM" },
    },
    // Lüks
    {
      categoryId: luks.id,
      name: "Lüks — 3 Günlük",
      description: "Özel günler için premium araç deneyimi",
      durationDays: 3, basePrice: 10500, discountRate: 0, finalPrice: 10500,
      includedKm: 500, extraKmRate: 5.0,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "PREMIUM" },
    },
    {
      categoryId: luks.id,
      name: "Lüks — 7 Günlük",
      description: "Lüks araçlar için haftalık prestij paketi",
      durationDays: 7, basePrice: 24500, discountRate: 10, finalPrice: 22050,
      includedKm: 1500, extraKmRate: 4.5,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "PREMIUM" },
    },
    {
      categoryId: luks.id,
      name: "Lüks — 14 Günlük",
      description: "Uzun konaklamalar için lüks araç konforu",
      durationDays: 14, basePrice: 49000, discountRate: 15, finalPrice: 41650,
      includedKm: 3000, extraKmRate: 4.0,
      policyTypes: ["ACTIVE"],
      insuranceCoverage: { minCoverage: "PREMIUM" },
    },
  ];

  await prisma.rentalPackage.createMany({ data: packageData });
  console.log(`${packageData.length} paket oluşturuldu.`);

  console.log("\n✅ Seed tamamlandı!");
  console.log("Admin  : admin@rentacar.com / admin");
  console.log("Test   : deneme@deneme.com / 123Deneme");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
