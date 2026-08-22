import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { configStore } from "@/core/config/store";
import { Dashboard } from "@/home/Dashboard";
import { parseAppRoute, useHashRoute } from "@/hooks/use-hash-route";
import { LearnPage } from "@/learn/LearnPage";
import { getToolById } from "@/tools/registry";

export function App() {
  const route = useHashRoute();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void configStore.load().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const parsed = parseAppRoute(route);
  const notFound = <p className="text-sm text-muted-foreground">Tool not found.</p>;

  let body: ReactNode;
  if (parsed.kind === "learn") {
    const tool = getToolById(parsed.toolId);
    body = tool ? <LearnPage tool={tool} /> : notFound;
  } else if (parsed.kind === "tool") {
    const Tool = getToolById(parsed.id)?.component;
    body = Tool ? <Tool /> : notFound;
  } else {
    body = <Dashboard />;
  }

  return <AppShell>{body}</AppShell>;
}
