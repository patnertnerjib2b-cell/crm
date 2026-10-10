// Pomožne funkcije za tedenski obračun (teden: ponedeljek 00:00 -
// naslednji ponedeljek 00:00, torej ponedeljek-nedelja).

export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = nedelja, 1 = ponedeljek, ... 6 = sobota
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

export function endOfWeek(date: Date = new Date()): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 7); // ekskluzivno - naslednji ponedeljek 00:00
  return end;
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  return { start: startOfWeek(date), end: endOfWeek(date) };
}

export function addWeeks(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount * 7);
  return d;
}

export function formatDateSl(date: Date): string {
  return date.toLocaleDateString("sl-SI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatWeekLabel(start: Date, end: Date): string {
  const inclusiveEnd = new Date(end);
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
  return `${formatDateSl(start)} – ${formatDateSl(inclusiveEnd)}`;
}

export function isCurrentWeek(weekOffset: number): boolean {
  return weekOffset === 0;
}
