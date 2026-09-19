"use client";

import { useWhatsNew } from "./WhatsNewProvider";

/** Unstyled trigger so marketing pages can open the release notes with their own look. */
export function WhatsNewLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open } = useWhatsNew();
  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
