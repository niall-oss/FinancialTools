"""Build orchestration: validate config, run Vite, embed defaults."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

from .config_parser import ConfigData
from .validate_config import validate_config

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "config" / "defaults.txt"
DIST_DIR = ROOT / "dist"
OUTPUT_HTML = DIST_DIR / "financials.html"
SIZE_WARN_BYTES = 2 * 1024 * 1024


def _app_version() -> str:
    return os.environ.get("RELEASE_VERSION") or os.environ.get("VITE_APP_VERSION") or "dev"


def _inject_default_config(html_path: Path, config_data: ConfigData) -> None:
    html = html_path.read_text(encoding="utf-8")
    payload = json.dumps(config_data, separators=(",", ":"))
    script = f'<script id="embedded-default-config" type="application/json">{payload}</script>'
    if "</head>" in html:
        html = html.replace("</head>", f"  {script}\n  </head>", 1)
    else:
        html = script + html
    html_path.write_text(html, encoding="utf-8")


def main() -> int:
    print("Validating config...")
    config_data = validate_config(CONFIG_PATH)

    version = _app_version()
    env = os.environ.copy()
    env["VITE_APP_VERSION"] = version
    print(f"App version: {version}")

    print("Running Vite build...")
    result = subprocess.run(
        ["npm", "run", "build:vite"],
        cwd=ROOT,
        env=env,
        shell=sys.platform == "win32",
        check=False,
    )
    if result.returncode != 0:
        return result.returncode

    built_files = list(DIST_DIR.glob("*.html"))
    if not built_files:
        print("Build failed: no HTML output in dist/", file=sys.stderr)
        return 1

    source_html = built_files[0]
    if source_html != OUTPUT_HTML:
        source_html.rename(OUTPUT_HTML)

    print("Embedding default config...")
    _inject_default_config(OUTPUT_HTML, config_data)

    size = OUTPUT_HTML.stat().st_size
    print(f"Built: {OUTPUT_HTML} ({size:,} bytes)")
    if size > SIZE_WARN_BYTES:
        print(f"Warning: output exceeds {SIZE_WARN_BYTES:,} bytes", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
