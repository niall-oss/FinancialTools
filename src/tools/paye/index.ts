import { Receipt } from "lucide-react";
import { PAYE_KEYS } from "@/core/config/schema";
import type { ToolDefinition } from "@/core/types";
import { PayeTool } from "./PayeTool";
import { payeLearn } from "./learn";

export const payeTool: ToolDefinition = {
  id: "paye",
  title: "PAYE take-home",
  description: "Where a Class A payslip goes: income tax, USC, PRSI, and what a raise or BIK changes.",
  icon: Receipt,
  configKeys: [...PAYE_KEYS],
  component: PayeTool,
  learn: payeLearn,
};
