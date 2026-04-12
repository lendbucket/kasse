"use client";

import { useEffect, useState } from "react";

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Chicago",
});

export function DashboardClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="text-[13px] text-[#606e74]">
      {now ? `${DATE_FMT.format(now)} CST` : "\u00a0"}
    </p>
  );
}
