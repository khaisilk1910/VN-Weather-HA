"""Create Manual and Marketplace ZIPs, preserving HA installation paths."""
from __future__ import annotations
import json
import os
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
component = root / "custom_components/vn_weather_ha"
version = json.loads((component / "manifest.json").read_text())["version"]
output = Path(os.environ.get('PACKAGE_OUTPUT_DIR', str(root / 'dist')))
output.mkdir(parents=True, exist_ok=True)
skip = {"__pycache__", ".pytest_cache", ".git", ".venv", ".ruff_cache", "dist", ".mypy_cache"}
archives = {
    f"VN-Weather-HA-{version}-Manual.zip": [(p, p.relative_to(component.parent)) for p in component.rglob('*') if p.is_file()],
    f"VN-Weather-HA-{version}-Marketplace.zip": [(p, p.relative_to(root)) for p in root.rglob('*') if p.is_file() and not any(part in skip for part in p.relative_to(root).parts)],
}
for name, entries in archives.items():
    path = output / name
    with ZipFile(path, 'w', ZIP_DEFLATED, compresslevel=8) as archive:
        for filename, arcname in entries:
            if not any(part in skip for part in filename.parts) and filename.suffix != '.pyc':
                archive.write(filename, str(arcname))
    with ZipFile(path) as archive:
        assert archive.testzip() is None
        files = archive.namelist()
        assert ('vn_weather_ha/manifest.json' if 'Manual' in name else 'custom_components/vn_weather_ha/manifest.json') in files
    print(f'{path}: {path.stat().st_size} bytes, {len(files)} files')
