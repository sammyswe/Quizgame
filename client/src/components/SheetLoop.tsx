import { useEffect, useState, type CSSProperties } from "react";

/** Stepped CSS sheet loop — placeholder until denser video/keyframe packs land. */
export function SheetLoop({
  frameCount,
  fps = 6,
  className = "",
  styleForIndex,
  ariaHidden = true,
}: {
  frameCount: number;
  fps?: number;
  className?: string;
  styleForIndex: (index: number) => CSSProperties;
  ariaHidden?: boolean;
}) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (frameCount <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % frameCount);
    }, Math.max(40, Math.round(1000 / fps)));
    return () => window.clearInterval(id);
  }, [frameCount, fps]);
  return (
    <div
      className={className}
      style={styleForIndex(index)}
      aria-hidden={ariaHidden || undefined}
    />
  );
}
