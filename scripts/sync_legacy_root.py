#!/usr/bin/env python3
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

FILES = ["index.html", "404.html", "robots.txt", "sitemap.xml"]
DIRS = [
    "assets",
    "about",
    "authors",
    "blog",
    "cases",
    "contact",
    "journal",
    "pricing",
    "privacy",
    "services",
    "terms",
]


def assert_under_root(path: Path) -> None:
    path.resolve().relative_to(ROOT.resolve())


def replace_path(source: Path, target: Path) -> None:
    if not source.exists():
        return
    assert_under_root(target)
    if target.exists():
        if target.is_dir() and not target.is_symlink():
            shutil.rmtree(target)
        else:
            target.unlink()
    if source.is_dir():
        shutil.copytree(source, target)
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)


if not PUBLIC.exists():
    raise SystemExit(f"public output not found: {PUBLIC}")

for name in FILES:
    replace_path(PUBLIC / name, ROOT / name)

for name in DIRS:
    replace_path(PUBLIC / name, ROOT / name)

print("OK: synced legacy root output")
