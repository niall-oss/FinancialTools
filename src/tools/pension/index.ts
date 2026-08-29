import { Landmark } from "lucide-react";
import { PENSION_KEYS } from "@/core/config/schema";
import type { ToolDefinition } from "@/core/types";
import { PensionTool } from "./PensionTool";
import { pensionLearn } from "./learn";

export const pensionTool: ToolDefinition = {
  id: "pension",
  title: "Pension tax relief",
  description: "Age-band relief, tax saved this year, and what happens if you pay more.",
  icon: Landmark,
  configKeys: [...PENSION_KEYS],
  component: PensionTool,
  learn: pensionLearn,
};
