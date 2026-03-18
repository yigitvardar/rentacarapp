"use client";

import { useState, useMemo } from "react";
import { PackageCard } from "./package-card";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Package } from "lucide-react";
import type { PackageWithCategory } from "@/types";

interface Props {
  packages: PackageWithCategory[];
  categories: string[];
}

export function PackageFilter({ packages, categories }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"price" | "duration" | "discount">("price");

  const filtered = useMemo(() => {
    let list = packages.filter((pkg) => {
      const matchSearch =
        !search ||
        pkg.name.toLowerCase().includes(search.toLowerCase()) ||
        pkg.category?.name.toLowerCase().includes(search.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === "all" ||
        (pkg.category?.name ?? "") === selectedCategory;
      return matchSearch && matchCategory;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "price") return Number(a.finalPrice) - Number(b.finalPrice);
      if (sortBy === "duration") return a.durationDays - b.durationDays;
      if (sortBy === "discount") return Number(b.discountRate) - Number(a.discountRate);
      return 0;
    });

    return list;
  }, [packages, search, selectedCategory, sortBy]);

  return (
    <div className="space-y-6">
      {/* Filtre Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Paket ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white min-w-[130px]"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border rounded-md px-3 py-2 text-sm bg-white min-w-[130px]"
          >
            <option value="price">Fiyat (Artan)</option>
            <option value="duration">Süre (Artan)</option>
            <option value="discount">İndirim (Azalan)</option>
          </select>
        </div>
      </div>

      {/* Sonuç sayısı */}
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span> paket listeleniyor
      </p>

      {/* Paketler */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">Sonuç bulunamadı</p>
            <p className="text-sm text-muted-foreground mt-1">Filtrelerinizi değiştirmeyi deneyin.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((pkg, i) => (
            <PackageCard key={pkg.id} pkg={pkg} featured={i === 1 && filtered.length >= 3} />
          ))}
        </div>
      )}
    </div>
  );
}
