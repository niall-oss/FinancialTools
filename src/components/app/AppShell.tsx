import { useRef, useState } from "react";
import { Download, FileUp, MoreHorizontal, RotateCcw, User } from "lucide-react";
import { ProfileSettings } from "@/components/app/ProfileSettings";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { configStore } from "@/core/config/store";
import { useIsLg } from "@/hooks/use-media-query";
import { navigate } from "@/hooks/use-hash-route";

function appVersionLabel(): string {
  const raw = import.meta.env.VITE_APP_VERSION?.trim() || "dev";
  if (raw === "dev" || raw.startsWith("v")) return raw;
  return `v${raw}`;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const isLg = useIsLg();

  return (
    <div className="flex h-svh min-h-svh flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between gap-2 border-b border-border bg-card px-[max(1rem,env(safe-area-inset-left))] py-2 pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex min-w-0 items-center gap-1.5">
          {!isLg ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <User />
                  Profile
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[min(100%,20rem)] gap-3 overflow-y-auto p-4 pt-[max(2.5rem,env(safe-area-inset-top))]"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Profile and tax bands</SheetTitle>
                </SheetHeader>
                <ProfileSettings />
              </SheetContent>
            </Sheet>
          ) : null}
          <button
            type="button"
            className="min-w-0 truncate text-left text-base font-semibold tracking-tight"
            onClick={() => navigate("")}
          >
            Irish Financial Tools
          </button>
          <span className="hidden text-xs font-normal tabular-nums text-muted-foreground lg:inline">
            {appVersionLabel()}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <MoreHorizontal />
                <span className="hidden lg:inline">Config</span>
                <span className="sr-only lg:hidden">Config</span>
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

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        {children}
      </main>
    </div>
  );
}
