"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("kasse-theme");
    if (saved === "light") {
      document.documentElement.classList.add("light");
      setLight(true);
    }
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    if (next) {
      document.documentElement.classList.add("light");
      localStorage.setItem("kasse-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("kasse-theme", "dark");
    }
  }

  return (
    <button
      onClick={toggle}
      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 ${className}`}
      title={light ? "Switch to dark mode" : "Switch to light mode"}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
    >
      {light ? (
        <Moon size={16} strokeWidth={1.5} />
      ) : (
        <Sun size={16} strokeWidth={1.5} />
      )}
    </button>
  );
}
