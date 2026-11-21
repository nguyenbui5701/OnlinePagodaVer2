# R16 visual gap — Sakura-only ART PARTIAL

**P0 change executed on actual GLB:** R15/R16 VTK native glTF PBR same camera and three same lights shows the large flat independent main pipe at `fork_side` replaced with a single SDF wood junction. All 11 major arms plus one selected secondary were merged. **Not a global retopology**: remaining 68 independent fine-branch components and 16 old root/decorative bark parts are still separate. The new surface is watertight and Euler=2 but the near-field bark retains polygon facets. The ancient smooth bark of owner ~33s video is not yet reproduced.

**P1 gold:** R15 nearest-face projection could move a ribbon >1m. R16 capped projection drops unsafe rows: 20 continuous gold segments / 286 vertices retained vs 23 / 414 source; max retained movement .161m measured from exported GLB, but streak coverage is reduced. Overlay/debug `R15_R16_GOLD_DEBUG_TRUNK_FORK_MATCHED_VTK.jpg` and `GOLD_R15_vs_R16_PER_RIBBON_DISPLACEMENT_DEBUG.png` show before/after and omitted entries (grey). Flat strips sit ~12mm above selected bark to remain visible, so call them surface-aligned *not fully carved grooves*. Further artist retouch may be necessary.

**P1 petal test decision:** no evidence that blanket additional triangles improve the flat/paper impression, so original warm, layered, low-emission R15 canopy is kept unchanged. ECO remains byte-identical. FULL 9:16 keeps whole tree; MEDIUM clips ~1.21% and CLOSE ~7.37% of R16 vertices intentionally. PBR controls fixed.

**Unmet acceptance:** R16 native Blender Cycles matched 3 fork images + top/under/trunk and all portraits (owner starter prepared, NOT RUN); Three.js GLTFLoader and target GPU+LIVE Studio FPS/VRAM NOT RUN; ART PARTIAL. Keep PR Draft; no merge.

## P0 additional raw-GLB secondary-contact screening — unresolved regression risk

A **second independent test on the exported, SHA-pinned R15 and R16 GLBs** used VTK implicit signed distance to the joined woody shell and checked whether each remaining `Branches_plum` connected component has vertex samples on both the inside and outside (15 mm sign tolerance). This is a **proxy**, NOT a definitive triangle-triangle intersection or self-intersection proof.

| Metric | R15 | R16 |
|---|---:|---:|
| Remaining independent small branch components | 77 | 68 |
| Components whose vertex samples cross signed-distance sign | **31** | **45** |
| Components with any vertex within 15 cm of fused main surface | 43 | 54 |

While R16 merges the 11 main arms and one selected secondary into a watertight connected SDF parent, the broader joined shape has **more, not fewer, remaining secondary contact candidates** under this screening. The increase may reflect expanded parent geometry; exact triangle collision and visually visible penetration are **not proved** by this proxy. **Do not call secondary interfaces P0 PASS** or claim all branches are cleanly fused. SA must evaluate matched fork front/side/back Cycles and a later targeted secondary-branch retopology should inspect these components. Full per-component evidence, reproducing script and CSV are bundled in the owner Source Reports ZIP: `R16_SECONDARY_BRANCH_CONTACT_AUDIT.json`, `audit_secondary_contacts.py`, `R16_SECONDARY_CONTACTS.csv`. **P0 main continuous shell topology PASS; P0 secondary-branch junctions OPEN / regression risk.**
