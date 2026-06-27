const TZ = "America/Chicago";

function tzOffsetMinutes(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - date.getTime()) / 60_000;
}

export function chicagoDayBounds(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const noonUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const offset = tzOffsetMinutes(noonUTC);
  const startUTC = Date.UTC(y, m - 1, d, 0, 0, 0) - offset * 60_000;
  return {
    start: new Date(startUTC),
    end: new Date(startUTC + 24 * 3600_000),
  };
}

export function todayChicagoDateString(): string {
  const now = new Date();
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(now);
}

/** Today's date string (YYYY-MM-DD) in the given IANA timezone. */
export function todayDateStringInTz(timeZone: string): string {
  const now = new Date();
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(now);
}
