# R11 visual gap report — SA R10 review #6003449385

## Findings from SA
- R10 native Blender/Cycles and both original .blend SHA/structure independently PASS. QUALITY aerial is near white, soft peach/pink separation is weak.
- QUALITY petals and multiple branches still angular, old-growth forks mechanical. ECO polygonal tiles/branch exposure visible but geometry is in budget. R10 not final art.

## Controlled tests and observations
1. **Color/emission separation**: R10 source petal base colors were close to white (e.g. blush `[251,207,208]`, cream `[248,215,198]`) and all petals had emissive `[.30,.17,.18]`. New QUALITY reduces both. A/B GLBs isolate (a) emissive only, (b) albedo only, (c) both, (d) geometry/normals only, (e) combined. VTK native PBR screenshots use the identical GLB importer/IBL/lamps. Pure Blender Cycles evidence for R11 is still pending; no claim that R11 has solved washed-out appearance in Cycles yet.
2. **AgX vs light exposure**: owner-run A/B supplies R10 AgX 0EV vs R10 Standard 0EV with unchanged light rig, and a separate R10 case with 75% SUN/World energy under AgX 0EV. These have not been executed in Blender yet. Cross-engine image pixel values do not constitute a radiance calibration.
3. **Flower silhouettes**: native R11 petal vertex normals added to four flower glTF materials with no extra triangles, and a 4-triangle rounded oval fan silhouette replaces long pointed lips. In VTK some patches look broader/larger and still read as tessellated sheets; therefore this is only a **geometry experiment**, not a solved softness gate.
4. **Bark**: qualitative incremental flute/knot relief rather than all-new fused branch mesh. Embedded gold fissures remain. Old-growth shape and branch merging remain OPEN, especially around ~33s.
5. **ECO**: R11 ECO byte-identical to R10. No new geometry or performance claim.

## Quantitative cost
QUALITY triangles **188,782 → 188,782 (0%)**, vertices **235,142 → 235,142 (0%)**, materials **11 → 11**. QUALITY GLB bytes **5,096,052 → 7,599,884** (+49.13%) because glTF NORMAL attributes are now explicitly serialized for all four flower groups. This is a real asset size tradeoff, **not a verified speed improvement**. ECO remains 44,412 triangles/71,032 vertices/10 materials/1,393,492 bytes, exact SHA unchanged.

## Gates still open
Blender R11 Cycles owner execution, fixed-light A/B and corresponding actual .blend SHA; native Three.js glTFLoader PBR parity; 3050 Ti 4GB and 3060 8GB LIVE Studio FPS/VRAM; SA quality art sign-off; exact large binary GitHub upload. No paid services; zero-cost only.
