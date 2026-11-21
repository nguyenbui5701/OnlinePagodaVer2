# Direct R15/R16 raw GLB topology audit — independently read export bytes

Actual R15 GLB SHA `9ad2dc4ceb807e0a60d89c8cbfdbcc26f09bd2ba190a1bb1ed09825be23f81ba`. Actual R16 GLB SHA `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c`. Local `trimesh.load(force='scene')` and undirected triangle edge-incidence counting were used: **no producer SDF report as topology source**.

| Actual binary measurement | R15 | R16 |
|---|---:|---:|
| Total scene triangles | 187,368 | 191,288 |
| Total scene vertices | 227,360 | 229,235 |
| Primary SDF fused component triangles | 15,054 | **20,920** |
| Primary SDF fused component vertices | 7,529 | **10,462** |
| Main connected components / Euler | 1 / 2 | 1 / 2 |
| Is watertight / consistently wound | true / true | true / true |
| Boundary / non-manifold edges | 0 / 0 | 0 / 0 |
| Number of other bark material components | 16 | 16 |
| Number of independent branch material components | 77 | 68 |
| Gold material vertices | 414 | **286** |

R16 source joins 11 large branches + one secondary ID 100 with the parent bole; *it does not fuse every decorative root or fine twig*. The outer surface still shows triangle facets at `fork_side`, so topology alone is not aesthetic acceptance.

Gold: original R14→R15 actual vertex max displacement **1.09504m**, which explains concerns around the producer's 1.08343m pre-offset maximum. R16 writer rejects unsafe >0.25m source snaps and omits incomplete original row pairs; **20 continuous output segments, 286 vertices, 62 source rows rejected**. Independently recovered original-to-output vertex mapping from each kept row; resulting actual R15→R16 vertex displacement **mean .03050m / P95 .11574m / max .16076m**. Original 3 gold ribbons are omitted entirely. The owner source bundle contains the detailed full `R16_RAW_GLB_INDEPENDENT_AUDIT.json`, full `R15_RAW_GLB_INDEPENDENT_AUDIT.json`, per-ribbon CSV, debug PNG and executable auditor source. No additional Cycles rerender is claimed.
