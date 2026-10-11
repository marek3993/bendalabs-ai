export const LEADPILOT_TIME_ZONE = "Europe/Bratislava";
export const LEADPILOT_TIMES = ["06:00", "13:30"] as const;

const localClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: LEADPILOT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
function clock(now: Date) {
  const parts = Object.fromEntries(localClock.formatToParts(now).map(part => [part.type, part.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

// Manual clicks share one of the two daily slots; they cannot create extra paid cycles.
export function scoutRunKey(now = new Date()) {
  const { day, minutes } = clock(now);
  return `${day}@${minutes < 810 ? LEADPILOT_TIMES[0] : LEADPILOT_TIMES[1]}`;
}
export function scoutDayKey(now = new Date()) { return clock(now).day; }

// UTC triggers cover both offsets. Only the correct local time can start paid work.
// A 15-minute window tolerates transient scheduler delay, not hour-late Hobby delivery.
export function isScheduledScoutTime(now = new Date()) {
  const { minutes } = clock(now);
  return (minutes >= 360 && minutes < 375) || (minutes >= 810 && minutes < 825);
}
export function scoutScheduleConfigured() {
  return process.env.LEADPILOT_SCHEDULE_ENABLED === "true" && Boolean(process.env.CRON_SECRET?.trim());
}
