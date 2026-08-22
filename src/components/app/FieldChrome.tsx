import { CircleHelp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function HintLabel({
  htmlFor,
  children,
  hint,
  className,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-1 flex min-h-4 items-center gap-1", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {children}
      </Label>
      {hint ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground"
              aria-label={hint}
            >
              <CircleHelp className="size-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-64 text-left font-normal">
            {hint}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function FieldNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs leading-snug text-muted-foreground", className)}>{children}</p>;
}

export function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs leading-snug text-destructive">{children}</p>;
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-3 gap-y-2.5">
      {children}
    </div>
  );
}
