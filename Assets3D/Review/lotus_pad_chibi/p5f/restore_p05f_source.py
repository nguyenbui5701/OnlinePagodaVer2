"""Restore the exact byte-pinned P0.5f sculpt from committed compressed source.

Usage from checkout:
    python Assets3D/Review/lotus_pad_chibi/p5f/restore_p05f_source.py --build

Build requires numpy, scipy. Does not modify the source GLB or the frozen lotus.
"""
from pathlib import Path
import argparse
import base64
import hashlib
import shutil
import subprocess
import sys
import tempfile
import zlib

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent
TARGET = "procedural_cross_seat_contact_p05f.py"
B64 = "P05F_CANONICAL_EXPORTER.zlib.b64"
EXPORTER_SHA = "d24495881eb52a53686d74a7c7ba9e213c025f5036e9c8aff189a8ce4706e3be"
OLD_SHA = "0829edde73666460c457267672e344a61443ee2c882319998d5b84a359f81367"
PAD_SHA = "80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9"
OUTPUT_SHA = "3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def require_input(path, expected):
    data = path.read_bytes()
    assert sha(data) == expected, ("original SHA mismatch", str(path), sha(data))
    return data


def run():
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", action="store_true", help="Rebuild in a clean temp folder and verify the real GLB SHA")
    a = ap.parse_args()
    compressed = base64.b64decode((HERE / B64).read_text().strip())
    source = zlib.decompress(compressed)
    assert len(source) == 9139 and sha(source) == EXPORTER_SHA, "source byte mismatch"
    original = HERE / TARGET
    if original.exists():
        assert original.read_bytes() == source, "existing plain exporter differs from canonical source"
    else:
        original.write_bytes(source)
    print("[P05F SOURCE EXACT SHA PASS]", original, EXPORTER_SHA)
    if not a.build:
        return
    old = require_input(ASSETS / "p5e" / "meditator_female_cross_prayer_p05e.glb", OLD_SHA)
    # Original frozen lotus is in p3; never overwrite it.
    pad = require_input(ASSETS / "p3" / "lotus_pad_01.glb", PAD_SHA)
    with tempfile.TemporaryDirectory(prefix="p05f-clean-rebuild-") as temp:
        p = Path(temp)
        (p / TARGET).write_bytes(source)
        (p / "meditator_female_cross_prayer_p05e.glb").write_bytes(old)
        (p / "lotus_pad_01.glb").write_bytes(pad)
        subprocess.run([sys.executable, str(p / TARGET)], cwd=str(p), check=True)
        output = (p / "meditator_female_cross_prayer_p05f.glb").read_bytes()
        assert len(output) == 574608 and sha(output) == OUTPUT_SHA, "p05f byte-exact rebuild FAILED"
    print("[P05F CLEAN GLB SHA PASS]", OUTPUT_SHA)


if __name__ == "__main__":
    run()
