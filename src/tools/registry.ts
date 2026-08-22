import type { ToolDefinition } from "@/core/types";
import { autoenrolTool } from "./autoenrol";
import { compoundTool } from "./compound";
import { mortgageTool } from "./mortgage";
import { networthTool } from "./networth";
import { pensionTool } from "./pension";

export const tools: ToolDefinition[] = [
  compoundTool,
  mortgageTool,
  pensionTool,
  autoenrolTool,
  networthTool,
];

export function getTools(): ToolDefinition[] {
  return tools;
}

export function getToolById(id: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.id === id);
}
