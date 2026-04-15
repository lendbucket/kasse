"use client";

import { useState, useEffect } from "react";

export default function DashboardClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Chicago",
    }));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);
  return <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{time}</p>;
}
