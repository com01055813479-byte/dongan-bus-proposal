export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentTimeSlot(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes() < 30 ? "00" : "30";
  return `${h}:${m}`;
}

export function isWithinRange(timeStr: string, start: string, end: string): boolean {
  return timeStr >= start && timeStr < end;
}
