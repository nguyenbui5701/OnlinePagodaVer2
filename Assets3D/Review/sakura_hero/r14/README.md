# Sakura Hero R14 — smooth collar + flower silhouette + medium 9:16

PR [#1](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1) · Branch `assets/sakura-hero-r04-sa-review`. **Draft, Sakura-only, zero-cost; NOT production approved.** Immutable R13 baseline, Cycles R13 independently owner/SA verified (3 cases, 18 images, 29 hashes). R13 source/model original not overwritten.

## Real geometry changes
- Old R13 bark had narrow **summed .34 radial collars** producing separate knuckles. R14 uses a **broad nonadditive .108 relief envelope** and a lighter .115 root/buttress fade; main branch necks exit the original S-shaped leader more gradually. Gold fissures remain recessed. Branch meshes **still intersect**: this is *not* a true watertight Boolean join.
- QUALITY flower uses the same 6 vertices and 4 real triangles per single-sheet petal, repositioned into a shorter blunt 3D cupped outer arc; same R13 warm lower-emission materials, no extra NORMAL arrays. Detached hanging clumps reduced 7→5. ECO GLB byte-identical.
- QUALITY R14 **181,314 triangles, 224,395 vertices, 11 meshes/materials, 4,877,460 B**. R13 **181,694 triangles / 224,909 vertices / 4,888,192 B**: minus 380 triangles, 514 vertices and 10,732 B (0.22%). ECO 44,412 triangles / 1,393,492 B, SHA unchanged.
- SHA256 QUALITY `ba3183c7b738dbd814b2b23cedc1f6da0470b13121882c116e1775154bda44f5`; ECO `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`. Source Git blob `f3f0374ca03f7bcf6ceb56f88b34fb01e4b2e1ad`.

## 9:16 composition
`camera_contract_R14.json` has full uncut (~65 m), **new medium at 48 m** along same direction/target and close overhead. All full-frame vertices fit. Medium intentionally cuts outer left/right crown (~1.23% vertices outside 9:16 NDC) for a larger central tree. FOV 50° for each; no GLB modification to fake camera fitting.

## Evidence
**Executed:** exact R13 regenerated from GitHub blob; both variants/OBJ rebuilt byte-identical; glTF PBR materials exactly equal R13, no zero-area triangles, native VTK 9.6 real-GLB PBR IBL plus three scene lights under matched top/under/trunk/3-4/full/medium/close cameras; owner-video 15/33s composites are only approximate camera references. **Not executed:** R14 Blender Cycles, native Three.js GLTFLoader, RTX 3050 Ti / 3060 FPS/VRAM with TikTok LIVE Studio.

## Windows test
Extract `Sakura_R14_Blender_Windows_Starter.zip` with three SHA-checked GLBs and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R14_blender.ps1 -Mode quick -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R14_blender.ps1 -Mode all -Samples 32 -Size 520
```

Full mode renders **3 cases × 7 real Cycles views**, fixed AgX, 0 EV, World 0.65 and SUN lights 2.1/1.05/.72; writes PNG/log/JSON/hash evidence and editable R14 QUALITY/ECO .blend. It **has not been executed in this environment**. Share evidence ZIP to SA before art acceptance.

Rebuild source with free Python and `numpy trimesh`, set `SAKURA_OUTPUT`, execute `procedural_sakura_source.py`. See `R14_VALIDATION.json`, `R14_VISUAL_GAP_ANALYSIS.md` and `BINARY_HANDOFF.md`.
