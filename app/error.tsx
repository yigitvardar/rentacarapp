"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative">
          <p className="text-8xl font-black text-gray-100 select-none">Hata</p>
          <AlertTriangle className="h-12 w-12 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bir Şeyler Ters Gitti</h1>
          <p className="text-muted-foreground mt-2">
            Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">Hata kodu: {error.digest}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" /> Tekrar Dene
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard"><Home className="h-4 w-4" /> Ana Sayfa</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
