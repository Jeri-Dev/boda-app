'use client'

import { useRef, useState, useTransition } from 'react'

import { setTablePosition } from '@/lib/actions/mesas'
import type { TableShape } from '@/lib/db/schema'

export type PlanTable = {
  id: string
  label: string
  capacity: number
  shape: TableShape
  posX: number | null
  posY: number | null
  used: number
}

const VIEW_W = 1000
const VIEW_H = 640

/** Grid auto-layout for tables that have never been placed. */
function autoPos(index: number): { x: number; y: number } {
  const cols = 4
  const gapX = 230
  const gapY = 190
  const startX = 140
  const startY = 110
  return {
    x: startX + (index % cols) * gapX,
    y: startY + Math.floor(index / cols) * gapY,
  }
}

export function FloorPlan({ tables }: { tables: PlanTable[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [, startTransition] = useTransition()

  // Local drag overrides only; the effective position is derived (override →
  // DB position → auto-layout) so tables created/removed after mount work too.
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({})

  const indexOf = new Map(tables.map((t, i) => [t.id, i]))
  const effectivePos = (t: PlanTable) =>
    pos[t.id] ??
    (t.posX != null && t.posY != null
      ? { x: t.posX, y: t.posY }
      : autoPos(indexOf.get(t.id) ?? 0))
  const byId = new Map(tables.map((t) => [t.id, t]))

  const drag = useRef<{ id: string; offX: number; offY: number } | null>(null)

  function toSvg(clientX: number, clientY: number): { x: number; y: number } | null {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  function onPointerDown(e: React.PointerEvent, id: string) {
    const p = toSvg(e.clientX, e.clientY)
    const t = byId.get(id)
    if (!p || !t) return
    const cur = effectivePos(t)
    drag.current = { id, offX: p.x - cur.x, offY: p.y - cur.y }
    // Capture on the <g> itself so every move/up routes back here reliably.
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    const p = toSvg(e.clientX, e.clientY)
    if (!p) return
    const x = Math.max(60, Math.min(VIEW_W - 60, p.x - d.offX))
    const y = Math.max(60, Math.min(VIEW_H - 60, p.y - d.offY))
    setPos((prev) => ({ ...prev, [d.id]: { x, y } }))
  }

  function onPointerUp() {
    const d = drag.current
    drag.current = null
    if (!d) return
    const t = byId.get(d.id)
    if (!t) return
    const { x, y } = effectivePos(t)
    startTransition(async () => {
      await setTablePosition(d.id, x, y)
    })
  }

  if (tables.length === 0) return null

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label="Plano de mesas"
      className="aspect-[1000/640] w-full touch-none rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-soft)]"
    >
      {/* subtle grid */}
      <defs>
        <pattern id="plan-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="0.5"
            opacity="0.5"
          />
        </pattern>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} fill="url(#plan-grid)" />

      {tables.map((t) => {
        const { x, y } = effectivePos(t)
        const over = t.used > t.capacity
        const stroke = over ? 'var(--color-destructive)' : 'var(--color-stone-400)'
        const fill = over ? 'var(--color-destructive)' : 'var(--color-sage)'
        return (
          <g
            key={t.id}
            transform={`translate(${x} ${y})`}
            className="cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={(e) => onPointerDown(e, t.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            role="button"
            aria-label={`Mesa ${t.label}, ${t.used} de ${t.capacity}. Arrastra para mover.`}
          >
            {t.shape === 'rect' ? (
              <rect
                x={-66}
                y={-40}
                width={132}
                height={80}
                rx={10}
                fill={fill}
                fillOpacity={0.18}
                stroke={stroke}
                strokeWidth={2}
              />
            ) : (
              <circle r={50} fill={fill} fillOpacity={0.18} stroke={stroke} strokeWidth={2} />
            )}
            <text
              textAnchor="middle"
              y={-2}
              className="fill-[var(--color-foreground)] font-display"
              style={{ fontSize: 17 }}
            >
              {t.label}
            </text>
            <text
              textAnchor="middle"
              y={18}
              className="fill-[var(--color-muted-foreground)]"
              style={{ fontSize: 13, fontWeight: over ? 700 : 400 }}
            >
              {t.used}/{t.capacity}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
