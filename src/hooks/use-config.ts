import { useEffect, useState } from "react";
import { configStore } from "@/core/config/store";

export function useConfigStore() {
  const [, setTick] = useState(0);
  useEffect(() => configStore.subscribe(() => setTick((tick) => tick + 1)), []);
  return configStore;
}
