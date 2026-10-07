export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayString(): string {
  return formatDate(new Date());
}

export function getDayOfWeekName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getRecentDays(count: number, endDate: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}
