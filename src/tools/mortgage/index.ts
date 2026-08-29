import { MORTGAGE_KEYS } from "@/core/config/schema";
import type { ToolDefinition } from "@/core/types";
import { House } from "lucide-react";
import { MortgageTool } from "./MortgageTool";
import { mortgageLearn } from "./learn";

export const mortgageTool: ToolDefinition = {
  id: "mortgage",
  title: "Irish mortgage calculator",
  description: "Central Bank limits, stamp duty, HTB, FHS, and what the monthly payment actually costs.",
  icon: House,
  configKeys: [...MORTGAGE_KEYS],
  component: MortgageTool,
  learn: mortgageLearn,
};
