import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative">
          <p className="text-8xl font-black text-gray-100 select-none">404</p>
          <Search className="h-12 w-12 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Sayfa Bulunamadı</h1>
          <p className="text-muted-foreground mt-2">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard"><Home className="h-4 w-4" /> Ana Sayfa</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/packages">Paketleri Gör</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
