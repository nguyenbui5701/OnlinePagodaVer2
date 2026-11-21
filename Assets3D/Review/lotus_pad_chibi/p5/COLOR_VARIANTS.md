# P0.5 six palette variants, each pose one geometry

Both true P0.5 GLBs have exactly **9 meshes and 21 materials**, retain P0.4 `KHR_materials_variants` with six mappings each on `ao_ba_ba_top` and `ao_ba_ba_pants` primitive slots. Skin/hair/eyes remain unaffected. The same mesh indices and vertices are used for every color; the local preview switches only material references on a temporary preview GLB.

| Palette | Áo bà ba top sRGB | Pants sRGB |
|---|---|---|
| pastel_lilac | #B9A4D7 | #44435D |
| blush_rose | #D998A6 | #59515C |
| sage_green | #94B6A0 | #394D48 |
| sky_blue | #85B8D4 | #35495F |
| warm_cream | #E7CBAA | #665A59 |
| terracotta | #BD806B | #484044 |

glTF PBR `baseColorFactor` is stored as linear RGBA, not the display sRGB hex values. Independent GLB JSON checks verify six mappings on both meshes. Two six-color VTK PBR contact sheets were executed from the real exported geometry. **Blender Cycles 6-color swatches and Three.js per-user material selection are NOT RUN**; scripts supplied for owner, future integration must isolate materials per-avatar, never globally recolor other viewers. Crowd 10/30/100 needs measured LOD/instancing validation, no FPS invented.
