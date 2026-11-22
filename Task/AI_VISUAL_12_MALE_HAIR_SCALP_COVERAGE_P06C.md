# AI VISUAL 12 — P0.6c Male Hair Scalp Coverage and Short Hair Integrity

**SA issued:** 2026-11-22. **Status:** ASSIGNED / P0 ART BLOCKER / MALE TWO-POSE OWNER GATE BLOCKED.

**Mandatory Sakura process:** SA issues testable task → independent AI Visual completes actual GLB + genuinely editable Blender project + real reimported Cycles → SA reviews exact source, numeric and photo evidence → owner explicitly approves BOTH male poses → only then new phase. Comply with Design/07_WORK_RULES.md and Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md. This document is the authoritative copy-pastable standalone scope for the next revision. It is NOT a request to experiment with an entirely new hairstyle or rebuild the character.

## 1. Role, objective, exact authorized scope and HARD STOP

**Role:** Independent AI Visual / Blender 3D art specialist, NOT Codex.

**Single P0 issue at P0.6b:** The requested short male hairstyle now has several soft, directional strands, but real Cycles clearly reveal TWO LARGE, JAGGED, SKIN-COLORED PATCHES through the upper front/top cap. Both male cross and kneel poses inherit the same defect. These areas look like a torn/bald scalp, not a believable neat short haircut or a small intentional hair part, and remain obvious at NORMAL 720×1280 TikTok LIVE medium framing.

**Goal:** Keep the male's current short, calm chibi haircut identity and gentle side flow while making the BASE HAIR COVERAGE physically continuous/opaque against the actual scalp. Fix the large exposed patches and rough jagged seam. A subtle small hair-part detail may be visible as HAIR geometry/shading, but NO large pale exposed-skin region. Slightly refine the left/right ear and back rim if absolutely needed to avoid helmet appearance, without new spikes or large hair volumes.

**Authorize edits ONLY to** glTF hair mesh #6: existing hair base shell, overlapping short swept clumps, its hair material/normal behavior if actually necessary, and optionally hair-contained eyebrow submesh only if fully justified with a changed-region report. **Freeze everything else byte-for-byte:** both male poses' face/skin, closed eyes, sleeves, hands/palms/fingers, áo bà ba/placket/buttons/six palettes, waist, folded legs, foot, kneel, original SeatRoot placements, anchors, two 2s/17-keyframe idle samplers. Entire owner-approved female P0.5f cross, P0.5c kneel, P0.2 lotus and Sakura are frozen.

**Do NOT solve with** darkening skin, fake Photoshop/PNG, moving camera, hiding head under a black patch unrelated to hair, raising an oversized uniform helmet cap, hair texture only, new male face, paid assets, Codex code or deleting approved old evidence.

**STOP:** After two actual revised male GLBs, editable source and genuine Blender/Cycles evidence, STOP for SA review then explicit owner acceptance. PR #2 stays Draft. No Codex PR #3/#4, V2 integration, scene/camera/Event Engine, GPU/LIVE Studio tests or merge.

## 2. Repo / PR / exact SA-reviewed HEAD / original immutable binary facts

- Repository: https://github.com/nguyenbui5701/OnlinePagodaVer2
- Existing AI Visual PR #2 (Draft): https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2
- Branch: assets/lotus-pad-chibi-p0
- **Exact SA-reviewed new HEAD:** 9ff521549af8b8f1449579a4c7fd7ab6021c7e94 (owner push 66c3075..9ff5215). Refresh current remote HEAD before editing; report divergence. No force-push/reset or main modification from AI Visual workstream.
- **Formal SA Review P0.6b (new blocker):** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6011459874
- **New output folder ONLY:** Assets3D/Review/lotus_pad_chibi/p6c/
- **Original P0.6b folder to preserve:** Assets3D/Review/lotus_pad_chibi/p6b/. Original P0.6a, female, lotus and all earlier review evidence also immutable.

**Actual independently SHA-verified real binary GLB baselines on current HEAD**:

| Pose | Full filename under p6b | Bytes | Exact SHA-256 | Triangles / Meshes / Materials |
|---|---|---:|---|---|
| Male cross-legged | meditator_male_cross_prayer_p06b.glb | 589,264 | d6add5fdd5ec7122c24aee774c1ea10cc0588643842c891e334ffd30c60ce4cb | 18,380 / 10 / 21 |
| Male kneeling | meditator_male_kneel_prayer_p06b.glb | 455,680 | db78a1b26bff1cd2dced82d4ed4d4255280cfb6eb3db3ea2dd5ab5b5674c0701 | 18,420 / 9 / 21 |

Both have same 1,672-vertex / 3,080-triangle P0.6b hair identity, two idle clips (sit_idle + cross_prayer_idle or kneel_prayer_idle), 2 sec / 17 sample each, five anchors (SeatRoot, UpperBodyBreath, HeadAnchor, NameplateAnchor, FXAnchor), 21 materials, six original variant names: pastel_lilac / blush_rose / sage_green / sky_blue / warm_cream / terracotta. Non-hair raw mesh buffers and both original animation sampler arrays were **independently confirmed** unchanged between P0.6a and P0.6b, not just asserted by validation JSON.

**Approved immutable references:** Female cross p5f GLB SHA256 3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4; female kneel p5c SHA256 a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac; P0.2 lotus SHA256 80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9. Never regenerate them.

**Real owner Cycles P0.6b diagnostic shots already on PR**, immutable originals:
- p6b/P06B_Cycles_Evidence/p06b_cross_actor/p06b_cross_actor_hair_front_cycles.png — clearly exposes two beige irregular patches.
- p6b/P06B_Cycles_Evidence/p06b_cross_actor/p06b_cross_actor_hair_top_cycles.png — large jagged skin-colored strip from crown.
- p6b/P06B_Cycles_Evidence/p06b_cross_actor/p06b_cross_actor_hair_right_3q_cycles.png — patch from natural 3/4.
- p6b/P06B_Cycles_Evidence/p06b_kneel_actor/p06b_kneel_actor_hair_front_cycles.png — confirms identical failure for kneel.
- p6b/P06B_Cycles_Evidence/p06b_cross_pair/p06b_cross_pair_pair_medium_9x16_cycles.png and p06b_kneel_pair equivalent — failure visible under real lotus/phone frame.
- p6a/P06A_Cycles_Evidence old matching P0.6a hair front/back/top (smooth helmet before P0.6b).
- Original cameras: p6b/P06B_CAMERA_CONTRACT.json and p6b/blender_p06b_cycles.py, 32-sample Blender Cycles CPU, AgX EV0, original 720×1280 for 9:16. Reuse matching old shots/cameras for falsifiable A/B.

**Real Blender outcome on P0.6b:** 4/4 new Cycles case stdout files have actual [P06B_CYCLES_COMPLETED], 4/4 stderr files zero bytes, four editable .blend files, new PNGs and ZIP all exist on PR. P06B_ZIP_CRC_stdout.log reports PASS 87 files SHA256 7bedfe25e26bb766f0aa60a93912235df11f0d6bd58a21b4b2e70bff371ad3d4. This ZIP CRC and all .blend hashes **were not independently recomputed by SA**; treat the owner log as reported success only. Historic p6b README/manifest still have NOT_RUN entries before owner's upload — don't falsify; create a dated, additive audit.

## 3. Required reading ORDER before any sculpting

1. Design/07_WORK_RULES.md; Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md; Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md.
2. Design/11_3D_ASSET_PRODUCTION_PIPELINE.md; Design/13_3D_EVENT_INTEGRATION_CONTRACT.md; Design/10_GRAPHICS_PROFILES.md; Design/16_P0_APPROVAL_AND_HANDOFF.md; Task/00_P0_EXECUTION_ORDER.md.
3. Task/AI_VISUAL_11_MALE_SHORT_HAIR_REFINEMENT_P06B.md and formal SA P0.6b review URL above, P0.6a SA review https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6011115553. Owner requirement: same male/female chibi family, tidy short male hair.
4. Read full actual source p6b/build_male_hair_p06b.mjs, p6a/build_male_p06a.mjs, both real P06b GLBs, P06B_VALIDATION.json, asset_manifest.json, P06B_PHASE_A_FINDINGS.md, camera contract, source Blender projects, all actual hair front/top/3⁄4/9:16 Cycles and case reports/logs.
5. Owner-approved female GLBs and lotus for no-change reference; use previous camera contracts and source provenance. If the original video is unavailable in your session, do not claim to have checked its exact frames.

## 4. Evidence-based SA defect diagnosis / P0-P1 acceptance table

**Observed, not speculative:** In real P0.6b front/top/right 3/4/9:16 Cycles, unintended large light scalp-colored zones with jagged edges are visible inside the hairstyle. The rest of the male avatar remained unchanged and looks good. New version must close these unacceptable visible openings.

**Source mechanism is NOT proven yet, but must be investigated:** p6b/build_male_hair_p06b.mjs shellWarp() deforms original cap using negative grooves up to a -0.011 meter term; new open clumps bury strip boundaries about -0.0042 meter. Depending on scalp position, normals and camera, this may push the cap beneath skin or cause invalid surface overlap. Diagnose actual GLB triangles/material faces before deciding on the fix; do NOT simply state “bad shader”.

| Priority | Real problem / invariant | Required physical action | Independent proof / failure |
|---|---|---|---|
| **P0 ART** | Large jagged pale patches exposed through front/crown hair in BOTH male poses | Ensure an opaque continuous correctly outward-facing base HAIR shell under the styled locks; constrain grooves/lifts to leave sufficient separation from actual skin, eliminate self-intersections or face winding failures | Same-camera old P06b vs new P06c Cycles front/top/right 3⁄4 both poses, explicit no beige patch at all normal and macro sizes |
| **P0 ART** | A few visible ridges over a largely helmet-shaped scalp, old and new | Keep gentle 2–4 soft directional clumps but give correct physically layered/attached appearance, slightly tapered temple/ear/nape (no new bulky helmet or spiky haircut) | Hair macro left/right side, back, low-back, front/top, 9:16 medium+close; no obvious cap/skin cutout |
| **P0 TECH** | Cover continuity is unmeasured; image alone cannot determine cause | Diagnose local actual head-skin vs hair-shell **triangle ray order / screen-space occlusion** at problem region, signed scalp-shell clearance and inconsistent normal/winding; identify which cap/fan/clump triangles cause gap | Coordinates/barycentric ray samples or other proven method, sample camera rays from old failed views, exact/proxy labels and report min/max/negative clearance; annotated diagnostic texture/material IDs without faking normal renders |
| **P0 KEEP** | Original male P0.6a and P0.6b body, palms, foot, knee, 6 colors, breath all valid | Only hair mesh #6 may have changed POSITION/NORMAL/INDICES; preserve all other mesh primitives, sampler arrays, node anchors and materials/variant maps | Independently hash/compare raw accessor bytes P06b→P06c for BOTH GLBs, same 17-key clips and anchors |
| **P0 BOTH** | Same new male scalp/hair for crossed and kneeling versions | Export exactly one shared hair shape into TWO pose GLBs, no pose-specific differences | Compare full hair mesh coordinate/index arrays/normal SHA across both new GLBs |
| **P1 CROWD** | Large crowds under Sakura, strict asset cost | Prefer minor cap repair without adding many new independent materials/drawcalls; if possible retain one hair primitive; no extra visible hair parts that increase cost badly | Quantify bytes/verts/triangles/meshes/material, compare p6b and p6c; no invented FPS |
| **P1 SOURCE** | Historic p6b pre-owner-run documentation says NOT_RUN despite new uploaded Blender | New dated additive P06C_P06B_REMOTE_AUDIT.md with real SHA verified vs source-reported ZIP CRC, no revision of old evidence | Real GitHub file refs and case logs, explicitly distinguish SA-independent verification and owner-reported status |

**Do not treat scalp seam as aesthetically allowed merely because it could be an intentional hair part.** The current pale areas are much wider than a subtle part and have jagged margins. If true hair part is used, it must have a smooth intentional narrow boundary and be visually subtle at TikTok frame size. Safest preferred option is **hair-colored underlayer supporting visible groomed clumps; no visible pale scalp**.

## 5. Mandatory four Sakura phases

### Phase 1 — real geometry audit and patch hypothesis, before modifying

- Recheck PR HEAD, independently verify frozen p6b cross/kneel SHA. Inspect current real Blender P0.6b source and images to locate exact skin patches in actor + pair front/top/right3Q and 9:16. Identify relevant mesh IDs, material IDs, scalp/head surface, hair base shell and the three new clumps.
- Run a true diagnostic: camera rays through skin-patch pixels, first-hit material/mesh classification, hair-shell vs head-skin triangle clearance at nearby matched XZ or directional normal samples, shell inverted/degenerate triangle count and double-sided status; report what method is exact and what is sampled proxy. Determine whether the cause is inward groove, shell penetration, inverted normals, missing triangle or overlapping patch border. Do not claim it from PNG alone.
- Create p6c/P06C_PHASE_A_FINDINGS.md: SA photo + source GLB area → plausible physical cause → measured finding → minimal hair change and physical non-intersection invariant → new matched camera acceptance shots.
- No body, knee, palette, hand or leaf re-evaluation unless data unexpectedly changed.

### Phase 2 — ONE focused true 3D scalp-cover fix in TWO GLBs

- Export p6c/meditator_male_cross_prayer_p06c.glb and p6c/meditator_male_kneel_prayer_p06c.glb (true importable glTF2), retaining previous unchanged pose and one same male identity.
- Base on EXACT SHA-pinned P0.6b binaries using a deterministic incremental local Blender/Node builder, editable Blender authoring asset, and frozen original female/lotus references. Only hair primitive #6 and optionally hair material properties if truly required; all other meshes, anchors, animations and variant mappings remain byte-identical.
- Preferred correction: keep aesthetically smooth original hair-colored cap *outside actual skin* with continuous triangular coverage; shallow/soften or relocate any groove that digs below scalp, align the 3 clump border burial and winding/normal with base shell (not under the head skin), make a credible subtle side-swept visual ridge. If needed, reduce to 1–2 softer strands rather than adding distracting patches. No visible scalp holes or flat opaque cover sticker.
- For each output, calculate SHA256, bytes, triangles/vertices, mesh/materials, cap vs skin coverage and old/new edited hair positions; confirm no non-hair accessor changed, both pose hair arrays identical, 2 sec/17 keys and 6 palettes unchanged. Avoid invented proof when only nearest vertices are checked.

### Phase 3 — true exported GLB Blender Cycles A/B and scoped physical checks

- Reimport ACTUAL final P06b and P06c exported GLBs into Blender. Match exact old p6b/P06B_CAMERA_CONTRACT.json front, top, hair_right_3q, left/right side, back, low-back, hair_quarter, with unchanged light positions/world, Cycles CPU 32 samples, AgX 0EV, both poses.
- **Required A/B close proof:** side-by-side BEFORE and AFTER at **old FAILING front/top/right3⁄4** angles, showing whole hair region with no beige skin holes or jagged torn-like part. Include front/back/left/right and new diagnostic hair-shell overlay/cross-section, clearly labeled DIAGNOSTIC rather than cosmetic acceptance render.
- Required full 720×1280 **9:16 medium AND close** of BOTH male poses seated on **original frozen lotus**, same camera and placement as P0.6b pair. Hair must read as short tidy chibi male when small, with NO scalp exposure at mobile size; compare with approved female family.
- **All five idle times** t=0.0 / 0.5 / 1.0 / 1.5 / 2.0 for hair front/quarter and 9:16 if needed; verify no hair-face/eyebrow/ear or hair/collar clipping/popping. Body/seat/palm Cycles from p6a remain valid if non-hair exact unchanged; do not rerun whole old suite wastefully.
- Render per-case real PNG/Blender original .blend with SHA256 bytes, Blender version, camera/light samples, actual input GLB SHA, stdout/stderr, FILE_HASHES_SHA256.txt, ZIP and truly executed CRC. Missing Windows runs must be labeled PENDING_OWNER_RUN instead of PASS.
- Machine validation should include the **negative case:** old P0.6b should show scalp visibility in the failing camera region while P0.6c should not (or an equivalent coordinate-scoped human-reviewable mask). A camera crop that excludes the region is a FAIL.
- No native Three.js/GPU/LIVE pass without independent run. Full Blender simulation on two real GPUs not needed for this art micro-task.

### Phase 4 — PR #2 versioned source/binary handoff and STOP

- Commit NEW p6c/ README.md, P06C_PHASE_A_FINDINGS.md, P06C_SCALP_COVERAGE_REPORT.json, P06C_STYLE_COMPARISON.md, P06C_CAMERA_CONTRACT.json, P06C_VALIDATION.json, P06C_CYCLES_AUDIT.md, P06C_P06B_REMOTE_AUDIT.md, asset_manifest.json, LICENSE_AND_PROVENANCE.md, BINARY_HANDOFF.md, deterministic source and tested owner Windows Blender runner.
- Large GLB, .blend, Cycles PNG and ZIP may be pushed later by owner, with precise target repo-relative paths and *actual measured* SHA256/bytes and clear pending_owner_upload until remote verified. Do not overwrite p6a/p6b/female/lotus or touch Codex branches; no force push or merge.
- Return full new HEAD/branch/PR link, changed files and exact before/after metrics; SHA/bytes, triangle/material/animation/anchor comparisons; matched genuine Cycles A/B, 9:16 and five idle frames; owners' PowerShell steps and remaining NOT_RUN/PROXY_ONLY statuses.
- **STOP** at SA independent review → owner visually accepts BOTH male poses/hair. Do not start integration work automatically.

## 6. Formal SA acceptance checklist

- [ ] BOTH poses have NO LARGE PALE/JAGGED SCALP PATCH in the original P0.6b failing front/top/right3Q views and at normal 9:16 medium/close on frozen lotus.
- [ ] Hairstyle still short, softly directed and visibly groomed; no helmet, floating strips or excessively realistic strands; front/side/back/top consistent.
- [ ] Actual surface/scalp clearance or first-hit ray diagnostic for the exact old failing area proves genuine coverage; not only changed hair color, camera or Photoshop.
- [ ] Two new GLB2 SHA/bytes/meshes/tris/material/6 variants, same cross+ kneel male hair geometry, all non-hair glTF arrays & anchors & 17-key idle matches p6b, frozen female/lotus untouched.
- [ ] Real reimported Blender Cycles same camera/light A/B, both poses and 720×1280 medium+close, all five idle no clipping; source/editable .blend and genuine per-image/log/ZIP CRC evidence.
- [ ] True zero-cost source/license, no separate unrelated task; PR #2 still Draft; no Codex/integration/merge.
- [ ] Final code P06C_MALE_HAIR_SCALP_COVERAGE_OWNER_REVIEW_REQUIRED after evidence handoff until SA review then owner GO. If skin still shows, ART_FAIL even if glTF tests PASS.

## 7. Mandatory Sakura handoff response format

1. SA finding (specific old pixels/view) → actual hair mesh cause and fix → measured ray/triangle/normal evidence → same-camera old/new real Blender Cycles → PASS/PARTIAL/FAIL.
2. Blender/Node versions, provenance/zero paid cost, 2 new actual male GLB SHA256/bytes/vertices/triangles/materials, frozen p6b baseline hashes and exact non-hair/animation/anchor/6-variant equality.
3. Both edited .blend and true Cycles actor/lotus hair comparisons (front/top/right3Q + all-around/9:16 and 5 idle frames), case hashes/logs/ZIP CRC, diagnostic scalp coverage report.
4. Feature branch, new HEAD, PR #2 updated files, owner upload/run commands, remaining blockers/not-runs and clear SA/owner gate request.
5. Explicit STOP state P06C_MALE_HAIR_SCALP_COVERAGE_OWNER_REVIEW_REQUIRED. Do not start next stage.

**We are repairing a concrete visual defect introduced by P0.6b, not reopening any approved character design.**
