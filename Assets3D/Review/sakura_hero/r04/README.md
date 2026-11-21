# Sakura Hero R04 — AI Visual review package

**Status: PROTOTYPE / NOT APPROVED.** Review only. No renderer or Event Engine changes; V1 untouched.

## Phase A and source

- `PHASE_A_VISUAL_ANALYSIS.md`: direct inspection of owner video `chuav2.mp4`, 6 golden views and layout assumptions, self-review and risks.
- `asset_manifest.json`: full measured geometry, coordinate system, material names, geometry checksums, budget and fidelity gaps.
- `procedural_sakura_source.py`: original procedural 3D geometry recipe to regenerate both GLBs.
- Original reference: `chuav2.mp4` from owner (not committed because of file size, rights/UI overlays, and to avoid duplicating owner video).
- Source agreement: Design/01, /02, /03, /04, /10, /11, /12 and /13; these remain on `main`.

## Geometry and handoff

`sakura_hero.glb` (QUALITY) is 7,968,912 bytes, 253,699 triangles, 8 mesh/material groups. SHA-256: `1f35bbc067e711d5b632b460a268f409df21774bc270b8a8fa5c3d9cef005751`.

`sakura_hero_eco.glb` (ECO) is 2,298,240 bytes, 74,177 triangles, 7 mesh/material groups. SHA-256: `c4d4a73281d9c1ce2b3256ffff29aeebc0b12a0f5da5883c6026e38bcdfb7e28`.

**Delivery limitation (IMPORTANT):** Neither of these .glb binaries nor the 20.8 MB editable OBJ nor local PNG preview files has been pushed to GitHub in this branch. The connection supports text GitHub writes but local GitHub push has no network route. The original prototype archive is delivered to the project owner separately in ChatGPT as `OnlinePagodaV2_SakuraHero_Prototype_R04.zip`. When owner/SA places the archive contents into this directory, verify the SHA-256 hashes above before asset approval. The current branch contains docs and procedural source ONLY.

## Reproduce the model on your own computer (no paid service)

Requirements: Python 3.10+ with `numpy` and `trimesh`.

```powershell
python -m pip install numpy trimesh
$env:SAKURA_OUTPUT = (Get-Location).Path
python procedural_sakura_source.py
```

This writes GLB QUALITY/ECO and `sakura_hero_editable.obj`. The reproduction method has not been independently executed on the owner's Windows environment. The source uses a fixed seed and is meant for inspection/iteration, not for claiming production fidelity. For clean material editing and optimization, import the GLB into Blender and create an editable `.blend`. No `.blend` source exists yet.

## Review checklist

- [ ] Compare aerial view at ~15s and dark trunk/under-tree at ~33s with same FOV, framing and lights
- [ ] Validate 3D geometry, textures/materials, and two-sided flower shading in Blender / Three.js
- [ ] Check crown silhouette and density, root shape, trunk taper, curves, warm highlights
- [ ] Approve or revise proposed 27.6 m crown span and 23.0 m height
- [ ] Evaluate if topology/material grouping/LOD strategy works for 3050 Ti ECO and 3060 QUALITY
- [ ] Resolve `.blend` absence and ship GLBs via a proper binary route before Codex integration
- [ ] Run live-performance benchmark with TikTok LIVE Studio; don't infer FPS from triangle counts
- [ ] Mark SA review decision (ACCEPT PROTOTYPE FOR ITERATION / REQUEST CHANGES / REJECT). **Do not approve final runtime asset from this PR alone.**

## Collaboration rule

SA reviews this Draft PR and comments. AI Visual checks review comments when explicitly asked in chat, revises this branch's own asset documentation/source and replies. Codex must not integrate as a production asset until SA reviews the GLB bytes and declares the exact approved revision/checksum.
