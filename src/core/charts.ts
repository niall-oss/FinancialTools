import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart, ScatterChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export type ChartInstance = echarts.ECharts;

export interface ChartColors {
  muted: string;
  border: string;
  primary: string;
  foreground: string;
  series: string[];
}

let colorCtx: CanvasRenderingContext2D | null | undefined;

function canvasColorContext(): CanvasRenderingContext2D | null {
  if (colorCtx !== undefined) return colorCtx;
  if (typeof document === "undefined") {
    colorCtx = null;
    return colorCtx;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  colorCtx = canvas.getContext("2d", { willReadFrequently: true });
  return colorCtx;
}

function toHexByte(value: number): string {
  return value.toString(16).padStart(2, "0");
}

function toEchartsColor(color: string): string {
  const ctx = canvasColorContext();
  if (!ctx) return color;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000000";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  if (a === 0) return color;
  const hex = `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
  if (a === 255) return hex;
  return `rgba(${r},${g},${b},${Math.round((a / 255) * 1000) / 1000})`;
}

function resolveCssColor(variable: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.style.color = `var(${variable})`;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return toEchartsColor(color || fallback);
}

export function getChartColors(): ChartColors {
  const primary = resolveCssColor("--primary", "#4ade80");
  const muted = resolveCssColor("--muted-foreground", "#8b95a8");
  const foreground = resolveCssColor("--foreground", "#e8eaed");
  return {
    muted,
    border: resolveCssColor("--border", "#2a3040"),
    primary,
    foreground,
    series: [
      resolveCssColor("--chart-1", "#4ade80"),
      resolveCssColor("--chart-2", "#8b95a8"),
      resolveCssColor("--chart-3", "#e0b14a"),
      resolveCssColor("--chart-4", "#e05a4a"),
      resolveCssColor("--chart-5", "#6b7280"),
    ],
  };
}

export function createChart(container: HTMLElement): ChartInstance {
  return echarts.init(container, {
    backgroundColor: "transparent",
    textStyle: { color: getChartColors().muted },
  });
}

export function disposeChart(chart: ChartInstance | undefined): void {
  chart?.dispose();
}

export interface LineSeries {
  name: string;
  data: number[];
  area?: boolean;
  stack?: string;
}

const CHART_GRID = {
  containLabel: true,
  left: 16,
  right: 20,
  top: 48,
  bottom: 20,
} as const;

export function renderLineChart(
  chart: ChartInstance,
  labels: string[],
  series: LineSeries[],
  colors: ChartColors = getChartColors(),
): void {
  chart.setOption(
    {
      tooltip: { trigger: "axis" },
      legend: { data: series.map((s) => s.name), textStyle: { color: colors.muted } },
      grid: CHART_GRID,
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: colors.border } },
        axisLabel: { color: colors.muted },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: colors.border } },
        splitLine: { lineStyle: { color: colors.border } },
        axisLabel: { color: colors.muted },
      },
      color: colors.series,
      series: series.map((s, index) => {
        const color = colors.series[index % colors.series.length];
        return {
          name: s.name,
          type: "line",
          data: s.data,
          smooth: true,
          areaStyle: s.area ? { opacity: 0.15, color } : undefined,
          stack: s.stack,
          itemStyle: { color },
          lineStyle: { width: 2, color },
          emphasis: {
            itemStyle: { color },
            lineStyle: { width: 2, color },
            areaStyle: s.area ? { opacity: 0.15, color } : undefined,
          },
        };
      }),
    },
    true,
  );
}

export function renderBarChart(
  chart: ChartInstance,
  labels: string[],
  series: { name: string; data: number[]; stack?: string }[],
  colors: ChartColors = getChartColors(),
): void {
  chart.setOption(
    {
      tooltip: { trigger: "axis" },
      legend: { data: series.map((s) => s.name), textStyle: { color: colors.muted } },
      grid: CHART_GRID,
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: colors.border } },
        axisLabel: { color: colors.muted },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: colors.border } },
        splitLine: { lineStyle: { color: colors.border } },
        axisLabel: { color: colors.muted },
      },
      color: colors.series.length ? colors.series : [colors.primary, colors.muted, colors.foreground],
      series: series.map((s) => ({
        name: s.name,
        type: "bar",
        data: s.data,
        stack: s.stack,
      })),
    },
    true,
  );
}

export function renderScatterChart(
  chart: ChartInstance,
  points: { name: string; x: number; y: number }[],
  colors: ChartColors = getChartColors(),
): void {
  chart.setOption(
    {
      tooltip: {
        trigger: "item",
        formatter: (params: { value: [number, number] }) =>
          `Return: ${params.value[0]}%<br/>Balance: €${params.value[1].toLocaleString("en-IE")}`,
      },
      grid: { ...CHART_GRID, top: 40, bottom: 36 },
      xAxis: {
        type: "value",
        name: "Return %",
        nameLocation: "middle",
        nameGap: 28,
        axisLine: { lineStyle: { color: colors.border } },
        axisLabel: { color: colors.muted },
        nameTextStyle: { color: colors.muted },
      },
      yAxis: {
        type: "value",
        name: "Final balance",
        nameGap: 8,
        axisLine: { lineStyle: { color: colors.border } },
        splitLine: { lineStyle: { color: colors.border } },
        axisLabel: { color: colors.muted },
        nameTextStyle: { color: colors.muted },
      },
      series: [
        {
          type: "scatter",
          data: points.map((p) => [p.x, p.y]),
          symbolSize: 10,
          itemStyle: { color: colors.primary },
        },
      ],
    },
    true,
  );
}

export interface PieSlice {
  name: string;
  value: number;
}

export function renderPieChart(
  chart: ChartInstance,
  slices: PieSlice[],
  colors: ChartColors = getChartColors(),
): void {
  chart.setOption(
    {
      tooltip: {
        trigger: "item",
        formatter: (params: { name: string; value: number; percent: number }) =>
          `${params.name}: €${params.value.toLocaleString("en-IE")} (${params.percent}%)`,
      },
      legend: {
        type: "scroll",
        bottom: 0,
        textStyle: { color: colors.muted },
      },
      color: colors.series,
      series: [
        {
          type: "pie",
          radius: ["42%", "68%"],
          center: ["50%", "46%"],
          avoidLabelOverlap: true,
          label: { color: colors.foreground, formatter: "{b}" },
          labelLine: { lineStyle: { color: colors.border } },
          data: slices,
        },
      ],
    },
    true,
  );
}
