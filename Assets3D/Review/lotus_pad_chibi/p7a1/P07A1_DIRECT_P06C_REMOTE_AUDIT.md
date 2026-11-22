# P0.7a1 — independent GitHub remote binary / geometry audit (2026-11-22)

**Scope:** immutable P0.6c baseline vs real P0.7a1 files **re-fetched from GitHub at** `20fa0b8b7b290b55aaee7f5e7a0475112764ccda`. This is a fresh remote byte comparison, not a copy of historic claimed PASS. SA's earlier P0.7a blocker was exclusively art legibility.

## Full remote binary rehash and contract comparison

| Check | Cross-legged | Kneeling |
|---|---|---|
| P0.6c input SHA256 | `c9d1513bad21398fd776776cad97791cfa76a591d641838f885596d13f120ea4` | `38e47f84b6b4f8987a47b39e791aaa06c3fed2d4d03e11e55fc72f0ef926c4ad` |
| P0.7a1 remote SHA256 | `ffdb92adf27d8fa14ee2a12dbca57cd71c888f1b9023019761940c460151c09e` | `56de649df89ba124e5a546fe6981cbffd80193a5b858e0d4ae8b1ab444c316b4` |
| Size | 590476 B | 456892 B |
| Real GLB2 / hair topology | PASS / 1672 vertices, 3080 triangles | PASS / 1672 vertices, 3080 triangles |
| Non-hair meshes byte-exact P0.6c→P0.7a1 | 9 / 9 | 8 / 8 |
| Non-hair raw primitive accessor arrays byte-exact | 27 / 27 | 24 / 24 |
| Animation input/output sampler arrays byte-exact | 4 / 4 | 4 / 4 |
| All native materials and six KHR variants JSON exact | PASS | PASS |
| All nodes/anchors JSON exact (except permitted hair name) | PASS | PASS |
| Eyebrow POSITION/NORMAL subranges byte-exact | PASS | PASS |
| Hair indices unchanged | PASS | PASS |

**Actual cross+kneel canonical new hair:** POSITION SHA256 `7adeaeec4ebd9737c9f0fdb2080a9b8597b6f28b5ab8a4d4720ca05830121083`; NORMAL `be215a24e25762a50c05a27064d14f3a291ac3d986dd735e90f6ad980acc76ca`; indices `b1f7c88b5d8845a12b2b595269d77403185c326c29a254fc45eb151e6d8a1483`. All three remote accessor hashes match between the two poses.

## Supplemental sampled geometric checks on P0.7a vs P0.7a1 cross (not full collision proof)

- New finite cap skin radial sample min clearance: **8.5 mm**; 841 cap rays, 91 low-side clamps. New sweep min: **7.5 mm**; 567 sweep rays, 10 clamps.
- Triangles: **3,080**; **0 degenerate old, 0 degenerate new; 0 face normal reversals**, max same-triangle face normal rotation **37.73°**.
- Fixed-camera sparse sample grid 27×29 (skin-hit projection restricted to upper head): front 128, top 541, right 3Q 122, left 108, right 108, back 92 = **1099 inspected skin-hit rays, 0 skin-first after refinement**, compared with old P0.7a 0 skin-first in same restricted sample. Sampling uses real exported GLB ray/triangle intersection; does NOT guarantee no surface holes between rays, scalp intersections under idle or ear/collar clipping.
- P0.7a1 relative to P0.7a: top crown +35.51 mm mean (367 cap vertices), temples -8.38 mm mean (77), nape -11.04 mm mean (55), all defined sample zones. P0.7a previously failed ART despite numeric changes; this larger revision remains aesthetically **UNJUDGED** until matched Cycles.

## Truthful gate

**PASS:** real remote GLB2 structure + SHA256 + frozen nonhair/anim/variants/anchors + canonical hair identity + finite sampled geometry.  
**NOT RUN:** genuine P0.7a1 Blender import/editable .blend, multi-angle Cycles A/B, actual 720×1280 lotus frames and five idle-times visual checks, full new ZIP CRC, independent physical checkout, GPU/LIVE.  
**NO OWNER GO / NO SA ART PASS.** Required owner runner: `README_WINDOWS.md` and `run_p07a1_blender.ps1 -Mode all -Samples 32 -Size 720`, followed by owner upload and SA review. Do not merge or begin side part 7/3/Codex/integration.
