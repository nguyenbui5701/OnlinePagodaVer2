# R07 visual + technical gap analysis relative to SA R06 review

SA comments read at https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1. Includes SA R06 review at commit `b953ae396179eb2c90ab9fc95cf4ba4eaac129f8` and three latest inline comments: ECO core faceting, ECO upper/edge petal coverage, and PBR scene light parity.

| SA blocker | Implemented R07 | Evidence/decision |
|---|---|---|
| V1 exposed ECO pink icospheres | ECO cores recessed to 0.57 lobe radius; deterministic sky-facing flowers with bigger ECO petals; 5 bridge lobes target remaining aerial projection gaps | R06/R07 ECO top/under same 50°/44° perspective and VTK PBR lighting in `r06_r07_eco_matched_pbr.jpg`. **Marked improved, minor hole remains.** |
| V2 QUALITY disconnected islands | 94 overlapping shared projected golden-angle lobe centers, more central/top layers, and irregular axes | `r06_r07_quality_matched_pbr.jpg`. Crown more continuous, still petal triangles/faceted and lighting differs from true video |
| V3 unnatural Y and long gold stripes | Shifted 12.5m leader and upper branch forks, tapered bent roots, short gold bark discontinuities | `r06_r07_trunk_33s_pbr.jpg`. Still visibly stylized mesh |
| B3 excessive double petals | No backface duplication. QUALITY 15 tris per flower, ECO 10 tris per flower, glTF `doubleSided` | R07 QUALITY 158701 tris (+7.09%) / ECO 43014 (+31.91%) vs R06. ECO increase is targeted, **not 2×** |
| B1 PBR under canopy | Same actual PBR glTF props and fixed dusk IBL + 3 lights; `--no-ibl` shows lighting dependence | Conditional VTK PBR only; Blender/Three.js PBR parity and owner GPU performance **OPEN** |
| Binary PR delivery | R07 manifest + exact filename/path/bytes/SHA + owner-upload statuses | GLB/OBJ/large image remain `pending_owner_upload`, never mark as on GitHub until checked |

All generated snapshots are from imported GLB, no Photoshop paint-over of 3D. Reference video 15s/33s is contextual only, app UI not modeled. FOV approximated; camera/lighting identical for direct R06/R07 comparisons.

## Remaining visual shortcomings

1. ECO still has a small gap when looking aerial, even though exposed large core-icospheres are removed.
2. QUALITY lobe silhouette is somewhat scalloped and blossom detail is low-poly triangular, not yet the soft bloom-rich look in original footage.
3. Dark bark needs more organic microstructure. Gold fissures are shorter but the bark is not texture-rich.
4. PBR with IBL and fill is representative of the chosen test rig, not a guarantee for other renderer/environment; without IBL underside darkens. No Photoshop/Phong override used.
5. Blender `.blend` source, Three.js import/parity, actual target 4GB/8GB VRAM and LIVE Studio FPS not tested; cannot approve production.
