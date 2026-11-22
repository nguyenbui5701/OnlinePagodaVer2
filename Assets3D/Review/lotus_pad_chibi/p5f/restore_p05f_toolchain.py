"""Restore exact production source, Blender Cycles script, PowerShell and validator from
SHA-locked original compressed blobs committed on PR #2. Stdlib only.

Run:
    python restore_p05f_toolchain.py
    python restore_p05f_source.py --build
Blender original owner Windows runner:
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_p05f_blender.ps1 -Mode all -Samples 32 -Size 520
"""
from pathlib import Path
import base64
import hashlib
import zlib

ROOT = Path(__file__).resolve().parent
FILES = [
    ("P05F_CANONICAL_EXPORTER.zlib.b64", "procedural_cross_seat_contact_p05f.py",
     9139, "d24495881eb52a53686d74a7c7ba9e213c025f5036e9c8aff189a8ce4706e3be"),
    ("P05F_CANONICAL_BLENDER.zlib.b64", "blender_p05f_cycles.py",
     12227, "4108ea357d2e49c93691836c8087c92ba4dd440da500eb83a5151ba91f8ff4e6"),
    ("P05F_CANONICAL_WINDOWS_RUNNER.zlib.b64", "run_p05f_blender.ps1",
     5253, "b85aed648be63e97663abfb382feae3943a4924a31957e62774e36c3291c3838"),
    ("P05F_CANONICAL_VALIDATOR.zlib.b64", "validate_p05f_independent.py",
     4759, "6f953431ec30768dd2b2125c0c5e9f82c92fe6bf6e13b5995e905433a052de35"),
]
for encoded, filename, size, expected in FILES:
    src = ROOT / encoded
    if not src.is_file():
        raise FileNotFoundError("Missing original compressed source: " + str(src))
    exact = zlib.decompress(base64.b64decode(src.read_text().strip()))
    digest = hashlib.sha256(exact).hexdigest()
    assert len(exact) == size and digest == expected, (
        filename, "Original bytes/sha mismatch", len(exact), digest
    )
    out = ROOT / filename
    if out.exists():
        assert out.read_bytes() == exact, (
            filename, "Preexisting file is NOT exact; refusal to overwrite"
        )
    else:
        out.write_bytes(exact)
    print("[P05F CANONICAL SOURCE PASS]", filename, len(exact), digest)
print("All original P0.5f source files restored, no actor or lotus modified.")
