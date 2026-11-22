# P0.5f independently reproducible original-source audit — 2026-11-22

Exact original binary source scripts were uploaded to the **existing PR #2 p5f/** as **zlib+base64 UTF-8-text Git blobs**, avoiding source corruption by web editor newline handling. Every blob's SHA-1 was fetched back and compared **byte-for-byte** with the actual locally executed original compressed script. No source code was guessed or regenerated from screenshots.

| Committed source blob | Verified Git SHA-1 | Restores to file | Original SHA256 | Bytes |
|---|---|---|---|---:|
| `P05F_CANONICAL_EXPORTER.zlib.b64` | `7ebf05122b3892a1e8805e97dbca76eb1771682a` | `procedural_cross_seat_contact_p05f.py` | `d24495881eb52a53686d74a7c7ba9e213c025f5036e9c8aff189a8ce4706e3be` | 9139 |
| `P05F_CANONICAL_BLENDER.zlib.b64` | `2c3b9bdfdb1dd1124de27d2aeef66e65134c3f44` | `blender_p05f_cycles.py` | `4108ea357d2e49c93691836c8087c92ba4dd440da500eb83a5151ba91f8ff4e6` | 12227 |
| `P05F_CANONICAL_WINDOWS_RUNNER.zlib.b64` | `5f7867700571130ae4e209ff3c37a21315484ed0` | `run_p05f_blender.ps1` | `b85aed648be63e97663abfb382feae3943a4924a31957e62774e36c3291c3838` | 5253 |
| `P05F_CANONICAL_VALIDATOR.zlib.b64` | `5cd54c42f92a2264be99bf792a9ca4c218755871` | `validate_p05f_independent.py` | `6f953431ec30768dd2b2125c0c5e9f82c92fe6bf6e13b5995e905433a052de35` | 4759 |

**Restore all in one command** from a fresh PR #2 checkout:

```powershell
py Assets3D/Review/lotus_pad_chibi/p5f/restore_p05f_toolchain.py
```

The restorer verifies the exact decompressed SHA-256 **before** creating the plain source files; if a non-identical plain source already exists it refuses to overwrite. Then reproducibly rebuild the GLB **in an isolated temporary directory** from original immutable checked-out source binary paths:

```powershell
py -m pip install numpy scipy trimesh
py Assets3D/Review/lotus_pad_chibi/p5f/restore_p05f_source.py --build
```

The `--build` verifier reads the **original** `p5e/meditator_female_cross_prayer_p05e.glb` and `p3/lotus_pad_01.glb`, pins their real SHA256, rebuilds in a temporary folder without modifying any tracked baseline, and checks output exactly 574608 bytes / SHA256 `3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4`. The same byte-exact clean scratch reconstruction was already executed in local AI container from original GLBs. Source **Git blob verification PASS**, clean build from actual local original GLBs **PASS**, checkout build via GitHub using new restorer is now ready **but not separately run inside a physical owner Git checkout**.

**This does not create Blender `.blend` or true Cycles**; they remain `PENDING_OWNER_RUN`. The owner can use the downloadable Windows ZIP (all three real GLBs included) or restore Blender/PS from branch and copy the baseline input GLBs into runner-specific subfolders. Keep old p5e/ and kneeling untouched. PR still Draft, no merge or Codex.
