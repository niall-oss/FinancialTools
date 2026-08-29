import { CircleHelp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="-m-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground"
              aria-label={hint}
            >
              <CircleHelp className="size-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" side="top" className="w-72 max-w-[min(18rem,calc(100vw-2rem))] p-2.5 text-xs leading-snug">
            {hint}
          </PopoverContent>
        </Popover>
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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-x-3 gap-y-2.5">
      {children}
    </div>
  );
}
