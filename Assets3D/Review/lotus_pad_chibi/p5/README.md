# AI Visual P0.5 — Female Prayer Poses (cross-legged + kneeling)

**Task:** [AI_VISUAL_04_FEMALE_PRAYER_POSES](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/main/Task/AI_VISUAL_04_FEMALE_PRAYER_POSES.md). **Baseline HEAD:** `6894dcdd60e5c03a638824950419015e7634fe00`. Branch `assets/lotus-pad-chibi-p0`, PR #2 DRAFT. This is strictly a new female-only `p5/` revision. Do not touch original P0.4/P0.3/P0.2 pad/Sakura, build male, run Codex or merge.

**A: cross_prayer.** Rebuilt two separately readable continuous folded trouser legs using smooth Catmull-Rom variable-radius sweeps. Left and right knees have rounded volumes, tapered/tucked feet; only new lower-body geometry was moved downward 44 mm for leaf support, while SeatRoot and all actor anchors remain unchanged. Both open hands now rise to chest and form the Buddhist prayer gesture, with distinct left/right palms/fingers/thumbs, curved fabric sleeves, relaxed elbows.

**B: kneel_prayer.** Both knees forward toward support; calves/shins fold back and feet tuck behind the body; still upright, hands together at chest, hair and face identical to A. Front, side and back native GLB images show an independently recognizable kneel.

**P0.4 untouched:** actual owner-provided P0.4 original GLB SHA `586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09` and original authored source SHA `b3b8b0c5bb1f9730c426f9e4b2ce1485e0f4df9b45adffcb9300ac92348f8ad2` validated locally. Five specific mesh vertex/face arrays are identical across baseline and both poses: hair, eyes, blush, áo bà ba buttons and placket; only legs/pants, feet, sleeves/top and hands/skin are changed. Unchanged original six KHR_materials_variants mappings on two outfit primitive slots; **no six-color duplicate geometry**.

| Verified exported asset | Tris | Verts | Meshes | Materials | Bytes | SHA256 |
|---|---:|---:|---:|---:|---:|---|
| Cross `meditator_female_cross_prayer_p05.glb` | 13,262 | 6,855 | 9 | 21 | 338,176 | `981ecf0b83378ce3fca7cd49db9473baac43238af3b5ee2fa857024ff66b57fd` |
| Kneel `meditator_female_kneel_prayer_p05.glb` | 14,190 | 7,319 | 9 | 21 | 352,636 | `04a1d0e03e5186085118dd06d158dbba43e7180843895ed1661a03529040785e` |
| Original P0.4 frozen actor | 9,718 | 5,063 | 9 | 21 | 244,348 | `586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09` |

**Animation:** both P0.5 GLBs retain `sit_idle` (2 sec/17 keyframes targeting `UpperBodyBreath`) with byte-exact original time and vector arrays, plus `cross_prayer_idle` / `kneel_prayer_idle` clip aliases using the identical animation samples. There is no armature, IK or physical cloth/hair animation. Local anchors identical: SeatRoot [0,0,0], HeadAnchor [0,.835,.04], NameplateAnchor [0,1.335,.03], FXAnchor [.37,.805,.16], glTF +Y up/+Z facing.

**Actual evidence executed:** independently re-imported 3 actor GLBs, rebuilt both from frozen P0.4 source in a separate clean directory and compared binary byte-for-byte, checked real glTF2 geometry/material/animation/anchors; VTK GLTF PBR actor A/B fixed rig front, both sides, back, 3/4, hand and knee closeups, 9:16 FULL/MEDIUM/CLOSE actor-only, 5 times x front/right/back per pose, 6-material swatch sheet per pose. These are real 3D imported GLB images **NOT Blender Cycles**. P0.2 leaf **not actually imported locally**; a recreated formula was used for seat contact proxies only (cross min ~0.020 mm, kneel min ~1.467 mm, no sampled vertex deeper than 5 mm, BUT not imported leaf triangulated contact). Hair/garment collision only vertex-proximity proxy. Exact triangle collision open.

**Unexecuted owner gates:** same-camera original P0.4 vs P0.5 actor+frozen lotus Blender Cycles, four new editable .blend files, per-image PNG SHA proof, native Three.js/GPU. Owner Windows starter includes source Blender script, SHA-locked original P0.4 actor and two P0.5 GLBs; copy exact frozen leaf from `p3/` then run quick/all. Full source, GLB, PBR and setup ZIPs are provided for owner upload; their remote GitHub status is `pending_owner_upload` until checked. See `BINARY_HANDOFF.md` and `README_WINDOWS.md`.

**Gate:** `P05_FEMALE_POSE_OWNER_VISUAL_REVIEW_REQUIRED`. SA must review real Cycles A/B; owner must explicitly approve **BOTH female poses** before any male task. No Codex/integration, no PR merge. Zero paid external services (0 VND).
