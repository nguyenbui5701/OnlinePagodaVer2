# P06B Phase 1 — SA issue → only real hair sculpt

Reviewed baseline HEAD `b368444ccb851e88521d97d5be94299fc0f790f7` and SA Review [#6011115553](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6011115553). Real owner Blender 4.5.16 LTS Cycles 32 sample references inspected: cross hair front/left/back/top. Smooth 56×15 ellipsoidal cap reads helmet; this is ART PARTIAL, not broken pose/GLB.

**Physical repair (hair primitive index 6 ONLY):** sculpt swept top/crown with asymmetric +X side part and light -X fringe, three soft attached clumps (21×9 each; 189 vertices/320 triangles each), curved temple rim and tapered center/back nape. Layer crests +11.8/+7.8/+6.8mm above native scalp, borders sunk ~4.2mm to avoid floating strips. Three pose-independent geometry patches are attached within original hair material, not new meshes/materials; no stylized anime spikes.

**Hard frozen:** original 208v/384tri eyebrows inside hair #6 exact geometry/normals/index; all other mesh primitive raw bytes, anchors/transforms, original idle 2 seconds 17 samples, face/hands/trousers/feet/ao ba ba, six material variants, leaf and female untouched. New full cross 18380tri (+5.511%), kneel 18420tri (+5.498%), both under 20% limit. Read `P06B_VALIDATION.json` for binary proof.

**Evidence plan:** old/new exact camera hair front/left/right/back/top/quarter, supplemental left/right 3⁄4/low back, both 720×1280 lotus pair medium+close and 5 native idle stamps. Existing P06A owner Cycles images reused; not rerun frozen hands/seat. Hair/ear/scalp clearance PROXY_ONLY until actual Cycles. New Cycles NOT_RUN here, Blender unavailable. STOP SA+owner male art gate.
