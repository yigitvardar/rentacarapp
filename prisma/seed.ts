import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed başlıyor...");

  // Admin kullanıcısı oluştur
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@rental.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@rental.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin oluşturuldu:", admin.email);

  // Test kullanıcısı
  const userPassword = await bcrypt.hash("User123!", 12);
  const user = await prisma.user.upsert({
    where: { email: "test@rental.com" },
    update: {},
    create: {
      name: "Test Kullanıcı",
      email: "test@rental.com",
      password: userPassword,
      phone: "05001234567",
      role: "USER",
    },
  });
  console.log("Test kullanıcısı oluşturuldu:", user.email);

  // Araç kategorileri
  const categories = await Promise.all([
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
  console.log("Kategoriler oluşturuldu:", categories.map((c) => c.name));

  // Araçlar
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { plate: "34 ABC 001" },
      update: {},
      create: {
        categoryId: categories[0].id,
        brand: "Renault",
        model: "Clio",
        year: 2023,
        plate: "34 ABC 001",
        fuelType: "GASOLINE",
        transmission: "MANUAL",
        seats: 5,
        dailyRate: 800,
        status: "AVAILABLE",
        features: { ac: true, bluetooth: true, usb: true },
      },
    }),
    prisma.vehicle.upsert({
      where: { plate: "34 DEF 002" },
      update: {},
      create: {
        categoryId: categories[1].id,
        brand: "Toyota",
        model: "Corolla",
        year: 2024,
        plate: "34 DEF 002",
        fuelType: "HYBRID",
        transmission: "AUTOMATIC",
        seats: 5,
        dailyRate: 1200,
        status: "AVAILABLE",
        features: { ac: true, navigation: true, bluetooth: true, parking_sensor: true },
      },
    }),
    prisma.vehicle.upsert({
      where: { plate: "34 GHI 003" },
      update: {},
      create: {
        categoryId: categories[2].id,
        brand: "Hyundai",
        model: "Tucson",
        year: 2024,
        plate: "34 GHI 003",
        fuelType: "DIESEL",
        transmission: "AUTOMATIC",
        seats: 5,
        dailyRate: 1800,
        status: "AVAILABLE",
        features: { ac: true, navigation: true, sunroof: true, blind_spot: true },
      },
    }),
  ]);
  console.log("Araçlar oluşturuldu:", vehicles.map((v) => `${v.brand} ${v.model}`));

  // Kiralama paketleri
  const packages = await Promise.all([
    prisma.rentalPackage.create({
      data: {
        categoryId: categories[0].id,
        name: "Temel Paket - Ekonomik",
        description: "Ekonomik araçlar için günlük kiralama paketi",
        durationDays: 1,
        basePrice: 800,
        discountRate: 0,
        finalPrice: 800,
        includedKm: 300,
        extraKmRate: 2.5,
        policyTypes: ["ACTIVE"],
        insuranceCoverage: { minCoverage: "BASIC" },
      },
    }),
    prisma.rentalPackage.create({
      data: {
        categoryId: categories[0].id,
        name: "Haftalık Paket - Ekonomik",
        description: "Ekonomik araçlar için 7 günlük avantajlı paket",
        durationDays: 7,
        basePrice: 5600,
        discountRate: 15,
        finalPrice: 4760,
        includedKm: 1500,
        extraKmRate: 2.0,
        policyTypes: ["ACTIVE"],
        insuranceCoverage: { minCoverage: "BASIC" },
      },
    }),
    prisma.rentalPackage.create({
      data: {
        categoryId: categories[1].id,
        name: "Konfor Paketi - Orta Sınıf",
        description: "Orta sınıf araçlar için haftalık konfor paketi",
        durationDays: 7,
        basePrice: 8400,
        discountRate: 10,
        finalPrice: 7560,
        includedKm: 2000,
        extraKmRate: 2.5,
        policyTypes: ["ACTIVE"],
        insuranceCoverage: { minCoverage: "COMPREHENSIVE" },
      },
    }),
    prisma.rentalPackage.create({
      data: {
        categoryId: categories[2].id,
        name: "SUV Premium - Aylık",
        description: "SUV araçlar için 30 günlük premium paket",
        durationDays: 30,
        basePrice: 54000,
        discountRate: 20,
        finalPrice: 43200,
        includedKm: 6000,
        extraKmRate: 3.0,
        policyTypes: ["ACTIVE"],
        insuranceCoverage: { minCoverage: "PREMIUM" },
      },
    }),
  ]);
  console.log("Paketler oluşturuldu:", packages.map((p) => p.name));

  console.log("\nSeed tamamlandı!");
  console.log("Admin: admin@rental.com / Admin123!");
  console.log("Test: test@rental.com / User123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
