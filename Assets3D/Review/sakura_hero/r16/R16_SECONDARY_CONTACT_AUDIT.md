# Sakura R16 — independent secondary branch / joined bark contact screening

**Classification: R16 P0 main fused wood topology PASS, but secondary-branch junction acceptance OPEN (possible regression).** This audit uses actual exported source SHA-pinned GLB bytes and does not derive results from the generator's self-report.

## Inputs
- R15 QUALITY GLB: `9ad2dc4ceb807e0a60d89c8cbfdbcc26f09bd2ba190a1bb1ed09825be23f81ba`
- R16 QUALITY GLB: `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c`
- Both loaded into trimesh as scenes. The largest `Trunk_bark_plumblack` component defines the genuine watertight parent bark. Independently split `Branches_plum` into individual residual connected pieces (R15 77, R16 68).
- Used VTK `vtkImplicitPolyDataDistance` signed-distance evaluations at remaining branch vertices. A potential crossing requires at least one vertex with sign below -0.015 m and one with sign above +0.015 m; a proximity candidate has at least one vertex within 0.15 m of parent shell.

| Directly measured *proxy*, not triangle collision | R15 | R16 |
|---|---:|---:|
| Independent `Branches_plum` components | 77 | 68 |
| Signed-distance sign-crossing candidates | **31** | **45** |
| Components with vertices near parent shell (15cm) | 43 | **54** |
| Main parent SDF component watertight / winding | PASS | PASS |
| Main parent SDF Euler characteristic | 2 | 2 |

## Interpretation
The R16 main bark has one continuous watertight union encompassing all eleven principal branches and selected important secondary branch (source id 100). However, **45 of 68 residual secondary pieces show potential vertex sign-crossing**, up from 31 of 77 for R15. This can be influenced by the enlarged parent surface and does **not** prove actual triangle-triangle intersection in every case. Neither the apparently lower residual part count (77→68) nor the main-shell watertightness can establish a fully clean visual join.

**Do not accept P0 secondary junctions or declare full-tree topology PASS.** A follow-up should perform exact mesh-mesh triangle intersection at candidate components and assess matched Blender R15/R16 `fork_front`, `fork_side`, `fork_back`; locally fuse or art-direct only confirmed dominant penetrations. R16 is retained as an **experimental prototype**, with this regression risk prominent in README, validation and manifest. The per-component JSON+CSV and reproducing script `audit_secondary_contacts.py` are included in the separately delivered `Sakura_R16_Source_Reports.zip`.

## Proof boundaries
Test executed on raw exported GLB vertices, not a Cycles run. **R16 Cycles NOT RUN**; visual quality ART PARTIAL; Three.js/native GPU/LIVE Studio NOT RUN. PR #1 Draft, do not merge.
