"""Tests for config parser."""

from pathlib import Path

from build.config_parser import ConfigData, parse_config, serialize_config


def test_parse_sections_and_comments() -> None:
    text = """
# header comment
[profile]
annual_salary=85000  # inline comment
age=34

[compound]
tax_mode=deemed_disposal
inflation_adjustment=true
annual_return_pct=7.0
"""
    data = parse_config(text)
    assert data["profile"]["annual_salary"] == 85000
    assert data["profile"]["age"] == 34
    assert data["compound"]["tax_mode"] == "deemed_disposal"
    assert data["compound"]["inflation_adjustment"] is True
    assert data["compound"]["annual_return_pct"] == 7.0


def test_serialize_roundtrip() -> None:
    original: ConfigData = {
        "profile": {"annual_salary": 85000, "age": 34},
        "compound": {"tax_mode": "none", "annual_return_pct": 7.0},
    }
    text = serialize_config(original)
    parsed = parse_config(text)
    assert parsed["profile"]["annual_salary"] == 85000
    assert parsed["compound"]["tax_mode"] == "none"


def test_defaults_file_parses() -> None:
    path = Path(__file__).resolve().parent.parent / "config" / "defaults.txt"
    data = parse_config(path.read_text(encoding="utf-8"))
    assert "profile" in data
    assert "compound" in data
    assert "tax_ie" in data
    assert "pension" in data
    assert "autoenrol" in data
    assert "networth" in data
    assert data["compound"]["tax_mode"] == "deemed_disposal"
    assert data["tax_ie"]["band_single"] == 44000
