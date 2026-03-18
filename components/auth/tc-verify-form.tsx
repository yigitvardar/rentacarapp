"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tcVerifyAction, type TcVerifyState } from "@/app/actions/tc-verify";
import { coverageTypeLabels } from "@/lib/insurance";
import { formatDate } from "@/lib/utils";

const initialState: TcVerifyState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" loading={pending}>
      {!pending && <Shield className="h-4 w-4" />}
      Poliçeyi Sorgula
    </Button>
  );
}

export function TcVerifyForm() {
  const router = useRouter();
  const [state, action] = useFormState(tcVerifyAction, initialState);
  const [tcValue, setTcValue] = useState("");

  useEffect(() => {
    if (state === initialState) return;

    if (!state.success) {
      if (state.message) toast.error(state.message);
      return;
    }

    if (state.policyStatus === "ACTIVE") {
      toast.success("Poliçe doğrulandı!", { description: state.message });
    } else if (state.policyStatus === "EXPIRED") {
      toast.warning("Poliçe süresi dolmuş", { description: state.message });
    } else {
      toast.info("Poliçe bulunamadı", { description: state.message });
    }
  }, [state]);

  return (
    <div className="space-y-6">
      {/* Form */}
      <form action={action} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="tcNumber">TC Kimlik Numarası</Label>
          <Input
            id="tcNumber"
            name="tcNumber"
            placeholder="00000000000"
            maxLength={11}
            inputMode="numeric"
            pattern="[0-9]*"
            value={tcValue}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              if (val.length <= 11) setTcValue(val);
            }}
            error={state.errors?.tcNumber?.[0]}
            className="text-lg tracking-widest font-mono"
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            TC numaranız şifreli olarak saklanır, üçüncü şahıslarla paylaşılmaz.
          </p>
        </div>
        <SubmitButton />
      </form>

      {/* Sonuç Kartı */}
      {state.success && state.policyStatus && (
        <div className="animate-fade-in">
          {/* AKTİF POLİÇE */}
          {state.policyStatus === "ACTIVE" && state.policyData && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">
                      Poliçe Doğrulandı
                    </p>
                    <p className="text-sm text-green-600">
                      {state.policyData.policyNumber}
                    </p>
                  </div>
                  <Badge variant="success" className="ml-auto">
                    Aktif
                  </Badge>
                </div>

                {/* Kapsam bilgileri */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-muted-foreground text-xs">Kapsam Tipi</p>
                    <p className="font-semibold">
                      {coverageTypeLabels[state.policyData.coverageType ?? ""] ??
                        state.policyData.coverageType}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-muted-foreground text-xs">Bitiş Tarihi</p>
                    <p className="font-semibold">
                      {state.policyData.endDate
                        ? formatDate(state.policyData.endDate)
                        : "-"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-muted-foreground text-xs">Max. Süre</p>
                    <p className="font-semibold">
                      {state.policyData.maxDuration} gün
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-muted-foreground text-xs">Max. Günlük</p>
                    <p className="font-semibold">
                      {state.policyData.maxDailyRate?.toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                </div>

                {/* Uygun kategoriler */}
                {state.policyData.categories && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Uygun Araç Kategorileri
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {state.policyData.categories.map((cat) => (
                        <Badge key={cat} variant="secondary">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avantajlar */}
                {state.policyData.benefits &&
                  state.policyData.benefits.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Dahil Güvenceler
                      </p>
                      <ul className="space-y-1">
                        {state.policyData.benefits.map((b) => (
                          <li
                            key={b}
                            className="flex items-center gap-2 text-sm text-green-700"
                          >
                            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Pakete git butonu */}
                <Button
                  className="w-full"
                  onClick={() => router.push("/packages")}
                >
                  Size Özel Paketleri Gör
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* SÜRESİ DOLMUŞ */}
          {state.policyStatus === "EXPIRED" && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-800">
                      Poliçe Süresi Dolmuş
                    </p>
                    <p className="text-sm text-orange-600">
                      {state.policyData?.policyNumber}
                    </p>
                  </div>
                  <Badge variant="warning" className="ml-auto">
                    Süresi Dolmuş
                  </Badge>
                </div>
                <p className="text-sm text-orange-700">{state.message}</p>
                <p className="text-xs text-muted-foreground">
                  Poliçenizi yeniledikten sonra tekrar sorgulayabilirsiniz.
                </p>
              </CardContent>
            </Card>
          )}

          {/* POLİÇE YOK */}
          {state.policyStatus === "NONE" && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">
                      Poliçe Bulunamadı
                    </p>
                  </div>
                </div>
                <p className="text-sm text-red-700">{state.message}</p>
                <p className="text-xs text-muted-foreground">
                  TC kimlik numaranızı kontrol edin veya sigorta şirketinizle
                  iletişime geçin.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
