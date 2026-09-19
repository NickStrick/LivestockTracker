"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleHalfStroke, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

type Pref = "system" | "light" | "dark";
const ORDER: Pref[] = ["system", "light", "dark"];
const ICON = { system: faCircleHalfStroke, light: faSun, dark: faMoon };

function apply(pref: Pref) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle({ className }: { className?: string }) {
  const [pref, setPref] = useState<Pref>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Pref | null) ?? "system";
    setPref(saved);
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => (localStorage.getItem("theme") ?? "system") === "system" && apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const next = () => {
    const n = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    setPref(n);
    localStorage.setItem("theme", n);
    apply(n);
  };

  return (
    <button
      onClick={next}
      aria-label={`Theme: ${pref}. Click to change.`}
      title={`Theme: ${pref}`}
      className={className ?? "grid size-10 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:text-fg active:scale-95"}
    >
      <FontAwesomeIcon icon={ICON[pref]} />
    </button>
  );
}
