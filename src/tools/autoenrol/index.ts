import { AUTOENROL_KEYS } from "@/core/config/schema";
import type { ToolDefinition } from "@/core/types";
import { Wallet } from "lucide-react";
import { AutoEnrolTool } from "./AutoEnrolTool";
import { autoenrolLearn } from "./learn";

export const autoenrolTool: ToolDefinition = {
  id: "autoenrol",
  title: "My Future Fund",
  description: "Irish auto-enrolment contributions, opt-out, and how it compares with occupational/PRSA relief.",
  icon: Wallet,
  configKeys: [...AUTOENROL_KEYS],
  component: AutoEnrolTool,
  learn: autoenrolLearn,
};
