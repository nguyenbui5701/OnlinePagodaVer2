# Sakura Hero R08 — ZERO COST visual iteration / SA prototype review

**Pull request:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1  
**Branch:** `assets/sakura-hero-r04-sa-review`  
**Status:** `GEOMETRY_PROTOTYPE_NOT_APPROVED`, binary delivery `pending_owner_upload`; PR must remain Draft, no production approval.

## Scope and improvements
Only the Sakura Hero tree. Read SA R07 review at original commit `fc9b69d666175231355e2e17ebacf75d0eae0e00`. ECO center-left void gets **two tiny targeted petal bridges**, not global polygon increase. QUALITY crown now uses anisotropic irregular lobes, softened curl and multiple uneven bloom tiers; trunk has stronger sweep, nonuniform curved buttress roots and small partly embedded gold streaks. All materials use imported native glTF PBR factors. Single-surface blossoms with `doubleSided=true` retained (QUALITY 3 tris/petal, ECO 2 tris/petal). Original R04–R07 directories NOT edited.

## Exact measured GLB stats
| | R07 QUALITY | R08 QUALITY | R07 ECO | R08 ECO |
|---|---:|---:|---:|---:|
| Triangles | 158,701 | 159,009 | 43,014 | 43,794 |
| Vertices | 215,101 | 215,255 | 69,518 | 70,557 |
| Materials / meshes | 11 | 11 | 10 | 10 |
| GLB bytes | 4,494,556 | 4,500,120 | 1,358,528 | 1,380,376 |

New R08 QUALITY SHA-256: `616417f22a2d3cd34c9708e500428449154fd97d1efd142838b390ce3187386e`  
New R08 ECO SHA-256: `e249b45befc009c657b257d5c37064f250882fdbb9a9338f7bb8335b56cfcdc9`

## Reproduce locally (free Python)

```powershell
py -m pip install numpy trimesh vtk pillow
$env:SAKURA_OUTPUT=(Get-Location).Path
py ./procedural_sakura_source.py
py ./render_pbr_truth.py ./sakura_hero.glb ./quality_top.png --view top --w 420 --h 480
py ./render_pbr_truth.py ./sakura_hero_eco.glb ./eco_top.png --view top --w 420 --h 480
py ./validate_glb.py --folder .
```

The fixed RNG seed is 12808. Exact GLB bytes may vary across exporter versions/platforms; if rebuilt GLB SHA differs, DO NOT treat it as byte-identical R08. Obtain the owner-review ZIP for the exact verified bytes.

## PBR and art evidence
- `PBR_LIGHTING_CONTRACT.md` has sky IBL gradient, 3 fixed lights, same per-view cameras for R07 vs R08, no Phong override; actual imported GLBs examined in VTK native PBR.
- `R08_VISUAL_GAP_ANALYSIS.md` and `R08_VALIDATION.json` include fidelity gaps and measured stats, not unjustified FPS claims.
- Local review images from actual GLB: `r07_r08_eco_top_pbr.jpg`, `r07_r08_quality_top_pbr.jpg`, `r07_r08_trunk_33s_pbr.jpg`, `r08_quality_eco_under_pbr.jpg`, owner-video 15s and 33s comparisons.
- No independent Blender or Three.js PBR imported preview, no `.blend`, no RTX 3050 Ti 4GB / RTX 3060 8GB with LIVE Studio performance measurements. **Do not approve production** from these files.

## Handoff
All GLB, OBJ and image binary files are listed with exact canonical path/size/SHA in `BINARY_HANDOFF.md` and are **pending owner upload** to this same branch. Do not merge to main; do not modify V1, Codex renderer or Event Engine. 0 VND paid tools.
