"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reportIssueAction } from "@/app/actions/rental";
import { toast } from "sonner";

interface ReportIssueDialogProps {
  rentalId: string;
  vehicleLabel: string;
}

export function ReportIssueDialog({ rentalId, vehicleLabel }: ReportIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await reportIssueAction(rentalId, subject, message);
    setLoading(false);
    if (result.success) {
      toast.success(result.message);
      setOpen(false);
      setSubject("");
      setMessage("");
    } else {
      toast.error(result.message);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
        onClick={() => setOpen(true)}
      >
        <AlertTriangle className="h-3 w-3" />
        Sorun Bildir
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Sorun Bildir
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{vehicleLabel}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="issue-subject">Konu</Label>
                <Input
                  id="issue-subject"
                  placeholder="Örn: Lastik patladı, Klima çalışmıyor..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="issue-message">Açıklama</Label>
                <textarea
                  id="issue-message"
                  rows={4}
                  placeholder="Yaşadığınız sorunu detaylı açıklayın..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  disabled={loading || !subject.trim() || !message.trim()}
                  loading={loading}
                >
                  {!loading && <AlertTriangle className="h-4 w-4" />}
                  {loading ? "Gönderiliyor..." : "Gönder"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
