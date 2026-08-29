import { COMPOUND_KEYS } from "@/core/config/schema";
import type { ToolDefinition } from "@/core/types";
import { TrendingUp } from "lucide-react";
import { CompoundTool } from "./CompoundTool";
import { compoundLearn } from "./learn";

export const compoundTool: ToolDefinition = {
  id: "compound",
  title: "Compound calculator",
  description: "Lump sum and monthly contributions under Irish tax and fees, in euros and in today's money.",
  icon: TrendingUp,
  configKeys: [...COMPOUND_KEYS],
  component: CompoundTool,
  learn: compoundLearn,
};
