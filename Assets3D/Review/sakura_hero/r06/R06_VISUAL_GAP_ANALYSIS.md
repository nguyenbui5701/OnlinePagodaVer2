# R06 SA issue matrix — based on 2026-11-20 R05 review and latest scope direction

| SA issue | R06 disposition | Evidence | Acceptance state |
|---|---|---|---|
| B1 PBR underside | Conditional improvement with IBL; unresolved without IBL and external glTF renderer | `render_pbr_truth.py`, `r06_pbr_ab_test.jpg`, `r06_pbr_under_noIBL.png`; **no Phong override** | PARTIAL, must test Blender/Three.js |
| B2 aerial 15s | Warmer peach-pink, variable crown lobes / depth but core still chunky | `r05_r06_pbr_side_by_side.jpg`, `r06_reference_15s_33s.jpg` | PARTIAL |
| B2 trunk 33s | Swept trunk + asymmetric roots, shorter tapering gold bark accents; still stylized polygonal | `r06_pbr_trunk_33s.png` and source/reference sheet | PARTIAL |
| B3 petal cost | R06 single-sided geometry with glTF doubleSided; explicit A/B same source/camera/lights. R06 QUALITY 148193 vs double 253718. ECO 32609 vs R05 63874. | `R06_VALIDATION.json` | Pass triangle-reduction experiment; GPU cost untested |
| B4 binaries pending | New revision 6 checksums, paths and status | `asset_manifest.json`, `BINARY_HANDOFF.md` | OWNER UPLOAD PENDING |
| B5 Blender/Three.js/GPU | Never claimed; unavailable in runtime and no hardware | `README.md`, manifest | OPEN |

**PBR A/B method:** R06 variant `single` and `explicit` from the same seed, material palette and procedural generation. The only change is duplicating offset backfaces. Both imported by VTK GLTF importer, same perspective camera, glTF PBR materials, IBL and 3 fixed lights. This is a *renderer-specific result*, not a guarantee of WebGL/Three.js.

**PBR environment ablation:** Removing IBL from the identical R06 GLB reproduces dark underside facets. This shows why a Phong-only visual comparison would be misleading. A dusk sky/hemisphere/IBL lighting specification should be reproduced in Three.js for art acceptance; doing so is a renderer responsibility of Codex under SA oversight, not an AI Visual Event Engine change.

**No synthetic video-match score is claimed.** 15s/33s have TikTok UI occlusions and the world scene is not implemented here.
