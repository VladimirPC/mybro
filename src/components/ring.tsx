import { cn } from "@/lib/utils";

export function CountRing({
  value,
  max,
  label,
  sub,
  size = 196,
  className,
}: {
  value: number;
  max: number;
  label?: string;
  sub?: string;
  size?: number;
  className?: string;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max > 0 ? Math.min(1.15, value / max) : 0;
  const over = max > 0 && value > max;
  const dash = Math.min(1, value / Math.max(1, max)) * c;
  return (
    <div className={cn("relative mx-auto", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-surface-2"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className={over ? "text-danger" : "text-primary"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 400ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={cn("font-display text-5xl leading-none tracking-tight tabular", over && "text-danger")}>
          {value}
          {max > 0 ? <span className="text-2xl text-muted">/{max}</span> : null}
        </span>
        {label ? <span className="mt-2 text-sm text-muted">{label}</span> : null}
        {sub ? <span className="mt-0.5 text-xs text-subtle">{sub}</span> : null}
        <span className="sr-only">
          {value} из {max}, доля {Math.round(ratio * 100)}%
        </span>
      </div>
    </div>
  );
}
