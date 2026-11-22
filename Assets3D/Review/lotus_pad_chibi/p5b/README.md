# AI Visual P0.5b — Female prayer-hands-only improvement

**Task:** [AI_VISUAL_05](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/main/Task/AI_VISUAL_05_FEMALE_PRAYER_HANDS_REFINEMENT.md). **PR #2 Draft**, branch `assets/lotus-pad-chibi-p0`; SA reviewed incoming HEAD `a3673005d2c262bb8577c43335747e62d6dbce96`, [SA review #6009630175](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6009630175). Original p5, p4, lotus and Sakura are frozen. **NO male, Codex, integration, GPU work or merge.**

## Surgical design
- Replace original disjoint cylindrical, squared-off fingers, palms and large thumb wedges with **per-hand continuous watertight SDF geometry**: 4 softly curved staggered fingers plus integrated small thumb, smooth palm and wrist, **two distinct hands** meeting with ~2.06 mm sampled surface-vertex gap.
- Preserve same complete arms' original 6-point paths. ONLY reduce final two ống áo cuff radii **.048→.046, .041→.036** to narrow the wrist/sleeve step; top mesh remains **1,666 triangles**.
- Full actual GLB reimport old vs new proves **7 of 9 geometry meshes have exact identical vertex & index arrays**: both knee/trouser poses, feet, hair, eyes, blush, front buttons and placket. The only changed mesh geometry: skin containing hands, and áo bà ba sleeve/top final cuff. Face vertices above 0.7 m identical.
- 21 PBR materials, both `KHR_materials_variants` six-color maps, `SeatRoot/UpperBodyBreath/HeadAnchor/NameplateAnchor/FXAnchor` and actual `sit_idle`+pose-specific 2-sec/17-keyframe animation samples unchanged.

## Independent results
| P0.5 vs P0.5b | Cross prayer | Kneel prayer |
|---|---:|---:|
| Original triangles | 13,262 | 14,190 |
| Refined triangles | **16,864** | **17,792** |
| Added triangles (hand skin only) | +3,602 | +3,602 |
| Original GLB bytes | 338,176 | 352,636 |
| Refined GLB bytes | **424,628** | **439,088** |
| New GLB SHA-256 | `81e8548cf6e46d9f5ff60c7bdf342ac1857015140e7d06d67dbd9284054137fd` | `533b84cba69332107ea25c57ed952b76c8276d4971a558496e4caf7aea400e9f` |

Both assets remain 9 mesh slots, 21 materials, 0 textures; **added local hand geometry has a measurable 25–27% total-triangle cost**. No GPU/100-avatar FPS can be claimed from this.

## Recovered original source, not screenshots
The owner's original `P05_FEMALE_PRAYER_SOURCE_REPORTS.zip` contains exact `procedural_female_prayer_p05.py` 10,597 bytes SHA `e6f7d06d3a3c78d055c6510d61d009a6bca877f03cd1c1323ee5602dcc633ad9` and `p04_source_frozen.py` 16,549 bytes SHA `b3b8b0c5bb1f9730c426f9e4b2ce1485e0f4df9b45adffcb9300ac92348f8ad2`. Unmodified original generator regenerated BOTH reviewed P05 GLBs byte-identically. P05b builder only overrides `praying_arm_and_sleeves`; exact new builder has been committed **byte-for-byte** at `p5b/procedural_female_hands_p05b.py` (Git blob `08ed3cec27d9989356804c0369fbdf53c693fc50`). The two original dependency scripts are included in owner source ZIP and must be uploaded with unchanged SHA before GitHub-alone reproduction.

## Real evidence vs pending
**EXECUTED**: native `trimesh` glTF re-import, exact original/new 7-mesh geometry and animation comparison, original P05 SHA-locked clean rebuild, VTK actual GLB PBR matching camera/light A/B front/side/left-right 3/4, torso, 9:16 medium/close, five original glTF idle samples each refined pose. **NOT RUN:** new Blender/Cycles and new editable .blend files, actual frozen lotus seated pairs and exact triangle collision; 2.06mm is **PROXY ONLY**. Free SHA-locked owner Windows Cycles package shipped in conversation.

**Handoff:** original new GLB/large media/source dependency owner ZIPs are `pending_owner_upload` to `p5b/` until real GitHub bytes are checked. See [BINARY_HANDOFF](BINARY_HANDOFF.md). SA → owner art gate **P05B_FEMALE_HAND_ART_OWNER_REVIEW_REQUIRED**. No self-approval or merge. External paid cost **0 VND**.
