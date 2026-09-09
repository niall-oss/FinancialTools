import { HintButton } from "@/components/app/FieldChrome";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  delta,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "pass" | "fail";
  delta?: { text: string; tone: "pass" | "fail" };
}) {
  return (
    <div className="relative rounded-lg border border-border bg-card px-3 py-2.5">
      {delta ? (
        <span
          className={cn(
            "absolute top-2 right-2.5 font-mono text-[11px] leading-none font-medium tabular-nums",
            delta.tone === "fail" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {delta.text}
        </span>
      ) : null}
      <div className={cn("mb-0.5 flex items-center gap-0.5 text-xs text-muted-foreground", delta ? "pr-10" : null)}>
        <span>{label}</span>
        {hint ? <HintButton hint={hint} compact /> : null}
      </div>
      <div
        className={cn(
          "font-mono text-lg leading-tight font-medium tabular-nums",
          tone === "fail" ? "text-destructive" : "text-primary",
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">{children}</div>
  );
}
