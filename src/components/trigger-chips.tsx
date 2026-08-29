import { TRIGGERS, type TriggerId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TriggerChips({
  selected,
  onSelect,
}: {
  selected?: TriggerId | null;
  onSelect: (id: TriggerId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TRIGGERS.map((t) => {
        const on = selected === t.id;
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={on}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(t.id);
            }}
            className={cn(
              "min-h-11 rounded-full px-3.5 text-sm transition-colors",
              on
                ? "bg-primary text-primary-fg"
                : "bg-surface-2 text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
