# Six-color one-geometry material palette (P0.4)

The real exported GLB provides `KHR_materials_variants`, with 6 mappings for `ao_ba_ba_top` and 6 for `ao_ba_ba_pants`, never six copied geometry sets. Skin/eyes/hair do not vary.

| Palette | Top sRGB | Pants sRGB |
|---|---|---|
| pastel_lilac | `#B9A4D7` | `#44435D` |
| blush_rose | `#D998A6` | `#59515C` |
| sage_green | `#94B6A0` | `#394D48` |
| sky_blue | `#85B8D4` | `#35495F` |
| warm_cream | `#E7CBAA` | `#665A59` |
| terracotta | `#BD806B` | `#484044` |

BaseColorFactor values are **linear**, derived from these sRGB codes. Six native GLB PBR preview images were made by temporarily changing two primitive material references, not duplicated actor geometry. Three.js variant selection NOT RUN; Codex must later clone/material-swap per viewer rather than mutate global shared materials.

Proposed LOD strategy (not built/benchmarked): 10 avatars use full-quality geometry, 30 avatars need measured LOD1/cull groups by palette, and 100 avatars require LOD2 or instancing compatible with the animated root. No FPS/VRAM claims.
