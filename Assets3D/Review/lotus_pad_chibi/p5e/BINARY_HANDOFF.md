# P0.5e binary / original source handoff with exact SHA checks

Branch `assets/lotus-pad-chibi-p0`, PR #2 Draft. New target directory: `Assets3D/Review/lotus_pad_chibi/p5e/`. **Never overwrite P05d, P05c, kneeling, lotus or Sakura.**

| Asset (new) | Size | SHA-256 | GitHub state |
|---|---:|---|---|
| `meditator_female_cross_prayer_p05e.glb` | 574048 bytes | `0829edde73666460c457267672e344a61443ee2c882319998d5b84a359f81367` | **pending_owner_upload** |
| `procedural_female_cross_foot_waist_p05e.py` | 11340 bytes | `18879f2a0bcc4e59d5299d6b196a3ce11c89d15dff3decb618bb35edba9b3ba1` | **SHA-pinned full readable source restored using committed `P05E_CANONICAL_SOURCE.zlib.b64` and `restore_p05e_source.py`** |
| `p05d_original_reference.py` | 7075 bytes | `ff6dd5e17efdcc7875b4ab080efb3ad369e4fc34a67cf6041b3d26a0600cb638` | **committed, Git blob `9cd65fbb4bc1a6e8b4978086d4789ac79103f6ea`** |
| `blender_p05e_cycles.py` | 12559 bytes | `e550cb14af65ed2b4e4e7a20f9200da563f2c7a96cef84d1d752e9e6c6238592` | **committed, Git blob `58075da43b0049d41d590254ffc06c39ef3ee155`** |
| `run_p05e_blender.ps1` | 5125 bytes | `c0b02af1fad92d6915db25500e1eafff1936979e528717046ad7acbc06f23bc7` | **committed, Git blob `c70f948d6797a59f49ad4fb3ae3fa5a6c2630a03`** |
| `PBR_Review/P05E_WAIST_LOW_SIDE_AB.jpg` | 117534 bytes | check from local PBR ZIP | **pending_owner_upload** |

Frozen P05d old GLB SHA256 `0f169e427cc70bc0b5b744db935c4de4ecac356ef3fc8a1113812a5bf0780e44` (471252 bytes) is on PR; frozen P05c kneel SHA `a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac`; frozen P02 lotus SHA `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`.

**Original new .blend/Cycles PNG/JSON/logs/ZIP do not exist yet**, status PENDING_OWNER_WINDOWS_RUN. Only after owner runs Blender can exact SHA/bytes/ZIP CRC be recorded. No false SHA invented. The source ZIP includes clean-rebuild-tested full generator, two GLB source binaries separately provided via GLB ZIP.

Owner uploads to the feature branch (NOT main), verifies `Get-FileHash -Algorithm SHA256`, git commits/pushes, and SA compares remote bytes before accepting binary. Exact target relative path is the table above. No merge.

## Additive source status after initial handoff

`P05E_CANONICAL_SOURCE.zlib.b64` 6181 B SHA `500ab925c8234fb470de03cd599857a674ba034c9e753fdad46dd9344ac65211`, and `restore_p05e_source.py` 2095 B SHA `1877322c7a5cb493cb0f45a1ad3596549325d27de09625ee4de4403407b8e929` are now **on GitHub**. Full plain 11340 B source is restored byte-exact (SHA `18879f2a0bcc4e59d5299d6b196a3ce11c89d15dff3decb618bb35edba9b3ba1`); isolated clean scratch build produced original 574048 B P05e GLB SHA. **New GLB still pending upload; actual P05e Cycles / .blend still awaiting Windows run**.
