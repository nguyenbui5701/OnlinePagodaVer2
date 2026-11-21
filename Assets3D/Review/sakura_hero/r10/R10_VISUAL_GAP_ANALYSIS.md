# Sakura R10 — validation & visual gap report

## 1. Independent Blender evidence from owner (R09)
- **PASS — independent Cycles rendering of R09:** Blender 4.5.16 LTS Windows, two exact R09 GLBs, 11 QUALITY / 10 ECO meshes; original material nodes imported as Principled BSDF.
- Corrected AXES V2 camera: +Y-up glTF to +Z-up Blender. Imported Z maxima 26.32m QUALITY / 24.87m ECO; aerial, under and trunk frame the correct objects in the 16 PNGs.
- Two `.blend` files independently SHA-256 verified: QUALITY `adee1eacea83b0a1bf33946695cf3ae395d7afdb26d3792ac136145d52ac97cd`, ECO `3531bdae8749c4a453aa7d349abc30f357e7c1674584852e8accb8e463035948`. 16 screenshot files match owner-provided per-file hash list.
- This proves Blender could load the exact R09 glTF model and render the imported PBR nodes with the documented dusk world + sun lighting. It does **NOT** validate R10 import nor guarantee glTFLoader equivalence or owner GPU FPS.

## 2. QUALITY top at reference ~15s
R09 Cycles shows an airy pink giant silhouette but also repetitive thin *serrated* flower tips and washed light tones. R10 changed the four-triangle flower outline from a deep twin-tip notch to broad nearly-flat lobed lips, reduces radial lobe warp and narrows extreme long/narrow cluster axes. R09/R10 VTK screenshot pairs at fixed lighting/FOV show a **modest contour improvement**, not a photoreal match. Keep ART OPEN.

## 3. Trunk ~33s
R09 Cycles shows genuine low-poly dark plum tree with swept, fluted bark and embedded gold flecks, but rather smooth surfaces and mechanical fork joins. R10 adds QUALITY-only sampling from 54x46 to 73x58 and low-amplitude braided knots, varies near-ground roots, keeps gold strips exactly surface-tracked. No glowing cords introduced. VTK 56° perspective suggests modestly improved relief; keep ART OPEN.

## 4. ECO
R09 ECO passed five sampled aerial poses by SA; R10 ECO generated from same deterministic script path and verified byte-for-byte **identical** `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`. No new coverage risk or added polygons. This is a carry-forward, NOT a newly modified ECO mesh.

## 5. PBR and gaps
- R09: owner Cycles CPU completed, 16 images, 2 `.blend` independently verified. Blender variant-specific lighting differs from VTK and cannot be used for numerical parity.
- R10: VTK-native GLB PBR with 256x128 synthetic dusk environment IBL and same three fixed scene lights; 50° aerial / 44° under / 56° trunk; no Phong or material ambient override. **R10 Blender NOT EXECUTED**; Blender starter supplied for owner.
- No native Three.js glTFloader test, RTX 3050 Ti 4GB/3060 8GB + LIVE Studio FPS/VRAM, production light rig, or `.blend` for R10. PR remains Draft and no production approval requested.
- Current R10 VTK visual difference is restrained; source-footage pixel matching is impossible without exact video camera/light/atmospherics. Require owner/SA Cycles side-by-side before acceptance.

## SA request
Review this as the first new geometry candidate after real independent Blender validation of R09; check R10 Blender results before sign-off. Keep exact R09 revision, source SHA and media immutable.
