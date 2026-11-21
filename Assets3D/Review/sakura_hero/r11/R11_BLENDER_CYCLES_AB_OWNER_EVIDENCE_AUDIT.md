# Sakura Hero R11 — owner-executed Blender Cycles A/B evidence audit (2026-11-21)

**Decision:** Independent owner-run Blender/Cycles **import and rendering PASS** for both QUALITY and ECO. A/B **material color diagnosis substantiated** under the specified rig. **Final artistic quality NOT APPROVED**; native Three.js GLTFLoader and owner GPU+LIVE Studio tests remain OPEN. PR #1 remains Draft, Sakura tree ONLY, zero-cost.

## Original owner uploads received and verified

- Owner archive: `Sakura_R11_Blender_Evidence_AB.zip` (SHA-256 `91b0bb74a4b5c867982f44ae5529502af4366646b7061c33c1c8926b7ef689c8`). `zipfile.testzip() = None` (no corrupt members).
- **51 members** in ZIP: **22 actual Cycles PNG, 9 JSON reports, 18 stdout/stderr logs**, Blender version text and `FILE_HASHES_SHA256.txt`.
- **50/50 files physically present in ZIP** matched the corresponding hashes in the owner's SHA list; **22/22 PNGs** also matched *byte size and SHA-256* in their respective JSON reports. The SHA list additionally refers to 36 files not in this ZIP (including separate `.blend`, optional `.blend1`, and duplicated `SEND_TO_AI_VISUAL` paths); do NOT claim all 86 hash-list entries were checked.
- All nine stdout logs contain `[R11_CYCLES_COMPLETED]` for their case; **all nine stderr logs are empty**.
- Owner's **original standalone editable** `sakura_hero_r11_quality.blend`: **15,303,787 bytes**, SHA-256 **`f5f871d1c2b6c8cab7d687f844c3eed021c60d66f0e94fe497a5c9ad839451ea`**, exactly matches `r11_final_report.json`.
- Original `sakura_hero_r11_eco.blend`: **3,936,772 bytes**, SHA-256 **`71a8c3b9346c008bbce383eef2daaebdf7d3139d6cab518cac2f0ca918c68edb`**, exactly matches `eco_report.json`.
- Both files have header `BLENDER-v405` (64-bit little-endian) and were successfully parsed **block-by-block** to final `DNA1` and `ENDB` with **zero trailing bytes / invalid block lengths**. QUALITY 11 mesh blocks / 16 object blocks, ECO 10 mesh / 15 objects; each has 3 lights, one camera and one world. This is a structural check, **not a fresh Blender re-open/re-render**.

## Recorded Blender test contract and original GLB identities

All nine cases: **Blender 4.5.16 LTS**, **Cycles CPU**, **32 samples**, **520×603**, corrected glTF +Y-up → Blender +Z-up camera axes, **exposure 0 EV**, and imported Principled BSDF materials without Phong override. Main A/B: **AgX** view transform, World strength `0.65`, KEY/RIM/UNDERFILL Sun energies `2.10/1.05/0.72`. R10 Standard case modifies only view transform. `r10_light75` uses World `0.4875`, Sun energies `1.575/0.7875/0.54`. Comparison must stay **within Cycles**, not numerical VTK/IBL cross-engine equivalence.

- **R10 baseline QUALITY** input GLB `ac4322fb00475d0dde3334a375fca0e0094715583edf7f6460b30a9139b1e273`; **188,782 triangles**, 11 mesh groups.
- **R11 final QUALITY** input GLB `584d95eb9467c8342d018a4a0331f8205b20f042325ef82b56d1bd8daddab375`; **188,782 triangles**, 11 mesh groups, 7,599,884 bytes.
- **R11 ECO** input GLB `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`; **44,412 triangles**, 10 mesh groups, byte-identical to prior ECO revision.

## Executed A/B cases — evidence and interpretation

| Case | Rendered camera views | Interpretation |
|---|---|---|
| `r10_baseline` | top, under, 3/4, trunk | Soft but pale/washed pink under stated Cycles rig |
| `r10_emissive_only` | top, under | Lower emission alone substantially restores rose contrast; consistent with emissive contributing to washout |
| `r10_albedo_only` | top, under | Darker base color alone gives smaller but visible color separation |
| `r10_palette_only` (both material changes) | top, under | Much richer pink; no change to petal geometry/camera/light |
| `r11_geometry_only` | top, under | Very close in color to R10; geometry/normals alone do not fix washout |
| `r11_final` | top, under, 3/4, trunk | Richer rose color; flower sheets remain large/hard-edged, **not yet convincing as soft blossom mass** |
| `eco` | top, under, 3/4, trunk | Original ECO stable; angular flower tiles and exposed branch silhouette persist |
| `r10_standard` | top | Standard tonemapping causes bright pink/whites to approach clipping; NOT the preferred fix |
| `r10_light75` | top | 25% reduction of world+sun yields only modest color change; not the dominant fix |

**Optional pixel heuristic**, fixed rectangular ROI (`x=85:435,y=105:405`) in the same 520×603 top screenshots, average per-pixel HSV saturation (contains some scene/background, **not** physically calibrated reflectance): baseline `0.129`; emissive-only `0.186`; albedo-only `0.155`; palette-only `0.232`; geometry-only `0.129`; R11 final `0.233`. This supports materials as the dominant source of improvement, not added normals. Standard's top ROI has ≈83% pixels satisfying RGB thresholds `R>.88,G>.83,B>.80`; an informal near-white indicator, **not a HDR clip measurement**.

## Actual visual quality blocker (not a blanket PASS)

- **QUALITY top:** R11 rose/peach layers are more readable but many broad flowers now read as discrete flat paper-like polygon tiles. Serration/edge faceting still apparent, not yet matched to soft reference ~15s.
- **QUALITY under:** pointed mechanical branch forks and spaced dangling flower clusters still distract. R11 shifts material shading but does not change ancient multi-leader branch topology substantially.
- **QUALITY trunk (~33s):** embedded gold is retained, but R10 vs R11 framing shows near-identical shaft profile and root/branch joints; bark detail change is incremental, **not decisive old-growth sculpt**.
- **ECO:** byte-identical stable carry-forward; no basis to increase geometry unless specific camera blocker demonstrated.
- **QUALITY size/bandwidth:** native flower NORMAL addition raised GLB size from **5,096,052 to 7,599,884 bytes** (+49.13%) with no triangle increase. Blender images do not yet justify that asset cost. Consider targeted normal/silhouette strategy or quantization/compression only after native glTF parity and artist A/B.

## Status / provenance

Owner supplies the 2 exact `.blend` files **separately** and SHA-256 was computed on their bytes; `.blend` and the 22 PNGs **have not been uploaded by this auditor to the GitHub PR branch**. This textual audit does NOT claim binary delivery or change the R11 `pending_owner_upload` metadata. See owner's evidence ZIP for raw PNG/log/JSON; full image montage prepared for owner review only.

**PASS:** owner-run Blender Cycles execution, original GLB SHA and Principled material import, 9 controlled A/B cases, 22 actual PNGs, 2 editable .blend checksums/structure.

**OPEN:** SA artistic approval; imported native Three.js glTF PBR behavior, VRAM/FPS on 3050 Ti / 3060 + TikTok LIVE Studio, repo binary uploads. PR remains Draft; no merge/production sign-off.
