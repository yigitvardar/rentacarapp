import type {
  User,
  Vehicle,
  VehicleCategory,
  RentalPackage,
  Rental,
  Payment,
  TcVerification,
  Role,
  PolicyStatus,
  VehicleStatus,
  RentalStatus,
  PaymentStatus,
  FuelType,
  TransmissionType,
} from "@prisma/client";

// Prisma tiplerini yeniden export et (kolay import için)
export type {
  User,
  Vehicle,
  VehicleCategory,
  RentalPackage,
  Rental,
  Payment,
  TcVerification,
  Role,
  PolicyStatus,
  VehicleStatus,
  RentalStatus,
  PaymentStatus,
  FuelType,
  TransmissionType,
};

// Genişletilmiş tipler
export type VehicleWithCategory = Vehicle & {
  category: VehicleCategory;
};

export type RentalWithDetails = Rental & {
  user: Pick<User, "id" | "name" | "email">;
  vehicle: VehicleWithCategory;
  package: RentalPackage | null;
  payment: Payment | null;
};

export type PackageWithCategory = RentalPackage & {
  category: VehicleCategory | null;
};

// NextAuth oturum tipi genişletme
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}

// Sigorta API yanıt tipleri
export interface InsurancePolicyResponse {
  found: boolean;
  policyNumber?: string;
  policyStatus?: PolicyStatus;
  holderName?: string;
  startDate?: string;
  endDate?: string;
  coverageType?: string;
  coverageDetails?: PolicyCoverage;
}

export interface PolicyCoverage {
  vehicleCategories: string[]; // Uygun araç kategorileri
  maxDailyRate?: number;       // Maksimum günlük ücret
  maxDuration?: number;        // Maksimum kiralama süresi (gün)
  additionalBenefits?: string[];
}

// API yanıt wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form tipleri
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface TcVerificationFormData {
  tcNumber: string;
}
