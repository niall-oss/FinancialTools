import { useEffect, useState } from "react";

export type AppRoute =
  | { kind: "home" }
  | { kind: "tool"; id: string }
  | { kind: "learn"; toolId: string };

function parseHash(): string {
  return location.hash.replace(/^#\/?/, "");
}

export function parseAppRoute(path: string): AppRoute {
  if (!path) return { kind: "home" };
  if (path === "learn" || path.startsWith("learn/")) {
    return { kind: "learn", toolId: path === "learn" ? "" : path.slice("learn/".length) };
  }
  return { kind: "tool", id: path };
}

export function navigate(path: string): void {
  location.hash = path ? `#/${path}` : "#/";
}

export function useHashRoute(): string {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onHashChange = (): void => setRoute(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}
