export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export function formatRemainingTime(nowMinutes: number, dayStartMinutes: number, dayEndMinutes: number) {
  if (nowMinutes < dayStartMinutes) {
    return { remaining: dayEndMinutes - dayStartMinutes, started: false, remainingStr: "" };
  }
  if (nowMinutes > dayEndMinutes) {
    return { remaining: 0, started: true, remainingStr: "" };
  }
  const remainingMinutes = dayEndMinutes - nowMinutes;
  const hoursRemaining = Math.floor(remainingMinutes / 60);
  const minsRemaining = remainingMinutes % 60;
  return {
    remaining: remainingMinutes,
    started: true,
    remainingStr: `${hoursRemaining}h ${minsRemaining}m`
  };
}

export function calculateTotalScheduledMinutes(tasks: any[]): number {
  return tasks.reduce((total, task) => {
    const start = parseTimeToMinutes(task.start);
    const end = parseTimeToMinutes(task.end);
    return total + (end - start);
  }, 0);
}

export function today(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function readLocation() {
  if (typeof window === "undefined") return { view: "today" as const, date: today() };
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get("view");
  return {
    view: (["today", "tasks", "progress"].includes(requestedView ?? "")
      ? requestedView
      : "today") as "today" | "tasks" | "progress",
    date: params.get("date") || today(),
  };
}
