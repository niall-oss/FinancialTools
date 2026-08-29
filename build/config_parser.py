"""Parse X=Y config files with section headers and comment support."""

from __future__ import annotations

import re

type ConfigValue = str | bool | int | float
type ConfigData = dict[str, dict[str, ConfigValue]]


def _strip_inline_comment(value: str) -> str:
    in_quotes = False
    for i, char in enumerate(value):
        if char in "\"'":
            in_quotes = not in_quotes
        elif char == "#" and not in_quotes:
            return value[:i].strip()
    return value.strip()


def _coerce_value(raw: str) -> str | bool | int | float:
    text = _strip_inline_comment(raw)
    lower = text.lower()
    if lower == "true":
        return True
    if lower == "false":
        return False
    try:
        if "." in text:
            return float(text)
        return int(text)
    except ValueError:
        return text


def parse_config(text: str) -> ConfigData:
    """Parse config text into nested section dictionaries."""
    result: ConfigData = {}
    current_section: str | None = None

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        section_match = re.match(r"^\[(.+)\]$", stripped)
        if section_match:
            current_section = section_match.group(1).strip()
            result.setdefault(current_section, {})
            continue

        if current_section is None or "=" not in stripped:
            continue

        key, _, raw_value = stripped.partition("=")
        key = key.strip()
        if key:
            result[current_section][key] = _coerce_value(raw_value)

    return result


def serialize_config(data: ConfigData) -> str:
    """Serialize config dict back to .txt format."""
    lines: list[str] = ["# Irish Financial Tools config", ""]
    for section, values in data.items():
        lines.append(f"[{section}]")
        for key, value in values.items():
            lines.append(f"{key}={value}")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"
