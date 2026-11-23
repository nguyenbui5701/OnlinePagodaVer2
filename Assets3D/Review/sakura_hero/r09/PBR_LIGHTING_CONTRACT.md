# Sakura R09 — PBR truth conditions, disclosure and cross-renderer gate

## VTK comparison (actually executed)

- Import: `vtkGLTFImporter` loads original exported GLB (not an OBJ or preview PNG); every imported actor must report property interpolation **Physically based rendering**.
- **No** `SetInterpolationToPhong`, no material `SetAmbient` or diffuse lighting overrides.
- Environment: synthetic equirectangular gradient image, sky RGB (216,181,195), horizon RGB (172,132,165), ground RGB (124,98,142), 256×128, `UseImageBasedLightingOn()`; **this is designed dusk IBL, not calibrated HDR**.
- Three scene-light color/intensity/positions: KEY (22,40,26), 1.25, (1,0.84,0.82); RIM (-18,23,-15), 0.65, (1,0.76,0.89); UNDERFILL (6,3,18), 0.84, (1,0.74,0.83). They target (0,9,0) and are non-positional in VTK.
- Perspective camera and field-of-view (degrees): `top` (3,54,10) looking at (0,13.5,0), up (0,0,-1), FOV50; `aerial_e` (15,54,7), `aerial_w` (-13,54,8), `aerial_n` (5,54,-15), `aerial_s` (-6,54,18), same target/up/FOV 50. `under` (3,4.8,18.5) → (0,11.9,0) up (0,1,0) FOV44; `three_quarter` (31,25,31) → (0,11.6,0), FOV44; `trunk_33s` (4.8,4,11.5) → (0,6.6,0), FOV56.
- Output gamma/tonemapping: VTK/OpenGL default import/export state. **No explicit manual exposure override; EV equivalence to Blender not established.** Critically the **same default settings** are used for *every* R08/R09 pair.
- Known behavior: removing IBL reduces lower surface brightness; that is an environment-lighting dependence, **not automatically a mesh defect**.

## Blender (independent PBR test AUTHORED, NOT RUN)

- Script: `blender_import_validate.py`, tested for Python *syntax only*, not Blender APIs at runtime.
- Loads exactly the R09 GLB with `bpy.ops.import_scene.gltf`; checks imported mesh objects + node-based Principled BSDF materials. Does not replace glTF material nodes or inject ambient material overrides.
- Blender Cycles CPU, 32 samples default, render 520×603, constant dusk World color (0.69,0.47,0.60), strength 0.65; Sun KEY energy 2.1 angle 0.12, RIM 1.05 angle 0.17, lower fill 0.72 angle 0.32 and directional positions matching VTK. `AgX` when supported, exposure 0 EV, gamma 1.0. The Blender World/energy units are **not radiometrically identical to VTK IBL**; same Blender rig between model variants supports Blender-internal A/B, not cross-engine pixel equality.
- Creates an editable `.blend` from actual GLB only **on successful owner execution**, and produces independent CPU Cycles PBR screenshots and JSON. These files **do not yet exist** in this AI environment.
- Actual native Three.js GLTFLoader materials and 3050 Ti/3060 with TikTok LIVE Studio remain UNTESTED; no FPS/VRAM assertion.
