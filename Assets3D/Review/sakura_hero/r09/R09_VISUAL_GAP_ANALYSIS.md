# R09 — SA R08 visual-gap response and five-angle ECO audit

Source: formal SA R08 review, PR #1 at `4a4c150d1a660b63322fcfbec12cdbe2ad2b78ab`, 2026-11-20, and four inline comments on `r08/procedural_sakura_source.py` and `r08/PBR_LIGHTING_CONTRACT.md`.

| R08 issue | R09 action | Actual evidence and disposition |
|---|---|---|
| ECO one-camera patch risk | Kept R08 optimized recessed cores (0.57), existing five bridges plus two tiny patch regions. Did NOT insert more ECO blossom regions. Audited **5** 50° perspective aerial views for ECO under same PBR lighting for R08/R09 | `PBR_Review/R08_R09_ECO_5_AERIAL_PBR.jpg` and paired PNGs (`top`, `aerial_e/w/n/s`). No obviously new huge dark aperture. Small seams persist: **CONDITIONAL PASS at five sampled cameras, not every aerial angle**. |
| QUALITY round lobe repetition and triangular petal facets | Sculpted multilayer anisotropic canopy: 94 overlap groups, varying local XZ rotations, Y tiers and radial warp; sheet has two-lobed/notched curved tips with four triangles per petal (one-sided geometry, `doubleSided` PBR) | `R08_R09_QUALITY_top.jpg`, `R08_R09_QUALITY_three_quarter.jpg`, `VIDEO_15s_R08_R09_QUALITY.jpg`. Significant silhouette difference; some outer spikes and flat facets remain. **BETTER BUT NOT FINAL**. |
| Thick old trunk and lower horizontal bright wire | Continuous fluted helical leader mesh and real recessed radial grooves, narrow tapered gold strips at groove floor; no horizontal thick tube overlays; gnarled offset root contours | `R08_R09_QUALITY_trunk_33s.jpg`, `VIDEO_33s_R08_R09_TRUNK.jpg`. Clean horizontal zigzags near base substantially reduced; bark still procedural, needs Blender sculpt/normal tuning. **PARTIAL**. |
| Require independent GLB/PBR lookdev | Delivered `blender_import_validate.py` (Blender Cycles CPU, material nodes unchanged, 3 named Sun lights, World sky, saved `.blend`, JSON report and renders). | Script authored + normal Python syntax compiled, **NOT RUN IN BLENDER**; Blender unavailable in current AI container, no screenshot or `.blend` claimed. **OPEN** until owner executes/SA inspects. |
| Geometry and PBR costs | Counted real GLB triangles, vertices, material, bounding boxes and SHA; preserved ECO single-sheet petals; QUALITY 4 triangles/petal for improved shape | R09 QUALITY 185,026 (+16.36% vs R08), ECO 44,412 (+1.41% vs R08). No FPS estimates. All GLB/OBJ/image files require owner upload. |

## Visual limits and camera comparability

- R08 and R09 comparisons use the **same VTK native PBR rig** and exactly identical cameras/lighting. Different GLB geometry and materials are loaded without Phong overrides. Photometric equivalence to Blender/Three.js is **unverified**.
- Reference frames (~15s pink aerial and ~33s thick trunk) come from owner footage. Camera focal length, fog and scene lights are unknown, so source-vs-model is art-direction evidence, **not pixel-perfect calibrated**.
- At close distance QUALITY still looks stylized; flower silhouette is less round but outer edge sometimes spiky, and fine bark microrelief is limited. A realistic old sakura may need real Blender sculpt and material normals/roughness tuning after owner-run inspection.
- Zero-cost original geometry only, no third-party downloaded texture. No V1 changes or Codex runtime work.

**SA decision requested:** prototype visual review of R09 QUALITY+ECO and owner-run Blender checkpoint; **not production approval**. Keep PR Draft.
