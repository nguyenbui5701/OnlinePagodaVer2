# P0.7a UNDERCUT vs frozen owner-approved P0.6c — falsifiable STYLE A/B

**Art question:** Can a normal viewer recognize a modest, tidy, human/Vietnamese-style chibi undercut as DISTINCT from approved P06c, without a skin fade, helmet, disconnected sheets, black-painted scalp, spiky top or mood change? **No P07a owner Cycles available yet**; DO NOT mark aesthetic PASS before genuine same-camera 3D renders.

## Actual measured geometry differences (no Photoshop/color material changes)
| Zone | P07a change relative to P06c (physical surface) | Samples | A/B image test |
|---|---:|---:|---|
| Crown / groomed top | +10.452mm mean radial outward | 348 cap vertices | original `hair_front`/`hair_top`/`hair_right_3q` |
| Both temples and upper ears | −16.766mm mean inward, tapered | 109 cap vertices | original `hair_left`, `hair_right`, plus new `hair_ear_left/right` |
| Nape/back lower edge | −16.819mm mean inward | 63 cap vertices | original `hair_back`, `hair_low_back`, new `hair_nape_macro` |
| Subtle front forelock | +1.677mm mean varied flow | 63 vertices | original `hair_front` and `hair_quarter` |
| Opaque scalp/shell | NO changed hair material or skin; lower scalp covered in finite ray tests | 1575 upper cap rays | front/top/right3Q normal and close |

**Both poses require matching views at the exact original camera**: same frame/time, same AgX EV0/lighting, both before/after from actual p6c and p7a GLBs. Owner Windows output pattern:
- BEFORE `p7a/P07A_Cycles_Evidence/p06c_POSE_actor/p06c_POSE_actor_hair_VIEW_cycles.png`
- AFTER `p7a/P07A_Cycles_Evidence/p07a_POSE_actor/p07a_POSE_actor_hair_VIEW_cycles.png`
  with `POSE=cross|kneel`, `VIEW=front,top,right_3q,left,right,left_3q,back,quarter,low_back,ear_left,ear_right,nape_macro`.
- original independently seen owner p6c (never overwritten): `p6c/P06C_Cycles_Evidence/p06c_POSE_actor/p06c_POSE_actor_hair_VIEW_cycles.png` for existing views.
- SAME original P0.2 lotus and vertical 720×1280 before/after pair: `p07a/P07A_Cycles_Evidence/p06c_POSE_pair/p06c_POSE_pair_pair_medium_9x16_cycles.png` vs `p07a/P07A_Cycles_Evidence/p07a_POSE_pair/p07a_POSE_pair_pair_medium_9x16_cycles.png`, and `pair_close_9x16`.

A real improvement needs soft lift vs short sides/neck at normal 9:16, no bald skin or obvious angular edge when 3/4 and side, no face/ear/collar collision at any of 5 idle times. THREE soft directional clumps stay with hair field (not floating); the eyebrow tubes are EXACT original bytes. If not recognizably undercut, mark ART_PARTIAL and revise p7a only after SA/owner feedback. The original female-approved visuals are an unchanged style-family reference, not rerendered as a new art deliverable.

**Current:** GLB + numeric physical diff PASS, P07a Cycles and 9:16 art **NOT_RUN**; owner acceptance **PENDING**.
