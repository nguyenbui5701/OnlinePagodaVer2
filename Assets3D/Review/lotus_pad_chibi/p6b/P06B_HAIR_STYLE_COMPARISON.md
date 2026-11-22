# Hair styling P06A → P06B: old/new true-camera A/B

**Question to owner/SA:** does short male hair now visibly show three soft directed layers and a gentle off-center part in FRONT/TOP/SIDE, with small ear/temple and nape transitions—not a dark helmet? This is an **ART PENDING** criterion, not a self-declared PASS.

**GLB geometry measured:** hair #6 1105v/2120tri → 1672v/3080tri, same 21 materials, +960tri per whole model. Cross 17420→18380 (+5.51%), kneel 17460→18420 (+5.50%). 208 eyebrow vertices and 384 eyebrow triangles literally byte-identical. Three low-relief embedded clumps raised to 11.8, 7.8, 6.8mm above groomed scalp; original big dark ellipsoid intentionally no longer a uniform smooth surface. Nape hair bottom minY .84512m→.83447m; still short (not down to clothing).

**For both POSE = cross or kneel:** old baseline image `p6a/P06A_Cycles_Evidence/male_POSE_actor/male_POSE_actor_hair_VIEW_cycles.png`; new image after owner Blender `p6b/P06B_Cycles_Evidence/p06b_POSE_actor/p06b_POSE_actor_hair_VIEW_cycles.png`; VIEW = `front,left,right,back,quarter,top` (same eye/target/FOV and rig). New `hair_left_3q`, `hair_right_3q`, `hair_low_back` are separately named *diagnostic-only* with no exact old shot.

**9:16 lotus A/B:** old `p6a/P06A_Cycles_Evidence/male_POSE_pair/male_POSE_pair_pair_medium_9x16_cycles.png` vs new `p6b/P06B_Cycles_Evidence/p06b_POSE_pair/p06b_POSE_pair_pair_medium_9x16_cycles.png`; same for `pair_close_9x16`. Female approved reference at p5f/p5c unchanged. No Photoshop edits, new camera tricks, or video overlays.

**Evaluation after true Cycles:** front part readable, left/right ear clearance, back short uneven taper, top soft directional grouping, 9:16 identifiable, eyebrows not concealed, no float/ridge seam. If any view reads helmet, mark ART_PARTIAL and propose minimal further hair-only sculpt; do not self-approve. Old P06A actual Cycles already SA confirmed, new P06B Cycles **NOT_RUN** in this environment.
