# Development

Contributor notes. The user-facing description is in [README.md](README.md).

`npm run build` writes `dist/financials.html`. The UI is React and shadcn, dark by default. Config is a `key=value` text file with `#` comments. Values save to localStorage. You can also import, export, or fetch `config.txt` when the file is served locally.

See [docs/DESIGN.md](docs/DESIGN.md) for the UI rules.

## Prerequisites

- Node.js 22 LTS. Installer at [nodejs.org](https://nodejs.org/).
- [uv](https://docs.astral.sh/uv/getting-started/installation/) for the Python venv and tools.
- Git

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

Open http://localhost:5173. Hot reload is on. Hash routes are `#/`, `#/compound`, `#/mortgage`, `#/pension`, `#/autoenrol`, and learn pages at `#/learn/<id>`.

To test `config.txt` loading via fetch, serve the repo root in a second terminal:

```bash
uv run python -m http.server 8080
# then open http://localhost:8080/dist/financials.html
```

### Type-check and lint

Any TypeScript edit must pass `npm run typecheck` before finishing. Any Python edit must pass `uv run ruff check` and `uv run ty check`.

```bash
npm run typecheck          # tsc --noEmit (TypeScript 7)
uv run ruff check build/ tests/
uv run ruff format build/ tests/
uv run ty check            # paths from [tool.ty.src] in pyproject.toml
```

### Run tests

```bash
npm test                   # Vitest, calculation engines
uv run pytest              # Python, config parser
```

### Project layout

- `src/` is the React app (tools, core, shadcn components)
- `docs/DESIGN.md` is the UI design system for new tools
- `build/` is Python build and validation scripts
- `config/defaults.txt` is the default config
- `docs/future-tools.md` is the backlog of planned tools
- `dist/financials.html` is the built single-file output, after `npm run build`

## Building for distribution

```bash
npm run build
```

Output is `dist/financials.html`, a single file you can open locally or host. Export and import config from the app UI.

Local and PR builds stamp the header as `dev`. Release builds stamp the integer version (`v1`, `v2`, and so on) via `RELEASE_VERSION` / `VITE_APP_VERSION`. CI and the release job run this same `npm run build` command.

## CI and releases

Every pull request runs two jobs. They rerun on each new commit, and stale runs are cancelled.

The check job runs `npm run typecheck`, `npm test`, `uv run ruff check`, `uv run ty check`, and `uv run pytest`. The build job runs `npm run build` and asserts that `dist/financials.html` exists.

Merging to `main` publishes the next integer GitHub Release. Tags are the source of truth (`v1`, `v2`, and so on). There is no version bump commit. The first successful run on `main` is v1. Each later merge increments by one.

Users download `financials.html` from the Releases page. See [README.md](README.md).

After the first CI run appears, require the `check` and `build` status checks on `main` in the GitHub branch protection settings.

## Config format

```ini
# Irish Financial Tools config

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

- Sections map to namespaces. `#` starts a comment, including after a value.
- Export and import from the Config menu write and read `.txt` files.
- Theme (dark or light) is stored separately in `localStorage` and is not part of the config file.
- Values auto-save to localStorage.

## Adding a new tool

See [docs/future-tools.md](docs/future-tools.md) for the backlog and checklist, and [docs/DESIGN.md](docs/DESIGN.md) for UI rules.

1. Create `src/tools/<id>/` with `index.ts`, `engine.ts`, `learn.ts`, `<Name>Tool.tsx`
2. Register in `src/tools/registry.ts` (include `learn` on the definition)
3. Add defaults under `[<id>]` in `config/defaults.txt`
