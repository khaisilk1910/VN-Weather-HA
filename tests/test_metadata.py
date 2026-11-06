"""Distribution metadata and async architecture sanity checks."""
import json
from pathlib import Path

ROOT = Path(__file__).parents[1]
COMP = ROOT / "custom_components" / "vn_weather_ha"


def test_manifest_domain_version_consistency():
    manifest = json.loads((COMP / "manifest.json").read_text())
    assert manifest["domain"] == "vn_weather_ha"
    assert manifest["config_flow"] is True
    import re
    version = manifest["version"]
    assert re.fullmatch(r"\d+\.\d+\.\d+", version)
    assert (COMP / "const.py").read_text().count(f'VERSION = "{version}"') == 1


def test_translation_json_valid():
    for path in [COMP / "strings.json", *(COMP / "translations").glob("*.json")]:
        assert json.loads(path.read_text())["config"]["step"]["user"]


def test_does_not_declare_api_key_or_requirements():
    manifest = json.loads((COMP / "manifest.json").read_text())
    assert manifest["requirements"] == []
    assert "apikey" not in (COMP / "api.py").read_text().lower()


def test_repo_links_brand_and_card():
    manifest = json.loads((COMP / "manifest.json").read_text())
    assert manifest["documentation"] == "https://github.com/khaisilk1910/VN-Weather-HA"
    assert manifest["issue_tracker"].endswith("/VN-Weather-HA/issues")
    assert (COMP / "brand/icon.png").is_file()
    assert (COMP / "brand/icon@2x.png").is_file()
    assert (COMP / "frontend/vn-weather-ha-card.js").is_file()
    import struct
    for filename, side in (("icon.png", 256), ("icon@2x.png", 512)):
        raw = (COMP / "brand" / filename).read_bytes()
        assert raw[:8] == b"\x89PNG\r\n\x1a\n"
        assert struct.unpack(">II", raw[16:24]) == (side, side)
