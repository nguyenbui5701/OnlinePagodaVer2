# P0.5f exact binary and source handoff — PR #2 Draft

**Do not overwrite p5e/ or p5c/**. Target new revision `Assets3D/Review/lotus_pad_chibi/p5f/`. Owner may upload exact local payload from ChatGPT ZIP after SHA check.

| File | Bytes | SHA256 | GitHub status |
|---|---:|---|---|
| `meditator_female_cross_prayer_p05f.glb` | 574608 | `3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4` | **PENDING_OWNER_UPLOAD** |
| `procedural_cross_seat_contact_p05f.py` | 9139 | `d24495881eb52a53686d74a7c7ba9e213c025f5036e9c8aff189a8ce4706e3be` | see source entry / owner ZIP |
| `blender_p05f_cycles.py` | 12227 | `4108ea357d2e49c93691836c8087c92ba4dd440da500eb83a5151ba91f8ff4e6` | source ZIP / pending owner upload if not committed |
| `run_p05f_blender.ps1` | 5253 | `b85aed648be63e97663abfb382feae3943a4924a31957e62774e36c3291c3838` | source ZIP / pending owner upload if not committed |
| `validate_p05f_independent.py` | 4759 | `6f953431ec30768dd2b2125c0c5e9f82c92fe6bf6e13b5995e905433a052de35` | source ZIP / pending owner upload if not committed |
| `p05e_baseline/meditator_female_cross_prayer_p05e.glb` | 574048 | `0829edde73666460c457267672e344a61443ee2c882319998d5b84a359f81367` | original already on PR under `p5e/` |
| `p02_baseline/lotus_pad_01.glb` | 262108 | `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9` | original P0.2, unchanged |

**True owner Blender/PNG source:** `P05F_Cycles_Evidence/p05f_cross_actor/*.blend` and `.../p05f_cross_pair/*.blend` / original PNG files / `P05F_FEMALE_SEAT_Blender_Cycles_Evidence.zip` **do not exist yet** in this AI run. No fake SHA/bytes. Owner must run the free Windows Blender starter and upload real outputs, then SA independently checks original SHA, ZIP CRC and image comparisons. Only then P0.5f Cycles gate can pass.

All old raw GLB, leaf, image references must be SHA-pinned; do NOT move the global SeatRoot or change runtime offsets. No male/Codex/integration/merge.

**Source-status update (2026-11-22):** The four **exact original source files** (exporter, Blender Python, PowerShell, validator) have now been uploaded as separately versioned compressed UTF-8 Git blobs `P05F_CANONICAL_*.zlib.b64`, with Git SHA-1 verified against the original local source compression, plus `restore_p05f_toolchain.py` and `restore_p05f_source.py`. See `P05F_SOURCE_REMOTE_AUDIT.md`. Only the **new runtime GLB and actually executed Cycles/Blend binaries** remain pending owner upload/run. Historical table statuses for plain Python/PS are superseded by this update.
