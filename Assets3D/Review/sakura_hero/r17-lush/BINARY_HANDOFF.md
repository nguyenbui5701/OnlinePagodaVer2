# Sakura R17 — SA follow-up / PR #18

Authoritative [SA review #6032823643](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/18#pullrequestreview-6032823643) at `36c9e327c37441a7c5406068f9aecd291e52d437`; task AI Visual 16 §7. Frozen PR #1 base `d9dbeb6a81d1e667d471b8f62910829bb1ce2bd9`; read-only PR #17 `1201369e019f6ba04f7437c7dac347e56894ba2a`. Same artist branch only, cost 0 VND.

**R17_NATIVE_BUILD_EVIDENCE_PASS / R17_ART_PARTIAL / R17_BINARY_SA_VERIFICATION_PENDING / MERGE_HOLD.** Owner final R17 Art GO PENDING. Git tree contains both GLBs, editable Blender and 24 native Cycles PNGs. Sizes match the owner build/PNG ledger; the SHA-256 values below are owner-reported, not independently decoded by SA. Metadata-only reconciliation and read-only evidence scripts; no geometry, renderer or original evidence changes.

## Frozen existing binaries — DO NOT re-export

| Artifact | Bytes | Owner SHA-256 | Git blob SHA |
|---|---:|---|---|
| `sakura_hero_r17.glb` | 17851064 | `4115ba647eaa960e5fd2e9949462b52a2010231bf84ac25b574447bd36c5a73f` | `8d9e45711d2677ab400436a459e8630ed8428a32` |
| `sakura_hero_r17_eco.glb` | 3854076 | `cc07824bef901d30ce833880ab835027d027f15ab26eb327e6b6d6bb46d2d679` | `e2de5ae499e9f369e3f3becc728d08fc13552cde` |
| `sakura_hero_r17_editable.blend` | 31319198 | `8fadb16d1458f21fe95e63e00c2dc6a1feaba8aaa19e0d861b7fb2a44076beb9` | `4f931ac7cff55393ab17cb48d5f152c01cc93787` |

| Profile | R16 triangles | R17 triangles | Added flowers | R17 meshes/materials | File size ratio |
|---|---:|---:|---:|---:|---:|
| QUALITY | 191288 | 220088 | 1200 | 12/15 | 3.53x |
| ECO | 44412 | 49452 | 420 | 11/14 | 2.77x |

Git tree verifies filenames, sizes and blob IDs. SHA-256 values above are from the owner-native report. Independent SA recomputation/opening is pending. All 24 original PNGs, their SHA-256/bytes, profile and camera are in `R17_Cycles_Evidence/cycles_manifest.json` (Git blob `c24cad83ef1e8dccb365a71992db69a7b39ea26e`). Build report Git blob `321a2291bb268bf4153d810732f88ebfd97da71f`; successful stdout `b1111f830c39d283d5b57749b33c56c1f940a11e`, 146982 bytes; stderr 0 bytes. No rerender required.

## Next handoff

- `R17_READ_ONLY_AUDIT.json`, `R17_audit_stdout.log`, `R17_audit_stderr.log`: run audit only, not generator. Compare R16/R17 full bounds, vertex/index/attribute bytes, protected geometry/PBR and actual .blend open. No unmeasured bounds filled in. Review degenerate triangles and signature mismatches before any PASS.
- `R17_Review_Sheets/`: six <1 MiB JPEG contact sheets and sheet_manifest.json from unchanged 24 source PNGs; script verifies each original SHA. Actual sheets not yet generated in this worker.
- For independent SA binary verification attach ZIP containing the exact R17 GLBs and .blend plus two original R16 GLBs (no need to rerender or resend all original PNGs). Include relative filenames; do not upload private data. Original R16 .blend opening remains unverified; supply those separately if specifically required.

See README for exact commands. No geometry/GLB/.blend changes allowed for these evidence-only corrections. Owner Art GO PENDING. **STOP `R17_SA_ART_REVIEW_REQUIRED`**; no merge.
