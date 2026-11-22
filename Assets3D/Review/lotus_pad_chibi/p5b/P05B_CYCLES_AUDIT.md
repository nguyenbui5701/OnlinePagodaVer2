# P05b Cycles evidence audit — pending owner execution

**Current state: NOT_RUN, NOT_CREATED.** The AI container lacks a Blender executable. This is a planned audit checklist, **not a fake assertion of 8 completed cases, any Cycles PNG bytes/SHA, or four saved `.blend` projects**.

After actual owner Windows run of `run_p05b_blender.ps1`:
1. Confirm exact 5 GLB input SHA (2 old P05, 2 new P05b, frozen P02 leaf) and 8 actual case reports (four actor/four pair). Check Blender version, Cycles CPU/AgX 0EV/World 0.65 / 3 SUNs and identical P05 old/new camera rig.
2. For both poses compare original vs new hands front, side, left/right 3/4, torso, and 9:16 medium/close **real imported old/new GLB**, never VTK substitution. Inspect fingers, central 2mm palm seam, thumb contour, sleeve taper, upper lip of buttons and full 720×1280 readability.
3. Validate 5 imported `sit_idle` stages t=0,.5,1,1.5,2 from both angles on both new poses; check fingers do not merge, hair/neck clearance, cuffs, pads.
4. Verify every Cycles PNG exact SHA/bytes against per-case JSON and complete original SHA list, verify ZIP CRC and 4 `.blend` original bytes/structure. If source encoding normalizes on GitHub, audit original ZIP separately.
5. If exact triangle-level hand/thumb collision is not checked, retain `COLLISION_PROXY_ONLY` even if visuals look convincing. Final decision owner only.

**Baseline evidence:** SA [review #6009630175](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6009630175) verified original P05 two GLB SHA, real Cycles 8 case stdout and empty stderr, and spot-checked original PNG SHA, but did not fully rehash all original ZIP/.blend members. The original `p5/` files remain untouched. Source gap of original builder recovered in owner ZIP with SHA; upload to PR when possible.

Status `P05B_FEMALE_HAND_ART_OWNER_REVIEW_REQUIRED`, not production; no male/Codex/merge.
