"use client";

import { useState, useEffect } from "react";

export default function DashboardClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "America/Chicago",
        })
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p
      style={{
        fontSize: 13,
        color: "#606E74",
        margin: "4px 0 0",
        letterSpacing: "-0.31px",
      }}
    >
      {time}
    </p>
  );
}
