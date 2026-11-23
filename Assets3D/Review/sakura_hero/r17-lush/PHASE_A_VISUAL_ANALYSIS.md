# P10B3C Phase A — R16 audit and R17 original canopy study

## Source truth (actual GitHub tree at PR #1 HEAD)
- PR #1 source `d9dbeb6a81d1e667d471b8f62910829bb1ce2bd9` matches Task §6 and is still open.
- R16 QUALITY `sakura_hero.glb` **5,055,232 bytes**, Git blob `c3ec8fc6004cb07ffaad1c7a49397d3ef5fe0aeb`, declared SHA256 `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c`, 191,288 tris, 11 materials.
- R16 ECO `sakura_hero_eco.glb` **1,393,492 bytes**, Git blob `5263987434d9c39af9738cf63e7bebf982cf8a32`, declared SHA256 `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`, 44,412 tris.
- Native R16 Blender source: `Blender_Evidence_R16/r16_final/sakura_hero_r16_quality.blend` **13,316,952 bytes**, Git blob `c52148f28d494cafb6b90a51d96c73957eb5f04c`; `eco_unchanged/sakura_hero_r16_eco.blend` **3,936,772 bytes**, Git blob `1cadfbbee8a5fcdbe263f40e8c11d0c27f6f2a26`. Both SHA-256 entries present in `Blender_Evidence_R16/FILE_HASHES_SHA256.txt`. **Neither .blend was decoded/opened independently in this worker.**
- Real `r16_final_report.json` documents **10 R16 QUALITY 32-sample Cycles** at Blender **4.5.16 LTS** and six actual camera/light controls; ECO report and 10 more PNGs also in GitHub. Historical R16 README/manifest incorrectly say R16 Cycles not run and binary upload pending; file presence and native evidence supersede those historical statuses. Do **not** amend R16 files in this task.
- `apps/v2-viewer/src/sakura-r16.json` from frozen Viewer PR #17 declares original quality Y bounds `[-.518381,26.480442]` m; ECO `[-1.026049,24.868639]` m. Actual R17 output must be measured, not inferred.
- R16 main forks joined: 20,920 triangles, single connected watertight wood SDF shell; **68** independent secondary branch material components remain. The 45/68 signed-distance crossing candidates are an inconclusive proxy, not exact collision.
- **Limitation:** GitHub connector couldn't decode/retrieve actual large R16 GLB2 binary bytes in the AI worker. No independent SHA256/GLB import performed here, no local Blender executable. Actual native owner SHA gate is a hard precondition to producing/claiming R17.

## Constrained R17 art hypotheses

| Concept direction | Scope | Benefit / risk | Decision |
|---|---|---|---|
| A — radial shell expansion | Duplicate whole canopy at enlarged radii | Larger silhouette, but pink opaque cloud and branch gaps lost | REJECT |
| B — actual face-sampled micro-florets | New cupped blossoms sampled from R16 real crown, depth offset, sparse spacing | True 3D lushness, preserve trunk/ribbon/gaps, controllable ECO/QUALITY | SELECTED FOR NATIVE TRY |
| C — high-emission color boost | Keep mesh, increase emissive factor | Color-only, no fuller geometry, neon risk | REJECT |

**Selected design B** is encoded in `author_r17_blender.py`, but awaits SHA-pinned R16 import and real Blender generation. QUALITY targets 1,200 small flowers × 24 tris; ECO 420 × 12 tris, with strict output caps 250k / 60k triangles. No artificial per-image image generation or pasted screenshot geometry. Matched 6-view Cycles (full 9:16, hero wide water-facing, high aerial rings, under crown, trunk/fork, crown close) on both input and output at identical three SUNs and AgX/None/EV0. Static native 720×1280 evidence is an art rig, not a recording of PR #17's moving Three.js routes; target physical GPU is not evaluated.

## Required next validation
1. SHA-check both actual original R16 GLB files before any writing; confirm glTF2 headers, binary lengths, triangles and actual source geometries.
2. Generate R17 ECO/QUALITY and editable .blend; parse **actual exports** for bounds/triangles/materials/texture and source contracts, scan no unexpected 0-byte artifacts.
3. Run genuine Blender Cycles 24 matched frames; compare outer crown silhouette, branch windows and gold, under-tree dark trunk, root contact and 9:16 crop with truthful visual reports.
4. Upload actual binary/evidence to this R17 branch, populate exact new hashes; SA reviews and Owner decides separately. No runtime changes.

**Phase result right now:** `R17_SOURCE_BINARY_ACCESS_BLOCKED_IN_AI_WORKER` / `R17_NATIVE_PRODUCTION_PENDING_OWNER`. Not R17 Art PASS.
