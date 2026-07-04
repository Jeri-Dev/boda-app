"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { SidebarPanel } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * Shell — the back-office dashboard frame. A fixed sidebar at ≥lg; an
 * off-canvas drawer below lg (opened from the topbar hamburger, closed on
 * route change / Escape / backdrop). The content column is offset by the
 * sidebar width at lg. Pages render their own <main> inside {children}.
 */
export function Shell({
  coupleName,
  children,
}: {
  coupleName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close the drawer whenever navigation completes.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes the drawer.
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="host-theme min-h-dvh bg-[var(--color-background)]">
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-[var(--color-border)]">
        <SidebarPanel />
      </aside>

      {/* Mobile off-canvas drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[oklch(0.22_0.02_340_/_0.5)]"
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-[var(--color-border)] shadow-[var(--shadow-warm)]">
            <SidebarPanel onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* Content column */}
      <div className="lg:pl-60">
        <Topbar coupleName={coupleName} onMenuClick={() => setOpen(true)} />
        {children}
      </div>
    </div>
  );
}
