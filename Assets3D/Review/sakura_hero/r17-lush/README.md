# AI Visual 16 — Sakura R17 / R17b focused correction

**Same [PR #18](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/18), same branch `assets/sakura-hero-r17-lush`.** [SA R2 #6032915176](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/18#pullrequestreview-6032915176) at reviewed HEAD `8381da2c19da01e8270f0f41283eabd5c4d16a46`; task AI Visual 16 §8 and Rules/Design14/27. Frozen R16 PR #1 `d9dbeb6a81d1e667d471b8f62910829bb1ce2bd9` and Viewer PR #17 `1201369e019f6ba04f7437c7dac347e56894ba2a`. Owner authorized one bounded R17b crown correction, **not final art GO**. No R18, no new PR, no runtime changes, no paid tool (0 VND).

## Previously reviewed R17 — frozen, actual owner evidence
| Profile | R16 tris | Reviewed R17 tris | R17 bytes | R16 / R17 vertex records | Owner SHA-256 |
|---|---:|---:|---:|---|---|
| QUALITY | 191288 | 220088 | 17851064 | 229235 / 659295 | `4115ba647eaa960e5fd2e9949462b52a2010231bf84ac25b574447bd36c5a73f` |
| ECO | 44412 | 49452 | 3854076 | 71032 / 147667 | `cc07824bef901d30ce833880ab835027d027f15ab26eb327e6b6d6bb46d2d679` |

Owner read-only audit [R17_READ_ONLY_AUDIT.json](R17_READ_ONLY_AUDIT.json) at reviewed HEAD: zero degenerate triangles; protected trunk/root/branch/gold triangle multiset exact at 0.1 mm quantization (ignores winding), imported PBR exact; .blend reopened 12 QUALITY/11 ECO meshes and 220088/49452 tris. Full Y-up XYZ bounds:
- QUALITY `[[-12.845271110534668,-0.5183812975883484,-12.69640827178955],[13.742024421691895,26.48044204711914,13.2966947555542]]`
- ECO `[[-12.92000675201416,-1.026049256324768,-12.026215553283691],[13.287308692932129,24.86863899230957,10.933910369873047]]`

Owner reopened `sakura_hero_r17_editable.blend` (31,319,198 bytes, SHA256 `8fadb16d1458f21fe95e63e00c2dc6a1feaba8aaa19e0d861b7fb2a44076beb9`). **Independent SA binary SHA/reopen still pending** (large binary connector inaccessible; no physical SA worktree). Original R16 .blend independent opening not done; 45/68 secondary contact proxy unchanged, not repaired.

Original 24 true 720×1280 Cycles PNGs and six accessible A/B JPEG sheets remain unmodified. SA R2 viewed all six: full/wide/top nearly same silhouette, under-crown/trunk identity preserved, QUALITY some richer close flowers, ECO still pale flat clumps; prior image-delta proxy low. **R17_LUSH_ART_CORRECTION_REQUIRED**, not final Art PASS. Original 24 image ledger, audit, sheets and binary hashes remain in root manifest.

## Measured cause of file size growth

| Logical accessor bytes | R16 QUALITY | R17 QUALITY | R16 ECO | R17 ECO |
|---|---:|---:|---:|---:|
| POSITION | 2750820 | 7911540 | 852384 | 1772004 |
| NORMAL | 0 | 7911540 | 0 | 1772004 |
| INDEX | 2295456 | 2013648 | 532944 | 296712 |

Vertex and normal arrays explain measured size increase (3.53x / 2.77x); split-normal/flat-shading cause is plausible, not a measured exporter experiment. No GPU verdict.

## New R17b — preview only
[Focused candidate README](r17b/README.md) describes 30 actual source-core-anchored clusters: 16 outer shoulders, 8 bridges, 6 selective lower skirts; preserve center opening and lower branch windows. ECO adjusts only original canopy/petal PBR factors, reduces emission wash and adds five-petal 3D flowers. QUALITY retains source palette and adds cupped flowers in depth layers. New direct GLB append pipeline preserves R16 original BIN bytes/indices/primitive/accessor/nodes and protected material JSON, appends indexed petal positions and calculated normals; no blanket normal removal. Design 236888 QUALITY/58212 ECO tris, under 250k/60k caps. Actual R17b results not generated in AI worker (no Blender). Preview generation will audit candidate GLB, calculate true bounds/byte counts and compare protected PBR.

**Do not run original `run_r17_blender.ps1` or prior read-only audit again.** Run `r17b/run_r17b_preview.ps1` only. 18 quick real Cycles images (3 views × 3 versions × 2 LODs), three compact A/B/C sheets, no final .blend or full resolution render in this step. SA/Owner review preview before proceeding. Final separate handoff uses same approved candidate SHA, final 6 views and actual editable source. No merge or integration; **STOP `R17_SA_ART_REVIEW_REQUIRED`**.
