import clsx from "clsx";

/** Button class names. Kept out of ui.tsx (a client module) so server components can read them directly. */
const BTN = "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50";
export const btn = {
  primary: clsx(BTN, "bg-primary text-primary-fg hover:opacity-90"),
  ghost: clsx(BTN, "border border-line bg-surface hover:bg-surface2"),
};
