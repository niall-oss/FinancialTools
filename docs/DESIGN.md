# Design system

Compact Irish personal finance calculators, distributed as a single local HTML file. The UI is React + shadcn/ui. Calculation engines live outside the UI layer and must stay that way.

## Audience

People filling dense mortgage and investment forms, not browsing a marketing site. Favour scanability, tight spacing, and readable numbers over decoration.

## Themes

- **Default is dark.** Light is optional.
- Toggle is the sun/moon button in the top bar (`ThemeToggle`).
- Persistence: `localStorage` key `theme` via `next-themes`. Values: `dark` | `light`.
- **Do not** store theme in the financial config export. Sharing a `config.txt` must not change someone else's theme.
- `enableSystem` is off so OS light mode does not override the app default.
- `index.html` sets `class="dark"` and runs a tiny inline script before paint to avoid a flash.
- Tokens live in [`src/index.css`](../src/index.css). Charts must re-read CSS variables when the theme changes (`Chart` depends on `resolvedTheme`).

## Tokens

Zinc base, emerald primary, both modes.

| Role | Dark | Light |
|------|------|--------|
| Background | Near-black zinc (`#0d0f12` range) | Zinc-50 |
| Card / popover | Lifted zinc panel | White with a visible border |
| Foreground | High-contrast off-white | Zinc-900 |
| Muted text | Zinc-400-ish, AA for labels | Zinc-600 |
| Primary (money, pass, links) | Emerald-400 (`#4ade80`) | Deeper emerald so it reads on white |
| Destructive | Red, invalid fields and fail states | Same role, slightly darker |
| Warning | Custom `--warning` (amber) | Same role |

shadcn has no warning colour; `--warning` / `--color-warning` is the extra token. Use `text-warning` and `border-warning/30` for scheme/tax caveats.

Radius is `0.5rem` (8px). Do not increase it for a “softer” look.

## Type

- **UI:** Geist Sans (`--font-sans`) — labels, titles, body.
- **Numbers:** Geist Mono (`--font-mono`) plus `tabular-nums` on every amount, rate, and numeric input.
- Scale: `text-sm` body, `text-xs` field labels, KPI values `text-lg` mono. Tool page titles stay `text-lg`, not display sizes.

## Density

shadcn Nova is already fairly tight; keep it that way.

- Inputs and select triggers: `h-8`, `px-2`, `text-sm`, mono
- Field grid: `minmax(180px, 1fr)`
- Cards: `size="sm"` (`p-3` equivalent), not default spacious cards
- Accordions: compact triggers, no extra card padding around the group
- Do not switch buttons to `lg` or inputs to `h-10` to “match shadcn demos”

## Layout

- **`AppShell`:** sticky top bar (title, theme toggle, Config menu). Export / Import / Reset live in that menu. Reset uses `AlertDialog`.
- **Home:** 280px profile card on the left, tool launcher cards on the right. Lucide icons, not emoji. Each card has a `BookOpen` learn icon top-right (`#/learn/<id>`); the rest of the card opens the calculator.
- **`ToolLayout`:** two panes on `lg+` — inputs left (scroll), results right (sticky). Below `lg`, `Tabs` switch Inputs / Results so KPIs stay reachable. Header has `Learn more` top-right to the same learn page.
- **Inputs:** group related fields in `Accordion` (mortgage) or compact `Card`s (compound). Default-open the groups people always need (buyer, loan, affordability).
- **Results:** primary `StatGrid`, quieter secondary stats, `Alert` for warnings, charts in `Tabs` — never a stack of full-height canvases.

## Component catalogue

### Use these shadcn primitives

`Button`, `Input`, `Label`, `Select`, `Checkbox`, `Card`, `Badge`, `Tooltip`, `Alert`, `Tabs`, `Accordion`, `Separator`, `DropdownMenu`, `ScrollArea`, `AlertDialog`.

Wrap the tree in `ThemeProvider` + `TooltipProvider` ([`src/main.tsx`](../src/main.tsx)).

### App wrappers (prefer these in tools)

| Wrapper | When |
|---------|------|
| `ConfigNumberField` / `NumberField` | Numeric config values |
| `ConfigSelectField` / `SelectField` | Enum config values |
| `ConfigCheckboxField` / `CheckboxField` | Boolean flags |
| `HintLabel` | Label plus `?` tooltip |
| `FieldGrid` / `FieldNote` / `FieldError` | Form layout and helper copy |
| `StatCard` / `StatGrid` | KPI tiles; `tone="pass" \| "fail"` for rules |
| `ToolLayout` / `ResultsPanel` | Every calculator page; `Learn more` in the header |
| `LearnPage` | `#/learn/<id>` explainers and official sources |
| `Chart` | ECharts; pass data, not a DOM node |
| `ThemeToggle` | Only in the shell |

Add a new wrapper when the same control would otherwise be copied into a second tool. One-off composites (deposit mode + amount) can live in the tool file.

## Charts

[`src/core/charts.ts`](../src/core/charts.ts) reads `--muted-foreground`, `--border`, `--primary`, `--foreground` through computed styles so light mode does not keep dark axes. The React `Chart` wrapper owns init, dispose, resize, and theme refresh. Do not call `echarts.init` from a tool page.

## Adding a tool

1. Engine in `src/tools/<id>/engine.ts` (no React).
2. `src/tools/<id>/<Name>Tool.tsx` using `ToolLayout` + field helpers.
3. `src/tools/<id>/learn.ts` exporting `LearnContent` (plain-language topics plus official-only source URLs).
4. `src/tools/<id>/index.ts` exporting a `ToolDefinition` (`icon` is a Lucide component, `component` is the page, `learn` is the content).
5. Register in [`src/tools/registry.ts`](../src/tools/registry.ts).
6. Defaults under `[<id>]` in `config/defaults.txt`.

## Do

- Keep engines and config parsing out of UI files
- Bind fields through `useConfigStore()` / `config.set`
- Use hash routes (`#/`, `#/<id>`, `#/learn/<id>`)
- Keep the single-file Vite build

## Don’t

- Spacious marketing layouts, hero type, or extra motion
- A light-by-default theme, or following `prefers-color-scheme`
- Putting theme in exported config
- Spreadsheet/table editors for inputs
- New CSS palettes that bypass `index.css` tokens
- Reintroducing imperative `document.createElement` UI
