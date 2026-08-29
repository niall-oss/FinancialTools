import { AUTOENROL_KEYS } from "@/core/config/schema";
import type { ToolDefinition } from "@/core/types";
import { Wallet } from "lucide-react";
import { AutoEnrolTool } from "./AutoEnrolTool";
import { autoenrolLearn } from "./learn";

export const autoenrolTool: ToolDefinition = {
  id: "autoenrol",
  title: "My Future Fund",
  description: "2026 My Future Fund rates, opt-out, and a side-by-side with a workplace scheme.",
  icon: Wallet,
  configKeys: [...AUTOENROL_KEYS],
  component: AutoEnrolTool,
  learn: autoenrolLearn,
};
