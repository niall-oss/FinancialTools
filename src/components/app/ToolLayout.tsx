import { BookOpen } from "lucide-react";
import { Link } from "@/components/app/Link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseAppRoute, useHashRoute } from "@/hooks/use-hash-route";
import { cn } from "@/lib/utils";

export function ToolLayout({
  title,
  inputs,
  results,
}: {
  title: string;
  inputs: React.ReactNode;
  results: React.ReactNode;
}) {
  const route = useHashRoute();
  const parsed = parseAppRoute(route);
  const toolId = parsed.kind === "tool" ? parsed.id : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <header className="flex shrink-0 items-end justify-between gap-3">
        <div>
          <Link href="#/" className="text-xs text-muted-foreground hover:text-foreground">
            ← All tools
          </Link>
          <h1 className="mt-0.5 text-lg font-semibold tracking-tight">{title}</h1>
        </div>
        {toolId ? (
          <Link
            href={`#/learn/${toolId}`}
            className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="size-3.5" />
            Learn more
          </Link>
        ) : null}
      </header>

      <div className="hidden min-h-0 flex-1 gap-4 overflow-hidden lg:grid lg:grid-cols-[minmax(320px,42%)_minmax(0,1fr)]">
        <section className="min-h-0 overflow-y-auto overscroll-contain pr-2">{inputs}</section>
        <section className="min-h-0 overflow-y-auto overscroll-contain pr-2">{results}</section>
      </div>

      <Tabs defaultValue="inputs" className="flex min-h-0 flex-1 flex-col lg:hidden">
        <TabsList className="w-full shrink-0">
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        <TabsContent value="inputs" className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
          {inputs}
        </TabsContent>
        <TabsContent value="results" className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
          {results}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ResultsPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-3", className)}>{children}</div>;
}
