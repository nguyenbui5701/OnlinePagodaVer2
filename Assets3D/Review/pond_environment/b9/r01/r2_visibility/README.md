# B9 R2 — focused habitat visibility / SA P0-V01

Baseline `1f7565a38fe4ae644bb602c2bcfc7ed433905642`, SA R2 review 6061414069, Task §10. No changes to R01 binaries, master, 22 frames, receipts or validator. No runtime changes. Offline source candidate only: worker has no Blender/bpy or PowerShell; four actual renders pending Owner.

## Root cause (offline)
Archived low-water camera (10,2.25,30) looks toward (2,1.15,13), vertical FOV 53°, portrait aspect 720/1280. Analytic pinhole projection of the archived fish centers gives zero centers inside the frustum for ECO (6) and QUALITY (12). E.g. Sanke at (4,-.495,28) NDC signed x=-3.61, y=-1.10, Kohaku at (10,-.42,25) x=+1.62,y=-1.03 (visible interval [-1,+1]); this is a placement/view mismatch, not an asset defect. Vertex-level visibility and actual intervening occlusion remain native diagnostics, not inferred. R01 thin surface mixes 28% dark Principled with 72% tinted transparent (.77,.81,.93); direct transmission is approximately (.554,.583,.670) per crossing, not a measured Cycles result. Lighting and camera rays may cross twice; reflection/lotus/root shadows may further reduce contrast. The actual low-water images do not show identifiable koi.

## Bounded correction
Reconstruct the exact archived seed9 habitat with R01 builder, suppress all original render callbacks, compare the full returned layout to R01. New offline camera (4.7,3.4,33.5) toward (3.5,.1,25), 53° vertical, same for both profiles/A/B; deliberately target the existing Sanke near (4,28), no fish moved or rescaled. New A is original water under this new camera, NOT the old low-water frame. B changes only water transparent RGB to (.97,.98,1) and Principled mix to .10; all other lighting/exposure/bed/ripples/camera/pose unchanged. Approximate direct per-crossing weight (.873,.882,.9), no assertion of final pixel visibility. One pair per profile, 4 frames total, 720x1280/32 samples/frame15, no water-off extra. Native diagnostics report actual deformed bounds, depth/floor, conservative triangle/mesh AABB surface clearance vs tree/lotus/other fish, projection and sampled first non-water ray hit; require a fully framed fish with at least 48px span and >=20% sampled unobstructed rays. Clearance at one pose only, not continuous path/solid containment/runtime proof. No overlay. Visual acceptance remains SA.

## Owner run (Windows)
From r01/r2_visibility on updated branch:
```powershell
& .\run_r2.ps1
```
Use Blender 4.5.16 LTS, or pass -Blender with exact exe. Do not execute R01 runner. A nonzero exit stops; preserve failed outputs/logs, do not retry without review. Send evidence directory (4 PNG + visibility_manifest.json), B9_R2_stdout.log, stderr and exit code. Original successful focus archive and original ZIP/master are available to Owner/artist; supply unchanged ZIP to SA, no need to regenerate. Source checks use immutable R01 manifest/normalized source SHA and all prior inventory SHA+size, no native regression rerun. Do not overwrite old 22 images. CODEX25/C0/MERGE HOLD. Final STOP only on actual evidence.
