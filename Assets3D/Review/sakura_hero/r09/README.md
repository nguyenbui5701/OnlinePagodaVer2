# Sakura Hero R09 — zero-cost visual iteration, not production approved

**Existing PR #1:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1  
**Branch:** `assets/sakura-hero-r04-sa-review`  
**Directory:** `Assets3D/Review/sakura_hero/r09/`  
**State:** `GEOMETRY_PROTOTYPE_SA_REVIEW_PENDING_NOT_APPROVED`; binary files **`pending_owner_upload`**.

## SA R08 feedback addressed

1. **ECO five aerial poses (not a single shot):** renders with exactly matching R08/R09 GLB-camera combinations at `top`, `aerial_e`, `aerial_w`, `aerial_n`, `aerial_s` at 50° FOV. No new major ECO holes evident in visual review, so **no additional global or local blossom patch was added**. Recessed core/targeted R08 bridges preserved; small dark seams persist. `PBR_Review/R08_R09_ECO_5_AERIAL_PBR.jpg` is the five-view evidence, not a proof of 100% all-angle coverage.
2. **QUALITY canopy:** replaced consistently rounded scallops with rotating anisotropic and warped overlapping bloom bands, stratified Y depth, four-triangle curled/notched petals rather than R08 QUALITY three-triangle peaked sheets. Gives visibly different 15s aerial silhouette but some spiky low-poly edges remain. Increased QUALITY triangle cost is disclosed below.
3. **Trunk:** single swept/fluted bark mesh, strong leader twist, surface geometry fissure indentation, tapered yellow polygonal strips following these grooves, not bright horizontal/gold tube rings. Root taper/branch variation preserved. Less cable-like at 33s, still stylized bark.
4. **PBR:** VTK 9.6.2 re-import of actual GLBs using native Physically Based Rendering, fake sky/earth IBL + three scene lights, fixed scene camera; **NO Phong or ambient-material override**. A different engine, free Blender Cycles CPU, is *prepared but NOT EXECUTED* because Blender is absent in current environment.
5. **Zero-cost:** local numpy/trimesh, vtk, Pillow, Blender script; **0 VND charged services**. No assets outside Sakura, no V1/Codex/main changes.

## File metrics (measured from exported GLBs)

| Preset | R08 triangles → R09 | R08 vertices → R09 | R08 GLB bytes → R09 | Materials |
|---|---:|---:|---:|---:|
| QUALITY | 159,009 → **185,026** (+16.36%) | 215,255 → **233,238** (+8.35%) | 4,500,120 → **5,028,124** (+11.73%) | 11 → 11 |
| ECO | 43,794 → **44,412** (+1.41%) | 70,557 → **71,032** (+0.67%) | 1,380,376 → **1,393,492** (+0.95%) | 10 → 10 |

QUALITY pays ~26k extra triangles to actually change the flower outline and layer shapes. No FPS or VRAM benchmark has been measured; this increase is a **provisional artistic tradeoff**, not a demonstrated production optimization. ECO remains close to R08 geometry budget. Both flower variants have a single polygon sheet with glTF `doubleSided` (no copied backfaces).

## Rebuild the R09 GLBs and editable source on Windows (free)

```powershell
py -m pip install numpy trimesh vtk pillow
cd Assets3D/Review/sakura_hero/r09
$env:SAKURA_OUTPUT=(Get-Location).Path
py .\procedural_sakura_source.py
py .\validate_glb.py .\sakura_hero.glb .\sakura_hero_eco.glb
```

Check the generated hashes versus `BINARY_HANDOFF.md`. Git exporter versions may change byte hashes; use the **original supplied binaries** for exact review checksums. Do not silently overwrite archived R09 revision with different bytes.

### Reproduce side-by-side native VTK PBR

From `r09/` with R08 GLBs placed in sibling `r08/`:

```powershell
py .\render_all_pbr.py --r08 ..\r08 --r09 . --out .\PBR_Review
```

Exact lighting, synthetic environment, camera positions and exposure note in `PBR_LIGHTING_CONTRACT.md` and `R09_VALIDATION.json`. Owner video reference images are comparison-only and not baked into GLB.

### **Free independent Blender/Cycles test (NOT run by AI Visual)**

Install free Blender 4.x on Windows and run it in background; set `$blender` to YOUR installed executable path:

```powershell
$blender = 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe' # edit for your version
& $blender --background --python .\blender_import_validate.py -- --model .\sakura_hero.glb --out .\Blender_Check_QUALITY --variant quality
& $blender --background --python .\blender_import_validate.py -- --model .\sakura_hero_eco.glb --out .\Blender_Check_ECO --variant eco
```

This imports the **original GLB**, preserves glTF-imported Principled material node settings, creates a fixed dusk World+three Sun lights, sets Cycles CPU (physically based), saves an **editable** `.blend` in each output folder and writes top/under/side/33s renders and JSON reports. Blender lighting is a separate standardized dusk setup, **not identical numeric radiance to VTK's IBL**; only compare versions within the *same* renderer and settings. If the script errors due to Blender version specifics, report the error and do not claim validation. The script itself was syntax-compiled with ordinary Python, **not executed in Blender** here.

## Validation and non-acceptance gates

- **PASS (structural):** real GLB2 import in trimesh; finite vertices/zero nondegenerate failure; material names; +Y up; `doubleSided` on all 4 petal materials; no external textures/animations.
- **PASS (conditional visual):** R08/R09 matched PBR within VTK under synthetic sky IBL and three lights; 5 aerial ECO poses; three-quarter/under/trunk QUALITY.
- **PENDING:** independent Blender actually run; `.blend` actually created; native glTF/Three.js PBR parity; measured RTX 3050 Ti 4GB/RTX 3060 8GB with LIVE Studio FPS/VRAM; final 15s/33s close artistic match.
- **PENDING GitHub binary:** SA must retrieve exact uploaded R09 GLBs and verify SHA-256 before changing `pending_owner_upload` or granting production approval.

No PR merge or Codex production asset integration requested by AI Visual.
