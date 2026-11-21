# Cycles PBR controlled A/B — R10 vs R11

**This is a test protocol, NOT an executed Blender R11 report.** Execute on owner's Windows Blender 4.5+ using the two scripts in this R11 directory.

**Inputs**: original unmodified R10 QUALITY 5,096,052 B/SHA `ac4322fb00475d0dde3334a375fca0e0094715583edf7f6460b30a9139b1e273`, R11 QUALITY/ECO and four real diagnostic GLB files. Each case starts Blender `--background --factory-startup` and imports source glTF PBR as **Principled BSDF**; no material override, Phong switch or compositing. PBR properties are read from each GLB.

**Fixed lighting (main cases)**: synthetic dusk World `[0.69,0.47,0.60]`, Strength **0.65**; three `SUN` lights:
- KEY at glTF position `(22,40,26)` toward `(0,9,0)`, energy 2.1, RGB `(1,.84,.82)`, angular size .12.
- RIM at `(-18,23,-15)`, energy 1.05, RGB `(1,.76,.89)`, angular size .17.
- LOWER FILL at `(6,3,18)`, energy .72, RGB `(1,.74,.83)`, angular size .32.

Coordinate mapping `(x,y,z)_GLB -> (x,-z,y)_Blender`; verify imported tree height aligned to Blender +Z. Camera angles are VERTICAL FOV: top `(3,54,10)→(0,13.5,0)`, up `(0,0,-1)`, **50°**; under `(3,4.8,18.5)→(0,11.9,0)`, up `(0,1,0)`, **44°**; three-quarter `(31,25,31)→(0,11.6,0)`, **44°**; trunk `(4.8,4,11.5)→(0,6.6,0)`, **56°**. All positions are GLB +Y-up before axis conversion.

**Color management**: Blender `AgX`, look `Medium High Contrast` where supported, exposure **0EV**, gamma 1.0; Cycles **CPU**, samples 32, resolution 520×603, no post Photoshop. WORLD and Sun intensities fixed for all ordinary A/B GLBs.

**Isolation matrix**:
| Case | Model geometry | Base albedo | Emissive | Blender tone/lighting |
|---|---|---|---|---|
| r10_baseline | R10 | R10 | R10 | AgX, reference rig |
| r10_emissive_only | R10 | R10 | R11 | AgX, reference rig |
| r10_albedo_only | R10 | R11 | R10 | AgX, reference rig |
| r10_palette_only | R10 | R11 | R11 | AgX, reference rig |
| r11_geometry_only | R11 | R10 | R10 | AgX, reference rig |
| r11_final | R11 | R11 | R11 | AgX, reference rig |
| eco | EXACT R10 ECO | R10 ECO | R10 ECO | AgX, reference rig |
| r10_standard | R10 | R10 | R10 | **Standard** 0EV, reference rig |
| r10_light75 | R10 | R10 | R10 | AgX, all Sun + World energy **×0.75** |

The last two are *independent one-variable controls*, not directly compared to R11 under changed lights. Compare visual gradients and highlights with identical camera sizes; do not claim numeric equivalence to VTK IBL. Blender screenshot and JSON/output SHA must be verified before calling any R11 test PASS.
