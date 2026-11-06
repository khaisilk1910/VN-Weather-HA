"""Update both manifest and in-code version atomically before release."""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

version = sys.argv[1]
if not re.fullmatch(r"\d+\.\d+\.\d+", version):
    raise SystemExit("Expected version MAJOR.MINOR.PATCH without v prefix")
root = Path(__file__).resolve().parents[1]
manifest = root / "custom_components/vn_weather_ha/manifest.json"
data = json.loads(manifest.read_text())
data["version"] = version
manifest.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
const = root / "custom_components/vn_weather_ha/const.py"
const.write_text(re.sub(r'^VERSION = "[^"]+"$', f'VERSION = "{version}"', const.read_text(), flags=re.M))
print(version)
