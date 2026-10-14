"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tweens the returned number toward `target` (~650ms, cubic ease-out), like
 * the hero figure on the reference page. Skips the animation when the user
 * prefers reduced motion.
 */
export function useCountUp(target: number, duration = 650): number {
  const [display, setDisplay] = useState(target);
  const current = useRef(target);
  const raf = useRef(0);

  useEffect(() => {
    const from = current.current;
    if (from === target) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      raf.current = requestAnimationFrame(() => {
        current.current = target;
        setDisplay(target);
      });
      return () => cancelAnimationFrame(raf.current);
    }
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * eased;
      current.current = v;
      setDisplay(v);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else {
        current.current = target;
        setDisplay(target);
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return display;
}
