import { Wallet } from "lucide-react";
import { NETWORTH_KEYS } from "@/core/config/schema";
import type { ToolDefinition } from "@/core/types";
import { NetWorthTool } from "./NetWorthTool";
import { networthLearn } from "./learn";

export const networthTool: ToolDefinition = {
  id: "networth",
  title: "Net worth snapshot",
  description: "Manual asset and liability list, grouped for mix and access charts.",
  icon: Wallet,
  configKeys: [...NETWORTH_KEYS],
  component: NetWorthTool,
  learn: networthLearn,
};
