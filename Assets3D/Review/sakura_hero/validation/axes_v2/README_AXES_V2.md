# Sakura R09 Blender validation — AXES V2

This is an **independent test-script correction only**. All source GLB R09 bytes, geometry and materials remain unchanged. **Do not create R10 or claim final visual/PBR approval from the first Blender run.**

## Failure found in the owner's first Blender evidence

Owner executed Blender **4.5.16 LTS** Cycles CPU on both SHA-matched R09 GLBs: 11 meshes / 185,026 triangles QUALITY, 10 meshes / 44,412 triangles ECO. The log confirms 4 QUALITY and 8 ECO PNGs and reports saved. The 12 pictures were real Cycles outputs, but the first test script supplied **glTF +Y-up** camera/light coordinates directly to **Blender +Z-up**. Consequently top/under/trunk camera composition was wrong (e.g., “under” was filled by a close pink surface). Blender import PASS, Blender visual matching/usable view renders **NOT YET PASS**.

## Corrections

- Convert camera positions, target points, up vectors and Sun light positions using `(x,y,z) -> (x,-z,y)` (a +90-degree X rotation).
- Assert that imported Blender world bounds have tree height aligned to `+Z`.
- Explicit `sensor_fit='VERTICAL'` to retain VTK's vertical FOV. Eight camera poses are rendered for **both** QUALITY and ECO.
- Keep imported glTF Principled BSDF materials unchanged, Cycles CPU, dusk World + 3 Sun lights, AgX 0 EV, no Phong override.
- Save corrected evidence to `Blender_Evidence_R09_AxesV2/` so the original evidence remains untouched.

## Windows command (inside a fresh extracted AXES V2 starter ZIP)

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R09_blender_axes_v2.ps1 -Variant quality -Samples 8 -Size 320
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R09_blender_axes_v2.ps1 -Variant all -Samples 32 -Size 520
```

If required pass `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` adjusted to the actual installation.

Upload `Sakura_R09_Blender_Evidence_AxesV2.zip` and, separately if possible, the 2 generated `.blend` files. The light ZIP intentionally **excludes** `.blend`; its JSON reports contain reported .blend hashes only, not independently checked bytes. Do not treat missing .blend inside ZIP as proof the files were not created.

The corrected source and launcher are in this folder. **They passed Python syntax/pure math checks but have NOT been executed in Blender in the AI Visual environment.** Cycles dusk illumination cannot be numerically equated with VTK IBL. Runtime Three.js and RTX 3050 Ti/3060 + LIVE Studio remain OPEN.

### Unchanged R09 exact GLB hashes
- QUALITY 5,028,124 bytes: `e68a479a2ea4705d711702e015ef290c72757cca107a261913d4988d5ae9bbc8`
- ECO 1,393,492 bytes: `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`
