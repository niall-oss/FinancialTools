import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { App } from "@/App";
import "./index.css";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="theme">
      <TooltipProvider delayDuration={200}>
        <App />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);
