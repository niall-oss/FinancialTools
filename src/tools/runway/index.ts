import { Hourglass } from "lucide-react";
import { RUNWAY_KEYS } from "@/core/config/schema";
import type { ToolDefinition } from "@/core/types";
import { RunwayTool } from "./RunwayTool";
import { runwayLearn } from "./learn";

export const runwayTool: ToolDefinition = {
  id: "runway",
  title: "Emergency fund runway",
  description: "How long cash lasts, and how much you need to last 3 or 6 months.",
  icon: Hourglass,
  configKeys: [...RUNWAY_KEYS],
  component: RunwayTool,
  learn: runwayLearn,
};
