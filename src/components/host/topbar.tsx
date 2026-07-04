"use client";

import { usePathname } from "next/navigation";

import { activeNav } from "./sidebar";

/**
 * Topbar — the slim header above the content column. Shows a hamburger (mobile
 * only, to open the sidebar drawer), the active section title, and the couple
 * name. No search, no avatar (deliberately — see plan Scope Boundaries).
 */
export function Topbar({
  coupleName,
  onMenuClick,
}: {
  coupleName: string;
  onMenuClick: () => void;
}) {
  const pathname = usePathname();
  const title = activeNav(pathname)?.label ?? "Panel";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)]/85 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        aria-expanded={false}
        className="-ml-1 rounded-[var(--radius)] p-2 text-[var(--color-foreground)] hover:bg-[var(--color-muted)] lg:hidden"
      >
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="font-display text-lg tracking-tight text-[var(--color-foreground)]">
        {title}
      </h1>
      <span className="ml-auto truncate text-sm text-[var(--color-muted-foreground)]">
        {coupleName}
      </span>
    </header>
  );
}
