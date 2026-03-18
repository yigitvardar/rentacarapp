"use client";

interface BookedRange { start: string; end: string; }

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function isBooked(dateStr: string, ranges: BookedRange[]): boolean {
  return ranges.some((r) => dateStr >= r.start && dateStr <= r.end);
}

export function AvailabilityCalendar({ bookedRanges }: { bookedRanges: BookedRange[] }) {
  const today = new Date();
  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < 2; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const TR_DAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"];

  return (
    <div className="space-y-6">
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" /> Müsait</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" /> Dolu</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" /> Geçmiş</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {months.map(({ year, month }) => {
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);
          const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
          const days: (string | null)[] = [];
          for (let i = 0; i < startDow; i++) days.push(null);
          for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            days.push(dateStr);
          }

          const todayStr = today.toISOString().split("T")[0];

          return (
            <div key={`${year}-${month}`}>
              <p className="text-sm font-semibold mb-3">{TR_MONTHS[month]} {year}</p>
              <div className="grid grid-cols-7 gap-0.5 text-xs text-center">
                {TR_DAYS.map((d) => <div key={d} className="py-1 font-medium text-muted-foreground">{d}</div>)}
                {days.map((dateStr, i) => {
                  if (!dateStr) return <div key={`empty-${i}`} />;
                  const isPast = dateStr < todayStr;
                  const booked = isBooked(dateStr, bookedRanges);
                  const isToday = dateStr === todayStr;
                  return (
                    <div
                      key={dateStr}
                      title={booked ? "Dolu" : isPast ? "" : "Müsait"}
                      className={`py-1.5 rounded text-xs font-medium ${
                        isToday ? "ring-2 ring-primary ring-offset-1" : ""
                      } ${
                        isPast ? "text-gray-300 bg-gray-50"
                        : booked ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-700"
                      }`}
                    >
                      {new Date(dateStr).getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Dolu Tarihler:</p>
        {bookedRanges.map((r, i) => (
          <div key={i} className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            {new Date(r.start).toLocaleDateString("tr-TR")} — {new Date(r.end).toLocaleDateString("tr-TR")}
          </div>
        ))}
      </div>
    </div>
  );
}
