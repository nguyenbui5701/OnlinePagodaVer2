# P06c Phase 1 — actual old Cycles → underlying geometric cause → focused repair

**Frozen reviewed SHA:** `9ff521549af8b8f1449579a4c7fd7ab6021c7e94`; [SA FAIL review #6011459874](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6011459874). Real P06b Cycles front, top, right3/4 and 9:16 from GitHub were opened and inspected. Beige jagged scalp patches are clearly visible in both male poses; P06b artist gate FAIL, despite real GLB/Cycles evidence.

## Actual inspected pixels/views
- `p6b/P06B_Cycles_Evidence/p06b_cross_actor/p06b_cross_actor_hair_front_cycles.png`: TWO irregular beige exposed areas inside top-front hair, bordered by sculpted strands.
- `.../p06b_cross_actor_hair_top_cycles.png`: wider irregular strip and contour between grooves.
- `.../p06b_cross_actor_hair_right_3q_cycles.png`: patch visible from natural profile.
- `.../p06b_cross_pair/p06b_cross_pair_pair_medium_9x16_cycles.png`: exposure obvious at 720×1280 phone framing.
- Kneel original analogous images share identical geometry, confirmed from actual P06b binary. No new video frame analysis claimed.

## Real source GLB diagnosis, not shader speculation
Read P06b `build_male_hair_p06b.mjs`, both GLB bytes, and hair material, meshes/nodes. Base cap is 841 sculptable surface vertices + 56 lip; two eyebrows 208 vertices frozen, three 189-vertex swept clumps inside same mesh #6. Source warp includes **−11 mm** thin groove; clump edges are **−4.2 mm** below cap. Original actual mesh #3 skin of upper body is much closer to cap than that source assumed. The mesh #6 hair material is `doubleSided=true`, no degenerate triangles; 112 inward-facing faces are intentional under-rim, while main outer cap surface is outward. The scalp patch is caused by real triangle occlusion order/penetration, **not** a missing-material/blend setting or absence of cap triangles.

Möller–Trumbore triangle ray from skull center (0,.85,.005) through original cap vertices and actual cap triangle centroids gives **87/1586 scalp-intruding samples, worst −8.734 mm**; at three swept clump vertices **90/567 under original scalp, worst −11.557 mm**. From original B6 camera and 43×39-ray sampling, *old skin-first* readings: front **45/280**, top **155/1167**, right 3/4 **41/267**, right side **15/239**; left/back zero. This aligns specifically with the beige image areas. Ray hit classification is **exact per tested ray** but is NOT a proof for the continuous physical surface.

## Surgical change physically executed in P06c
Use original unchanged skin triangle surface to compute the hair shell radial correction needed for a **14mm target sampled clearance** above scalp. Smooth required displacements for 7 passes over 56-angle cap topology, never drop below the per-vertex physical safety floor; 572/841 shell vertices move (max +22.734mm); 56 rim vertices follow, 3×189 hair sweeps follow the same directionally interpolated field. Keep visible side-sweep grooves/clumps, front/temple/nape shaping; do NOT paste a separate opaque cover or flatten to a helmet. Original face, laces, eyebrow geometry and all other meshes are untouched.

Measured outputs for BOTH poses (same canonical male head/hair): **0/1591 corrected cap samples under skin, min +8.083 mm**; **0/567 corrected sweep vertices under skin, min +6.606 mm**. Exact sample rays for front/top/right 3/4/left/right/back all give **0 skin-first** in the repaired upper head screen region; front/top/right3Q negative case on old remains reproducible. See `P06C_SCALP_COVERAGE_REPORT.json` + `validate_p06c_scalp_rays.mjs`.

**Gate:** this proves the sampled geometric cause and correction, not that the next Blender Cycles has passed aesthetically. All real P06c Cycles, .blend and ZIP await owner Windows; SA must evaluate normal lighting and phone-size before art approval. No other geometry/camera/skin/material modified.
