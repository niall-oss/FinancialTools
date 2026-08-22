import { useRef, useState } from "react";
import { Download, FileUp, MoreHorizontal, RotateCcw } from "lucide-react";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { configStore } from "@/core/config/store";
import { navigate } from "@/hooks/use-hash-route";

function appVersionLabel(): string {
  const raw = import.meta.env.VITE_APP_VERSION?.trim() || "dev";
  if (raw === "dev" || raw.startsWith("v")) return raw;
  return `v${raw}`;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <div className="flex h-svh min-h-svh flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2">
        <div className="flex items-baseline gap-2">
          <button
            type="button"
            className="text-left text-base font-semibold tracking-tight"
            onClick={() => navigate("")}
          >
            Irish Financial Tools
          </button>
          <span className="text-xs font-normal tabular-nums text-muted-foreground">
            {appVersionLabel()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <MoreHorizontal />
                Config
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => configStore.downloadExport()}>
                <Download />
                Export config
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                <FileUp />
                Import config
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setResetOpen(true)}>
                <RotateCcw />
                Reset defaults
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) await configStore.importFromFile(file);
          event.target.value = "";
        }}
      />

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces your current saved values with the built-in defaults.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                configStore.resetToDefaults();
                setResetOpen(false);
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">{children}</main>
    </div>
  );
}
