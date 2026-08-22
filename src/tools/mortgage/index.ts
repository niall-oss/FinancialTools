import { MORTGAGE_KEYS } from "@/core/config/schema";
import type { ToolDefinition } from "@/core/types";
import { House } from "lucide-react";
import { MortgageTool } from "./MortgageTool";
import { mortgageLearn } from "./learn";

export const mortgageTool: ToolDefinition = {
  id: "mortgage",
  title: "Irish mortgage calculator",
  description: "Borrowing limits, amortization, stamp duty, schemes, and overpayments.",
  icon: House,
  configKeys: [...MORTGAGE_KEYS],
  component: MortgageTool,
  learn: mortgageLearn,
};
