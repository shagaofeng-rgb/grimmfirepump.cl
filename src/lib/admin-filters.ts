export type DatePreset = "all" | "today" | "week" | "month" | "custom";
export type DateFilter = { preset: DatePreset; from?: string; to?: string; timeZone: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_TIME_ZONE = "America/Santiago";

function partsAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

function zonedMidnight(year: number, month: number, day: number, timeZone: string) {
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const local = partsAt(new Date(utcGuess), timeZone);
  const localAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  return new Date(utcGuess - (localAsUtc - utcGuess));
}

function dateFromParts(parts: { year: number; month: number; day: number }) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function nextDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function startOfWeek(parts: { year: number; month: number; day: number }) {
  const value = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
}

export function parseDateFilter(params: URLSearchParams, now = new Date()): DateFilter {
  const preset = (params.get("preset") || "all") as DatePreset;
  const timeZone = params.get("tz") === DEFAULT_TIME_ZONE ? DEFAULT_TIME_ZONE : DEFAULT_TIME_ZONE;
  if (!(["all", "today", "week", "month", "custom"] as const).includes(preset)) return { preset: "all", timeZone };
  const local = partsAt(now, timeZone);
  const today = dateFromParts(local);
  if (preset === "all") return { preset, timeZone };
  if (preset === "today") return { preset, from: today, to: nextDate(today), timeZone };
  if (preset === "week") return { preset, from: dateFromParts(startOfWeek(local)), to: nextDate(today), timeZone };
  if (preset === "month") return { preset, from: `${local.year}-${String(local.month).padStart(2, "0")}-01`, to: nextDate(today), timeZone };
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  if (!DATE.test(from) || !DATE.test(to) || from > to) return { preset: "all", timeZone };
  return { preset, from, to: nextDate(to), timeZone };
}

/** Date strings are converted at the server boundary so all lists share Chile calendar dates. */
export function dateSql(filter: DateFilter, column: string) {
  if (!filter.from || !filter.to) return { sql: "", args: [] as string[] };
  const [fromYear, fromMonth, fromDay] = filter.from.split("-").map(Number);
  const [toYear, toMonth, toDay] = filter.to.split("-").map(Number);
  return {
    sql: ` AND ${column}>=? AND ${column}<?`,
    args: [zonedMidnight(fromYear, fromMonth, fromDay, filter.timeZone).toISOString(), zonedMidnight(toYear, toMonth, toDay, filter.timeZone).toISOString()],
  };
}

/** Use this for YYYY-MM-DD columns such as daily SEO aggregates. */
export function daySql(filter: DateFilter, column: string) {
  if (!filter.from || !filter.to) return { sql: "", args: [] as string[] };
  return { sql: ` AND ${column}>=? AND ${column}<?`, args: [filter.from, filter.to] };
}
