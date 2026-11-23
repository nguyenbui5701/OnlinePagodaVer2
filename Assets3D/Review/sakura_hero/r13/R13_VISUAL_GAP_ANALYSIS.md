> **Post-execution status (2026-11-21):** SA independently verified owner R13 Blender/Cycles **3/3 cases and 18/18 PNGs PASS**, plus two original `.blend` files and 29/29 archived SHA checks. **ART PARTIAL; production NOT APPROVED**; GitHub large binaries remain `pending_owner_upload`. This supersedes the historical pre-run checklist below. See [R13_BLENDER_CYCLES_OWNER_EVIDENCE_AUDIT.md](R13_BLENDER_CYCLES_OWNER_EVIDENCE_AUDIT.md).

# R13 vs R12 visual gap — controlled Sakura-only technical review

## What genuinely changed

- Stronger trunk silhouette: R13 uses an S-swept core, thicker organic branch shoulders and asymmetric root collars. Bark wood-grain is a radial displacement of the same trunk mesh (not shading paint); gold remains within carved troughs. A/B VTK under/trunk/3-4 images visibly change shape. However small branches **still intersect** the trunk rather than form a true watertight Boolean manifold; no final old-growth sculpt approval.
- Crown: R12 rose/peach albedo plus low emission unchanged. R13 alters 6-point petal silhouette only, **four triangles unchanged per petal**, no explicit NORMAL. It decreases isolated dangling blossoms (11 groups to 7) so total polygon count shrinks. Some flat sheets and a speckled profile persist.
- ECO identical R12 checksum; its old angular petals/exposed branches remain a known LOD compromise.

## Actual 9:16 camera comparison

`hero_full_9x16`: single 50° vertical FOV camera calculated from both real GLBs, entire crown + roots within NDC ±0.86 at width:height 9:16. Fits all 226,267 R12 and 224,909 R13 vertices. Source geometry is not modified or camera-specific optimized. In a 9:16 frame the full wide tree occupies less vertical space than a close crop, as expected from its physical aspect ratio. `hero_close_9x16` deliberately reuses R12 top shot and crops part of the canopy. Same VTK lights and render settings R12/R13.

## Proof boundary

**Executed**: actual GLB/trimesh structural checks and zero-face/nonfinite tests, exact clean rebuild, VTK native glTF PBR on fixed 3 lights + synthetic IBL and same camera/FOV; no Phong material override. **Previously executed/SA-reviewed**: R12 Blender 4-case Cycles with 20 PNGs. **NOT YET RUN**: R13 Blender/Cycles fixed-rig A/B (script included); native Three.js, RTX GPU/LIVE Studio. Comparison to owner video ~15s and ~33s uses non-calibrated camera; these screenshots do not prove production fidelity. **ART PARTIAL.**

## Next SA acceptance questions

1. Does real Cycles show a substantially more organic trunk/fork profile at trunk 33s and underside than R12, without dislodging inset gold?
2. Do R13 petals look smoother at medium and close distance across top/under/3-4, not simply smaller?
3. Does `hero_full_9x16` keep all crown lobes visible under Cycles at the fixed camera, while `hero_close_9x16` gives intentional detail cropping?
4. Validate native Three.js and RTX 3050 Ti/3060 in LIVE Studio separately; no inference from Blender CPU rendering.
