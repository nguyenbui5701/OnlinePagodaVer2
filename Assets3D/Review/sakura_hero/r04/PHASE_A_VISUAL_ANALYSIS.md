# ONLINE PAGODA V2 — PHASE A / SAKURA STUDY R04

**Status: Prototype pending SA art review. This package contains actual editable polygon geometry and GLBs, not generated still images passed off as models. No repository files were modified.**

## Verified source materials

Read successfully through connected GitHub on `nguyenbui5701/OnlinePagodaVer2` default `main`:

- Design/01_VIDEO_BREAKDOWN.md
- Design/02_REQUIREMENTS.md
- Design/03_VISUAL_WORLD.md
- Design/04_CAMERA.md
- Design/10_GRAPHICS_PROFILES.md
- Design/11_3D_ASSET_PRODUCTION_PIPELINE.md
- Design/12_CORE_PRIORITIES_AND_AI_ROLES.md
- Design/13_3D_EVENT_INTEGRATION_CONTRACT.md

Inspected video `chuav2.mp4` directly: 720 x 1556, approx. 46.87 s, 29.96 fps. Video is an in-app phone recording with TikTok UI overlays: do not model the phone UI in GLB.

## Phase A: 6 visual checkpoints (observations, NOT assumptions about backend)

| Reference time | Visual interpretation | Asset implication |
|---|---|---|
| 3–5s | Low water-level shot, dark blue-violet water and seated round-headed avatars on green pads | Tree stays an actual 3D landmark in background, not a background card |
| 8–9s | Rows of small seated avatars; misty violet mountains and warm pink sky | Sakura cannot hide the midground cloud of meditators |
| 14–16s | Giant bright peach-pink canopy occupies much of aerial composition, ringlike sweeping lines of pads below | Crown needs broad top-readable volume, lobe variation, abundant blossoms |
| 18–20s | Still mostly aerial, leaves and center island seen below pink tree | Trunk and roots need real-world 3D occlusion and detailed branching |
| 33s | Camera extremely close to thick dark-purple trunk with warm golden glints in the ridges; glowing pink fog behind | Trunk should have strong silhouette / warm golden veins; under-canopy clearance |
| 40–42s | Seated chibi among floating pads and warm sparkling rim light | Tree and islands remain contextual, runtime sparkles are CODE-side |

Note on timeline: shot labels in docs refer to approximate cinematic segments; the actual frame at ~33s is a strong under-tree trunk shot. Source video has UI occlusions and cannot establish exact meters or scene coordinates.

## Phase A: layout hypothesis

The figure `scene_layout_topdown.png` is a proposed world-coordinate art map; **NOT a measured reconstruction**. Tree pivot (0,0,0) on small island. Suggested crown diameter 27–29 m and full height ~23 m. Lotus seats sweep in irregular arcs around the island out into the lake, without forcing a perfect circle. Distant pads represented more densely than nearby pads. Camera markers indicate visibility needs, NOT camera choreography implementation.

## Production plan / division of work

1. Tree prototype: physically 3D bark tubes, branch network, multiple cloud volumes consisting of many individually modeled five-petal cherry flowers, gold bark veins. Export both QUALITY and ECO GLBs. (DONE as prototype, not final fidelity).
2. SA review: silhouette under tree and top-down, bark thickness, canopy hue / density / openness, scene-meter scale and 4GB budget. (PENDING).
3. Revise inside Blender on owner's visual approval: smooth branch curvature, add high-quality bark normals / UV where helpful, correct two-sided petal shading and polish leaf cluster volume. Save `.blend`, re-export GLB, update manifest. (NOT DONE; Blender unavailable here).
4. Only after SA accepts the tree, proceed to `meditator_base`, lotus pads/flowers and island. Codex owns actual 3D renderer, GPU instance pools, atmospheric/fog, cinematic camera, TikTok events.

## Self-review against video

- **Geometry existence / multiple views: PASS (local GLB importer)**. 4 review renders came from imported `sakura_hero.glb` in headless VTK. Same mesh, four real camera poses.
- **Tree top silhouette: PARTIAL.** Broad crown reads from above, but actual reference is warmer, brighter, less uniform than this no-fog GLB viewer.
- **Under-tree bark: PARTIAL.** Root and branch network and veins exist; branch shape too stiff and edge glow too subtle. Petal interiors can read too dark with current PBR lighting.
- **GLB glTF 2.0 / scale / geometry: PASS as importable file.** See manifest measured counts and SHA256.
- **Blender `.blend` source and authoritative Three.js screenshot: NOT VERIFIED.** Source editable OBJ + reproducible Python script provided; Blender not present. A final Three.js viewer integration should be tested by SA/Codex, not claimed here.
- **ECO/QUALITY FPS with TikTok LIVE Studio: NOT TESTED.** GLB triangle budgets do not prove FPS.

## Tools and cost gate

Used no charged model endpoint: local original mesh construction with Python/trimesh, and VTK glTF import/render.
Read-only fal catalog confirms real mesh exporters: `meshy/v7.1/text-to-3d` supports model_glb and lists $0.80/generation, `fal-ai/hyper3d/rodin/v2.5/text-to-3d` lists $0.40/generation, and `hyper3d/lowpoly/text-to-3d` exposes `geometry_file_format=glb` with $0.40/unit (unit count may affect final charge). These are catalog rates, not a guaranteed final charge. No paid job was submitted. Image-to-3D/text-to-3D could be tried later with explicit owner approval of charge/limits.

## SA decision requested

**Decision: request visual revision, not ACCEPT FINAL.** Keep world layout hypothesis pending SA approval. Decide desired crown proportions, under-tree contrast, petal shade and branch design, and whether to authorize a paid AI 3D tool for a higher-fidelity sculpt to be retopologized in Blender.