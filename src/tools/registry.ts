import type { ToolDefinition } from "@/core/types";
import { autoenrolTool } from "./autoenrol";
import { compoundTool } from "./compound";
import { mortgageTool } from "./mortgage";
import { networthTool } from "./networth";
import { payeTool } from "./paye";
import { pensionTool } from "./pension";
import { runwayTool } from "./runway";

export const tools: ToolDefinition[] = [
  payeTool,
  compoundTool,
  mortgageTool,
  pensionTool,
  autoenrolTool,
  networthTool,
  runwayTool,
];

export function getTools(): ToolDefinition[] {
  return tools;
}

export function getToolById(id: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.id === id);
}
