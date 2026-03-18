import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 to `end` over `duration` ms using an ease-out cubic curve.
 * Only starts once `trigger` becomes true (default: true).
 */
export function useCountUp(end: number, duration = 1100, trigger = true): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger || isNaN(end) || end <= 0) {
      setCount(end);
      return;
    }

    startTimeRef.current = null;

    const animate = (ts: number) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const elapsed  = ts - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, duration, trigger]);

  return count;
}
