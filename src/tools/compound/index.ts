import { COMPOUND_KEYS } from "@/core/config/schema";
import type { ToolDefinition } from "@/core/types";
import { TrendingUp } from "lucide-react";
import { CompoundTool } from "./CompoundTool";
import { compoundLearn } from "./learn";

export const compoundTool: ToolDefinition = {
  id: "compound",
  title: "Compound calculator",
  description: "Investment growth with Irish tax modes, fees, and inflation adjustment.",
  icon: TrendingUp,
  configKeys: [...COMPOUND_KEYS],
  component: CompoundTool,
  learn: compoundLearn,
};
