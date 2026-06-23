import type { Metadata } from "next";

import { site } from "@/lib/site";

/**
 * Back-office dashboard (R17) — the app's root `/`.
 *
 * Fase 0 ships a placeholder so the gate (U0.3) and PWA `start_url` (U0.4)
 * have a real landing page. The aggregated metrics (presupuesto, % confirmados,
 * sin sentar, pagos/tareas próximas) land in U1.5 once the private core exists.
 */
export const metadata: Metadata = {
  title: "Panel",
};

const MODULES = [
  { name: "Invitados", note: "Fase 1" },
  { name: "Presupuesto", note: "Fase 1" },
  { name: "Proveedores", note: "Fase 1" },
  { name: "Tareas", note: "Fase 1" },
  { name: "Invitación y RSVP", note: "Fase 2" },
  { name: "Mesas y plano", note: "Fase 3" },
] as const;

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-[var(--color-muted-foreground)]">
          {site.name}
        </p>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-[var(--color-foreground)]">
          Panel de la boda
        </h1>
        <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
          Cimientos listos. Los módulos de gestión se habilitan por fases.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <li
            key={m.name}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4 shadow-[var(--shadow-soft)]"
          >
            <span className="block font-display text-lg text-[var(--color-foreground)]">
              {m.name}
            </span>
            <span className="mt-1 inline-block rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {m.note}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
