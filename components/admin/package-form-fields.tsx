"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Category { id: string; name: string; }

interface Defaults {
  name?: string; description?: string; categoryId?: string;
  durationDays?: number; basePrice?: number; discountRate?: number;
  includedKm?: number; isActive?: boolean;
}

export function PackageFormFields({ categories, defaults = {}, showActive }: { categories: Category[]; defaults?: Defaults; showActive?: boolean }) {
  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="pkg-name">Paket Adı *</Label>
        <Input id="pkg-name" name="name" defaultValue={defaults.name} placeholder="Ekonomik Haftalık Paket" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="pkg-desc">Açıklama</Label>
        <Input id="pkg-desc" name="description" defaultValue={defaults.description} placeholder="Kısa açıklama" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="pkg-cat">Kategori (boş = tümü)</Label>
        <select id="pkg-cat" name="categoryId" defaultValue={defaults.categoryId ?? ""} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
          <option value="">Tüm Kategoriler</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="pkg-days">Süre (Gün) *</Label>
          <Input id="pkg-days" name="durationDays" type="number" min={1} defaultValue={defaults.durationDays ?? 7} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pkg-km">Dahil KM</Label>
          <Input id="pkg-km" name="includedKm" type="number" min={0} defaultValue={defaults.includedKm} placeholder="Sınırsız için boş" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="pkg-price">Taban Fiyat (₺) *</Label>
          <Input id="pkg-price" name="basePrice" type="number" min={1} defaultValue={defaults.basePrice} placeholder="5000" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pkg-discount">İndirim (%)</Label>
          <Input id="pkg-discount" name="discountRate" type="number" min={0} max={100} defaultValue={defaults.discountRate ?? 0} />
        </div>
      </div>
      {showActive && (
        <div className="space-y-1">
          <Label htmlFor="pkg-active">Durum</Label>
          <select id="pkg-active" name="isActive" defaultValue={defaults.isActive ? "true" : "false"} className="w-full border rounded-md px-3 py-2 text-sm bg-white">
            <option value="true">Aktif</option>
            <option value="false">Pasif</option>
          </select>
        </div>
      )}
    </>
  );
}
