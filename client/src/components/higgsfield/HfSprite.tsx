import type { CSSProperties } from "react";

/** One framed cell from a Higgsfield sprite sheet. */
export function HfSprite({
  frame,
  size,
  className = "",
  style,
  label,
}: {
  frame: CSSProperties;
  size: number | string;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block shrink-0 bg-center ${className}`}
      style={{
        width: dim,
        height: dim,
        ...frame,
        ...style,
      }}
    />
  );
}
