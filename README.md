# Irish Financial Tools

Irish personal finance calculators as a local web app suite. Build once, open as a single HTML file.

Illustrative only, not advice. Rules and rates change. Read the linked official sources in each tool's learn page before you act.

Released under the [MIT License](LICENSE).

## Overview

This project contains expandable financial tools (compound calculator, mortgage calculator, pension tax relief, and more) with:

- **Single-file distribution** — `npm run build` produces `dist/financials.html`
- **Compact financial UI** — React + shadcn, dark by default with a light toggle; see [`docs/DESIGN.md`](docs/DESIGN.md)
- **Human-readable config** — `.txt` format with `key=value` and `#` comments
- **Hybrid persistence** — localStorage, import/export, optional `config.txt` fetch when served locally

## Prerequisites

- **Node.js** 22 LTS (or latest LTS) — [nodejs.org](https://nodejs.org/)
- **uv** — Python package/env manager: [docs.astral.sh/uv](https://docs.astral.sh/uv/getting-started/installation/)
- **Git**

## Local development

### First-time setup

Clone this repository, then:

```bash
cd Financials

# Node dependencies (React, Vite, Vitest, ECharts, shadcn)
npm install

# Python 3.14 venv + build tools (ruff, ty, pytest)
uv sync
```

### Run the dev server

```bash
npm run dev
```

Open http://localhost:5173 — hot reload enabled. Hash routes: `#/`, `#/compound`, `#/mortgage`, `#/pension`, `#/autoenrol`, and learn pages at `#/learn/<id>`.

To test `config.txt` loading via fetch, serve the repo root in a second terminal:

```bash
uv run python -m http.server 8080
# then open http://localhost:8080/dist/financials.html
```

### Type-check & lint

Any TypeScript edit must pass `npm run typecheck` before finishing. Any Python edit must pass `uv run ruff check` and `uv run ty check`.

```bash
npm run typecheck          # tsc --noEmit (TypeScript 7)
uv run ruff check build/ tests/
uv run ruff format build/ tests/
uv run ty check            # paths from [tool.ty.src] in pyproject.toml
```

### Run tests

```bash
npm test                   # Vitest — calculation engines
uv run pytest              # Python — config parser
```

### Project layout

- `src/` — React app (tools, core, shadcn components)
- `docs/DESIGN.md` — UI design system for new tools
- `build/` — Python build/validation scripts
- `config/defaults.txt` — default config reference
- `docs/future-tools.md` — prioritized backlog of planned tools
- `dist/financials.html` — built single-file output (after `npm run build`)

## Building for distribution

```bash
npm run build
```

Output: `dist/financials.html` — a single file you can open locally or host. Config can be exported/imported from the app UI.

Local and PR builds stamp the header as `dev`. Release builds stamp the integer version (`v1`, `v2`, …) via `RELEASE_VERSION` / `VITE_APP_VERSION`. CI and the release job run this same `npm run build` command.

## CI and releases

Every pull request runs two jobs (rerun on each new commit; stale runs are cancelled):

- **check** — `npm run typecheck`, `npm test`, `uv run ruff check`, `uv run ty check`, `uv run pytest`
- **build** — `npm run build`, then asserts `dist/financials.html` exists

Merging to `main` publishes the next integer GitHub Release. Tags are the source of truth (`v1`, `v2`, …); there is no version bump commit. The first successful run on `main` is **v1**. Each later merge increments by one.

Download `financials.html` or `financials-vN.html` from the [Releases](../../releases) page.

After the first CI run appears, require the `check` and `build` status checks on `main` in the GitHub branch protection settings.

## Config format

```ini
# Irish Financial Tools — config

[profile]
annual_salary=70000
age=30

[tax_ie]
standard_rate_pct=20
higher_rate_pct=40
band_single=44000

[compound]
initial_investment=10000
monthly_contribution=500
years=30
annual_return_pct=7.0
tax_mode=deemed_disposal    # none | deemed_disposal | cgt_on_exit | income_annual

[pension]
employee_contrib_pct=7
employment_type=paye
```

- Sections map to namespaces; `#` starts a comment (inline comments supported)
- Export/Import from the Config menu write/read `.txt` files
- Theme (dark/light) is stored separately in `localStorage` and is not part of the config file
- Values auto-save to localStorage

## Adding a new tool

See [`docs/future-tools.md`](docs/future-tools.md) for the backlog and checklist, and [`docs/DESIGN.md`](docs/DESIGN.md) for UI rules:

1. Create `src/tools/<id>/` with `index.ts`, `engine.ts`, `learn.ts`, `<Name>Tool.tsx`
2. Register in `src/tools/registry.ts` (include `learn` on the definition)
3. Add defaults under `[<id>]` in `config/defaults.txt`
