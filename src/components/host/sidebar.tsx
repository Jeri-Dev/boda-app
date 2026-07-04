"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { site } from "@/lib/site";
import { cn } from "@/lib/utils/cn";
import {
  BudgetIcon,
  ConfigIcon,
  DayIcon,
  GuestsIcon,
  PanelIcon,
  TablesIcon,
  TasksIcon,
  VendorsIcon,
} from "./nav-icons";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Exact-match the pathname (only the root/Panel link). */
  exact?: boolean;
};

/** Single source of truth for the back-office nav (post-unification: 8 items). */
export const NAV: NavItem[] = [
  { href: "/", label: "Panel", Icon: PanelIcon, exact: true },
  { href: "/invitados", label: "Invitados", Icon: GuestsIcon },
  { href: "/proveedores", label: "Proveedores", Icon: VendorsIcon },
  { href: "/presupuesto", label: "Presupuesto", Icon: BudgetIcon },
  { href: "/tareas", label: "Tareas", Icon: TasksIcon },
  { href: "/mesas", label: "Mesas", Icon: TablesIcon },
  { href: "/dia-b", label: "Día B", Icon: DayIcon },
  { href: "/configuracion", label: "Configuración", Icon: ConfigIcon },
];

/** Resolve the active nav item for a pathname (prefix-match, exact for root). */
export function activeNav(pathname: string): NavItem | undefined {
  return NAV.find((n) =>
    n.exact
      ? pathname === n.href
      : pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
}

/**
 * SidebarPanel — the sidebar contents (brand + nav), shared by the fixed
 * desktop rail and the mobile drawer. `onNavigate` lets the drawer close on
 * link click.
 */
export function SidebarPanel({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[var(--color-sidebar)]">
      <div className="flex h-14 items-center px-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="font-display text-lg tracking-tight text-[var(--color-foreground)]"
        >
          {site.name}
        </Link>
      </div>
      <nav aria-label="Módulos" className="flex flex-1 flex-col gap-0.5 px-3 py-2">
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 whitespace-nowrap rounded-[var(--radius)] px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[var(--color-sidebar-accent)] font-medium text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-sidebar-accent)] hover:text-[var(--color-foreground)]",
              )}
            >
              <Icon
                className={cn(
                  "shrink-0",
                  active
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-muted-foreground)]",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
