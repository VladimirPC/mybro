import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl bg-surface p-4 text-fg shadow-[var(--shadow-border)]", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("font-display text-lg font-medium tracking-tight", className)} {...props} />;
}

export function CardHint({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm leading-normal text-muted", className)} {...props} />;
}
