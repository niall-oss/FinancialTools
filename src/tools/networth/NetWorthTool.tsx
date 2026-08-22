import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Chart } from "@/components/app/Chart";
import { FieldNote } from "@/components/app/FieldChrome";
import { StatCard, StatGrid } from "@/components/app/StatCard";
import { ResultsPanel, ToolLayout } from "@/components/app/ToolLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEur, formatPct } from "@/core/format";
import { useConfigStore } from "@/hooks/use-config";
import {
  addGroup,
  addItem,
  parseNetWorthSection,
  QUICK_ADD_PRESETS,
  removeGroup,
  removeItem,
  runNetWorth,
  sanitizeLabel,
  serializeNetWorthState,
  updateItem,
  type NetWorthSide,
  type NetWorthState,
} from "@/tools/networth/engine";
import { DISCLAIMER, GROUP_HINT } from "@/tools/networth/hints";

function persist(config: ReturnType<typeof useConfigStore>, state: NetWorthState): void {
  config.setSection("networth", serializeNetWorthState(state));
}

function groupSum(state: NetWorthState, side: NetWorthSide, group: string): number {
  return state.items
    .filter((item) => item.side === side && item.group === group)
    .reduce((sum, item) => sum + item.amount, 0);
}

const GROUP_TRIGGER_CLASS = "min-w-0 flex-1 py-2";

function AddGroupRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="mt-3 flex items-center gap-2">
      <Input
        value={name}
        placeholder="New group"
        aria-label="New group name"
        className="h-7 px-2.5 text-xs"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          onAdd(trimmed);
          setName("");
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => {
          const trimmed = name.trim();
          if (!trimmed) return;
          onAdd(trimmed);
          setName("");
        }}
      >
        Add group
      </Button>
    </div>
  );
}

export function NetWorthTool() {
  const config = useConfigStore();
  const state = parseNetWorthSection(config.getSection("networth"));
  const result = runNetWorth(state);
  const pendingFocusId = useRef<string | null>(null);
  const [openAssetGroups, setOpenAssetGroups] = useState<string[]>(["Cash", "Property"]);
  const [openLiabilityGroups, setOpenLiabilityGroups] = useState<string[]>(["Mortgage"]);

  useEffect(() => {
    const id = pendingFocusId.current;
    if (!id) return;
    pendingFocusId.current = null;
    document.getElementById(`nw-amount-${id}`)?.focus();
  });

  const commit = (next: NetWorthState): void => persist(config, next);

  const openGroup = (side: NetWorthSide, group: string): void => {
    const setter = side === "asset" ? setOpenAssetGroups : setOpenLiabilityGroups;
    setter((current) => (current.includes(group) ? current : [...current, group]));
  };

  const onQuickAdd = (preset: (typeof QUICK_ADD_PRESETS)[number]): void => {
    const { state: next, id } = addItem(state, {
      side: preset.side,
      group: preset.group,
      name: preset.name,
      amount: 0,
    });
    pendingFocusId.current = id;
    openGroup(preset.side, preset.group);
    commit(next);
  };

  const onAddItem = (side: NetWorthSide, group: string): void => {
    const { state: next, id } = addItem(state, { side, group, name: "New item", amount: 0 });
    pendingFocusId.current = id;
    commit(next);
  };

  const onAddGroup = (side: NetWorthSide, name: string): void => {
    const group = sanitizeLabel(name);
    if (!group) return;
    commit(addGroup(state, side, group));
    openGroup(side, group);
  };

  const renderGroups = (side: NetWorthSide, groups: string[]): ReactNode => (
    <>
      {groups.map((group) => {
        const rows = state.items.filter((item) => item.side === side && item.group === group);
        return (
          <AccordionItem key={group} value={group}>
            <div className="flex w-full items-center gap-1">
              <AccordionTrigger className={GROUP_TRIGGER_CLASS}>
                <span className="min-w-0 flex-1 truncate text-left">{group}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatEur(groupSum(state, side, group))}
                </span>
              </AccordionTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="shrink-0 text-muted-foreground"
                aria-label={`Delete ${group} group`}
                onClick={() => commit(removeGroup(state, side, group))}
              >
                <Trash2 />
              </Button>
            </div>
            <AccordionContent className="pt-1 pb-3">
              <div className="flex flex-col gap-2">
                {rows.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Input
                      aria-label={`${group} item name`}
                      value={item.name}
                      className="min-w-0 flex-1 px-2.5"
                      onChange={(event) => commit(updateItem(state, item.id, { name: event.target.value }))}
                    />
                    <Input
                      id={`nw-amount-${item.id}`}
                      type="number"
                      step={100}
                      aria-label={`${item.name || "Item"} amount`}
                      value={Number.isFinite(item.amount) ? item.amount : ""}
                      className="w-28 shrink-0 px-2.5 font-mono text-sm tabular-nums"
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        commit(updateItem(state, item.id, { amount: Number.isNaN(next) ? 0 : next }));
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 text-muted-foreground"
                      aria-label={`Remove ${item.name || "item"}`}
                      onClick={() => commit(removeItem(state, item.id))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="mt-0.5 self-start"
                  onClick={() => onAddItem(side, group)}
                >
                  <Plus />
                  Add item
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </>
  );

  const assetSlices = result.assetByGroup.map((row) => ({ name: row.group, value: row.amount }));
  const liabilitySlices = result.liabilityByGroup.map((row) => ({ name: row.group, value: row.amount }));
  const accessSlices = result.access.map((row) => ({ name: row.label, value: row.amount }));

  return (
    <ToolLayout
      title="Net worth snapshot"
      inputs={
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Quick add</p>
            <div className="flex flex-wrap gap-1">
              {QUICK_ADD_PRESETS.map((preset) => (
                <Button key={preset.label} type="button" variant="outline" size="xs" onClick={() => onQuickAdd(preset)}>
                  {preset.label}
                </Button>
              ))}
            </div>
            <FieldNote className="mt-2">{GROUP_HINT}</FieldNote>
          </div>

          <Accordion
            type="multiple"
            defaultValue={["assets", "liabilities"]}
            className="rounded-lg border border-border bg-card px-3"
          >
            <AccordionItem value="assets">
              <AccordionTrigger className={GROUP_TRIGGER_CLASS}>
                <span className="min-w-0 flex-1 truncate text-left">Assets</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatEur(result.assets)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3">
                <Accordion type="multiple" value={openAssetGroups} onValueChange={setOpenAssetGroups}>
                  {renderGroups("asset", state.assetGroups)}
                </Accordion>
                <AddGroupRow onAdd={(name) => onAddGroup("asset", name)} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="liabilities">
              <AccordionTrigger className={GROUP_TRIGGER_CLASS}>
                <span className="min-w-0 flex-1 truncate text-left">Liabilities</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatEur(result.liabilities)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3">
                <Accordion type="multiple" value={openLiabilityGroups} onValueChange={setOpenLiabilityGroups}>
                  {renderGroups("liability", state.liabilityGroups)}
                </Accordion>
                <AddGroupRow onAdd={(name) => onAddGroup("liability", name)} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      }
      results={
        <ResultsPanel>
          <StatGrid>
            <StatCard
              label="Net worth"
              value={formatEur(result.netWorth)}
              tone={result.netWorth < 0 ? "fail" : "default"}
            />
            <StatCard label="Assets" value={formatEur(result.assets)} />
            <StatCard label="Liabilities" value={formatEur(result.liabilities)} />
            <StatCard label="Accessible" value={formatEur(result.accessible)} />
            <StatCard label="Debt / assets" value={formatPct(result.debtToAssetsPct, 1)} />
          </StatGrid>

          {result.listedItems.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Group</th>
                    <th className="px-3 py-2 font-medium">Item</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {result.listedItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/60">
                      <td className="px-3 py-1.5 text-muted-foreground">{item.group}</td>
                      <td className="px-3 py-1.5">{item.name}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">{formatEur(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <FieldNote>Fill in amounts on the left to see totals and charts.</FieldNote>
          )}

          <Tabs defaultValue="groups">
            <TabsList className="flex w-full flex-wrap">
              <TabsTrigger value="groups">Groups</TabsTrigger>
              <TabsTrigger value="mix">Mix</TabsTrigger>
              <TabsTrigger value="access">Access</TabsTrigger>
            </TabsList>
            <TabsContent value="groups" className="mt-2">
              {assetSlices.length === 0 && liabilitySlices.length === 0 ? (
                <FieldNote>Add amounts to see a group breakdown.</FieldNote>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {assetSlices.length > 0 ? (
                    <div className={liabilitySlices.length === 0 ? "sm:col-span-2" : undefined}>
                      <p className="mb-1.5 text-xs text-muted-foreground">Assets</p>
                      <Chart type="pie" slices={assetSlices} />
                    </div>
                  ) : null}
                  {liabilitySlices.length > 0 ? (
                    <div className={assetSlices.length === 0 ? "sm:col-span-2" : undefined}>
                      <p className="mb-1.5 text-xs text-muted-foreground">Liabilities</p>
                      <Chart type="pie" slices={liabilitySlices} />
                    </div>
                  ) : null}
                </div>
              )}
            </TabsContent>
            <TabsContent value="mix" className="mt-2">
              {result.mix.length > 0 ? (
                <Chart
                  type="bar"
                  labels={result.mix.map((row) => row.group)}
                  series={[
                    { name: "Assets", data: result.mix.map((row) => row.assets) },
                    { name: "Liabilities", data: result.mix.map((row) => row.liabilities) },
                  ]}
                />
              ) : (
                <FieldNote>Add amounts to compare assets and liabilities by group.</FieldNote>
              )}
            </TabsContent>
            <TabsContent value="access" className="mt-2">
              {accessSlices.length > 0 ? (
                <>
                  <Chart type="pie" slices={accessSlices} />
                  <FieldNote className="mt-2">
                    Accessible is cash plus investments. Pensions are locked. Property is illiquid. Everything else
                    sits in other.
                  </FieldNote>
                </>
              ) : (
                <FieldNote>Add assets to see how much is accessible.</FieldNote>
              )}
            </TabsContent>
          </Tabs>

          <FieldNote>{DISCLAIMER}</FieldNote>
        </ResultsPanel>
      }
    />
  );
}
