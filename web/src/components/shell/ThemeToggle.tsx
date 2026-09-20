"use client";

import { useEffect, useSyncExternalStore } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleHalfStroke, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "@/lib/i18n/client";

type Pref = "system" | "light" | "dark";
const ORDER: Pref[] = ["system", "light", "dark"];
const ICON = { system: faCircleHalfStroke, light: faSun, dark: faMoon };

const listeners = new Set<() => void>();
const readPref = (): Pref => {
  try {
    const v = localStorage.getItem("theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};

function apply(pref: Pref) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const pref = useSyncExternalStore(subscribe, readPref, () => "system" as Pref);

  // Follow OS changes while the preference is "system".
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => readPref() === "system" && apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const next = () => {
    const n = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    try {
      localStorage.setItem("theme", n);
    } catch {
      /* storage unavailable: theme applies for this page view only */
    }
    apply(n);
    listeners.forEach((l) => l());
  };

  return (
    <button
      onClick={next}
      aria-label={t("Theme: {mode}. Click to change.", { mode: t(pref) })}
      title={t("Theme: {mode}", { mode: t(pref) })}
      className={className ?? "grid size-10 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:text-fg active:scale-95"}
    >
      <FontAwesomeIcon icon={ICON[pref]} />
    </button>
  );
}
