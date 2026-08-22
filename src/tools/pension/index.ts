import { Landmark } from "lucide-react";
import { PENSION_KEYS } from "@/core/config/schema";
import type { ToolDefinition } from "@/core/types";
import { PensionTool } from "./PensionTool";
import { pensionLearn } from "./learn";

export const pensionTool: ToolDefinition = {
  id: "pension",
  title: "Pension tax relief",
  description: "Irish age-band allowances, income-tax saved, and what-if contribution charts.",
  icon: Landmark,
  configKeys: [...PENSION_KEYS],
  component: PensionTool,
  learn: pensionLearn,
};
