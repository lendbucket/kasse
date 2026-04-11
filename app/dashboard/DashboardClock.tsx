"use client";

import { useEffect, useState } from "react";

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Chicago",
});

const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: "America/Chicago",
});

export function DashboardClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col sm:items-end">
      <p className="text-xs uppercase tracking-wider text-[#606e74]">
        {now ? DATE_FMT.format(now) : "\u00a0"}
      </p>
      <p className="font-mono text-xl font-semibold tabular-nums text-white">
        {now ? `${TIME_FMT.format(now)} CST` : "--:--:-- CST"}
      </p>
    </div>
  );
}
