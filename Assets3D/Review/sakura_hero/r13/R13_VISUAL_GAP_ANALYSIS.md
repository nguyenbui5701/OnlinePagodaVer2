# R13 vs R12 Sakura-only art comparison

## SA requirements and model changes
- R12 Cycles and original .blend SHA passed independent SA checks in review #6004186709. R12 rose color and compactness are retained.
- R13 main old-growth shaft is physically bent more; actual trunk-ring radial bark displacement adds long twisted grain and anisotropic bulges at 11 primary branch origins. Roots are shaped with thicker origin collars and altered curves/taper, and main branches exit more slowly from a hidden centerline. Gold is still a tiny inset strip in bark grooves.
- **Known geometric limitation:** branch/secondary tubes still geometrically intersect rather than a fully remeshed/watertight union; this must remain an ART open issue. Do not describe it as a fully Boolean-welded trunk.
- QUALITY floral surface: four triangles per canted petal, rounded central tip by changing existing positions, seven vs eleven dangling twig blossom clusters, same layered lobe layout and warm low-emission palette. The result has 980 fewer triangles than R12, not a blanket density increase. ECO is SHA-identical.

## Actual 9:16 hero camera control
- Full portrait hero `hero_full_9x16` projection fit was checked on **all** R12/R13 GLB source vertices: R12 horizontal NDC [-0.8039,+0.8600], R13 [-0.8030,+0.8598]; vertical NDC [-0.444,+0.480] and [-0.455,+0.480]. Entire crown and roots visible at FOV 50° and 9:16; scene deliberately leaves vertical headroom because the tree crown is wider than it is tall.
- Separate close portrait `hero_close_9x16` intentionally crops the left/right crown from the old top camera; do not mislabel this as full coverage.
- Same VTK light/camera rig and later same Cycles rig for both revisions; no individual visual cheats.

## PBR proof boundary
- **Executed:** real glTF 2.0 model in native VTK PBR with synthetic gradient IBL plus 3 scene lights, no Phong override; top/under/3/4/trunk and full+close 9:16 matched frames, source video (~15s/~33s) only approximate framing.
- **Actually run before:** owner R12 Cycles four-case A/B, SA verified all 20 images/hashes.
- **Pending:** R13 true Cycles screenshot A/B (owner launcher supplied), native Three.js GLTFLoader, RTX+LIVE Studio FPS/VRAM. R13 is **ART PARTIAL**: flower edge facets and mechanical branch overlaps still visible. No production merge.
