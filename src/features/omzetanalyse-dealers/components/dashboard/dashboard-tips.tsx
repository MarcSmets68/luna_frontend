"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type TipState = { lines: string[]; x: number; y: number } | null;

const TipContext = createContext<{
  show: (lines: string[], x: number, y: number) => void;
  move: (x: number, y: number) => void;
  hide: () => void;
}>({ show: () => {}, move: () => {}, hide: () => {} });

/**
 * Lightweight tooltip that follows the pointer (like the reference page):
 * fixed-position panel, offset below-right, flipped near the viewport edges.
 * Mount DashboardTips once around the dashboard; bind handlers via useDashTip.
 */
export function DashboardTips({ children }: { children: React.ReactNode }) {
  const [tip, setTip] = useState<TipState>(null);
  const ref = useRef<HTMLDivElement>(null);

  const place = useCallback((x: number, y: number) => {
    setTip((t) => (t ? { ...t, x, y } : t));
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = 12;
    let nx = x + p;
    let ny = y + p;
    if (nx + r.width > window.innerWidth - 8) nx = x - r.width - p;
    if (ny + r.height > window.innerHeight - 8) ny = y - r.height - p;
    el.style.transform = `translate(${Math.max(8, nx)}px,${Math.max(8, ny)}px)`;
  }, []);

  const api = useMemo(
    () => ({
      show: (lines: string[], x: number, y: number) => {
        setTip({ lines, x, y });
        // position on the next frame once the box is measured
        requestAnimationFrame(() => place(x, y));
      },
      move: place,
      hide: () => setTip(null),
    }),
    [place]
  );

  return (
    <TipContext.Provider value={api}>
      {children}
      <div
        ref={ref}
        role="tooltip"
        hidden={!tip}
        className="pointer-events-none fixed top-0 left-0 z-[70] max-w-72 border border-border bg-foreground px-2.5 py-1.5 text-[12.5px] leading-snug text-background shadow-lg"
      >
        {tip?.lines.map((l, i) => (
          <div key={i} className={i === 0 ? "font-semibold" : undefined}>
            {l}
          </div>
        ))}
      </div>
    </TipContext.Provider>
  );
}

/**
 * Raw tooltip api - attach show/move/hide to elements in loops
 * (per-item hooks are impossible there). Pointer handlers should skip
 * touch pointers: `if (e.pointerType === "touch") return;`
 */
export function useTips() {
  return useContext(TipContext);
}
