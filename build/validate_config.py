"""Validate config/defaults.txt before build."""

from __future__ import annotations

import sys
from pathlib import Path

from .config_parser import ConfigData, parse_config

REQUIRED_SECTIONS = {
    "profile",
    "tax_ie",
    "compound",
    "mortgage",
    "pension",
    "autoenrol",
    "networth",
    "paye",
}
REQUIRED_KEYS: dict[str, set[str]] = {
    "profile": {"annual_salary", "age"},
    "tax_ie": {
        "standard_rate_pct",
        "higher_rate_pct",
        "band_single",
        "band_spccc",
        "band_married_one",
        "band_married_two_base",
        "band_married_two_max_increase",
    },
    "compound": {
        "initial_investment",
        "monthly_contribution",
        "years",
        "annual_return_pct",
        "annual_fee_pct",
        "tax_mode",
    },
    "mortgage": {
        "property_price",
        "deposit_pct",
        "interest_rate_pct",
        "term_years",
        "buyer_type",
        "property_type",
    },
    "pension": {
        "use_profile",
        "employment_type",
        "tax_status",
        "employee_contrib_pct",
    },
    "autoenrol": {
        "use_profile",
        "enrolment_year",
        "participation",
        "compare_scheme",
        "employee_contrib_pct",
    },
    "networth": {
        "asset_groups",
        "liability_groups",
        "assets",
        "liabilities",
    },
    "paye": {
        "use_profile",
        "tax_status",
        "claim_rent",
        "employee_contrib_pct",
    },
}


def validate_config(path: Path) -> ConfigData:
    text = path.read_text(encoding="utf-8")
    data = parse_config(text)

    missing_sections = REQUIRED_SECTIONS - set(data)
    if missing_sections:
        msg = f"Missing config sections: {', '.join(sorted(missing_sections))}"
        raise ValueError(msg)

    for section, keys in REQUIRED_KEYS.items():
        section_data = data.get(section, {})
        missing_keys = keys - set(section_data)
        if missing_keys:
            msg = f"[{section}] missing keys: {', '.join(sorted(missing_keys))}"
            raise ValueError(msg)

    return data


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    config_path = root / "config" / "defaults.txt"
    try:
        validate_config(config_path)
    except ValueError as exc:
        print(f"Config validation failed: {exc}", file=sys.stderr)
        return 1
    print(f"Config OK: {config_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
