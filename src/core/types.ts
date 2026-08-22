import type { LearnContent } from "@/learn/types";
import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { ConfigStore } from "./config/store";

export interface AppContext {
  config: ConfigStore;
}

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  configKeys: string[];
  component: ComponentType;
  learn: LearnContent;
}
