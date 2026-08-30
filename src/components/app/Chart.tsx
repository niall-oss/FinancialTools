import { useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createChart,
  disposeChart,
  renderBarChart,
  renderLineChart,
  renderPieChart,
  renderScatterChart,
  type LineSeries,
  type PieSlice,
} from "@/core/charts";
import { cn } from "@/lib/utils";

type ChartProps =
  | { type: "line"; labels: string[]; series: LineSeries[]; markCategory?: string; className?: string }
  | {
      type: "bar";
      labels: string[];
      series: { name: string; data: number[]; stack?: string }[];
      className?: string;
    }
  | {
      type: "scatter";
      points: { name: string; x: number; y: number }[];
      className?: string;
    }
  | { type: "pie"; slices: PieSlice[]; className?: string };

function ChartCanvas(props: ChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart = createChart(el);
    if (props.type === "line") {
      renderLineChart(chart, props.labels, props.series, undefined, props.markCategory);
    } else if (props.type === "bar") renderBarChart(chart, props.labels, props.series);
    else if (props.type === "pie") renderPieChart(chart, props.slices);
    else renderScatterChart(chart, props.points);

    const onResize = (): void => chart.resize();
    window.addEventListener("resize", onResize);
    const observer = new ResizeObserver(onResize);
    observer.observe(el);
    const frame = requestAnimationFrame(() => chart.resize());
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      disposeChart(chart);
    };
  }, [props, resolvedTheme]);

  return (
    <div
      ref={ref}
      className={cn("h-72 w-full rounded-lg border border-border bg-card", props.className)}
    />
  );
}

export function Chart(props: ChartProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative">
        <ChartCanvas {...props} />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2 z-10 bg-card/80 hover:bg-card"
          aria-label="Expand chart"
          onClick={() => setOpen(true)}
        >
          <Maximize2 />
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col gap-0 rounded-none p-3 inset-0 top-0 left-0 translate-x-0 translate-y-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-[calc(100vh-3rem)] sm:w-[calc(100vw-3rem)] sm:max-w-none sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Chart</DialogTitle>
          </DialogHeader>
          {open ? <ChartCanvas {...props} className="h-full min-h-0 flex-1" /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
