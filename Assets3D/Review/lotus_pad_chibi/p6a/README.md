# P0.6a — Two male chibi prayer pose assets (REAL GLB)

**Scope:** Task [AI_VISUAL_10](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/main/Task/AI_VISUAL_10_MALE_CHIBI_PRAYER_P06A.md), owner-approved female cross P0.5f / kneel P0.5c, original frozen lotus P0.2. PR #2 branch `assets/lotus-pad-chibi-p0`. Baseline HEAD `e80ddc496df461728d3ee4cb6170ce2c3ff4fbfa`.

Produced actual GLB2 binaries from exact source SHA references:
- **Cross** `meditator_male_cross_prayer_p06a.glb`: **563688 B, SHA256 c684934ff2ceb8da08265fcc8304f2684255f144dc7df94819f007c5e803cb61**, 17420 triangles, 8902 vertices, 10 meshes, 21 materials.
- **Kneel** `meditator_male_kneel_prayer_p06a.glb`: **430104 B, SHA256 9aad5f3f4d1b84d0a9ffb2cda3bc01b39ece676318ba883e417f7337e9d2251e**, 17460 triangles, 8918 vertices, 9 meshes, 21 materials.

**New original male geometry**: replaced long hair mesh (1287v/2452tri) with real short groomed soft side-part with scalp and subtle brows (1105v/2120tri), no hidden long rear strands. Mild 70-vertex male jawline/cheek adjustment and 118-vertex shoulder tailoring change. Whole female-approved hands/fingers, trouser/feet/waist/pad contact, pose roots, animation data, and six native clothing color mappings unchanged. Same male hair, male upper-body edits for both poses. One geometry for six palettes.

**Generate again with zero-cost Node.js22:** Copy this `build_male_p06a.mjs` alongside checked original female GLBs; run `node build_male_p06a.mjs ..\p5f\meditator_female_cross_prayer_p05f.glb cross` and analogous `..\p5c\meditator_female_kneel_prayer_p05c.glb kneel`. Builder verifies female SHA256 and prints newly generated output SHA256; compare manifest. Never overwrite female original files.

**Gate:** True Blender Cycles male/female A/B, front/side/back hair detail, five idle stages, exact lotus pair renders, 9:16, editable .blend and original evidence ZIP are **NOT YET RUN / NOT CREATED** in this environment; do not claim art approval. Scripts and Windows instructions to follow in same PR #2. These two GLBs are preview candidates until SA+owner approve. No Codex/integration/merge/GPU/LIVE.
