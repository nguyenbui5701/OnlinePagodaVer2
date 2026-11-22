# AI VISUAL 14 — P0.7b Male Side Part 7/3 Hairstyle Variant (TWO POSES, HAIR ONLY)

> **SA REVIEW ADDENDUM — 2026-11-22 — P0.7b owner-upload HEAD `f2cbaac94c9168fb080f2dcedb4f1ae42a2e1e41`: CURRENT ACTIVE DIRECTIVE.** Formal [SA PR #2 review #6012609301](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6012609301) is **TECH PASS / ART PARTIAL (not approval)**. The reviewed range `eecad79..f2cbaac` adds **143 files, ALL under `p7b/`**: 106 Cycles/smoke PNGs, eight editable Blender paths (four smoke + four full), a real ZIP, log/JSON/SHA evidence. **No new GLB or runtime files in the reviewed range;** the existing two genuine P07b GLBs were already uploaded earlier. **Independent downloaded GLB binary SHA-256 PASS:** cross `1238f5fba9f7cfea0c550fabdc26446905f6e403e558793fb726251d4fec08cb` (589,864 bytes), kneel `2bb7430c4da4c58c6ee986a741ff79d3865f581c046003ce0770e80af345b3f2` (456,280 bytes). Nonhair POSITION/NORMAL/index accessor arrays unchanged from P06c (27/27 and 24/24), animation sampler bytes unchanged (4/4 each), same new hair arrays both poses, tris unchanged (18,380/18,420), 21 materials. Only native node delta is the permitted new hair node name #12, no anchor drift. **Four new genuine imported GLB→Blender 4.5.16 LTS CPU Cycles cases completed** at 32 samples; actual original 9:16 medium PNGs, multi-angle, 5 idle timestamps and true per-case logs/case JSON available on PR. Owner ZIP log reports `[P07B_ZIP_CRC_PASS]` 113 files, ZIP SHA `0acba62398a97931d05b2076058f4251688ef085f543f3bcca160b19778af31f`; ZIP CRC/.blend actual binaries **not independently replayed/loaded** by SA. Existing `p7b/README.md`, `P07B_CYCLES_AUDIT.md`, `asset_manifest.json`, `P07B_STYLE_A_B.md` still show original PRE-UPLOAD `NOT_RUN/PENDING_OWNER_RUN`: do **not** retroactively rewrite history; append a factual `p7b/P07B_OWNER_REMOTE_AUDIT.md` for upload verification, with independently checked GLB and only owner-reported ZIP CRC. **P0 ART BLOCKER from real P06c→P07b SAME CAMERA:** at actor front, top, both 3Q and 720×1280 phone cross/kneel, hair still reads like the same short rounded helmet with three raised ribbons (dark detached-looking line at strand edges), **not a clearly off-center, asymmetric 7/3 part with broad majority and smaller minority**. Numeric mean radial displacement is not proof of new visual identity. SA does **NOT** claim broken GLB, scalp hole or body clipping. **FOCUSED OPTIONAL ART CORRECTION REQUIRED FOR SA ART PASS:** create new `Assets3D/Review/lotus_pad_chibi/p7b1/` (not overwrite `p7b/`), hair-only organic asymmetric 7/3 geometry: part character RIGHT +X, sweep LEFT −X, legible hairline split and 70/30 volume even at normal phone scale, clean integrally blended swept forelock without separate dark-rim pasted strips; rounded gentle chibi style, no bald skin, harsh barber edge or spikes. Preserve immutable P06c nonhair geometry/sampler/anchors/6 palette, accepted P07a1 undercut, female, lotus and all previous Cycles. **NO rerun any P0.2/P0.5/P0.6/P0.7a/P0.7a1/P0.7b Blender** for immutable files, nor rerun passed checks. First new-art cross front/top/left-right 3Q/720×1280 medium + kneel front/medium **smoke P07b1 only**; compare against existing P06c/P07a1/P07b PNGs with verified same camera. Only if visual read passes, render **FOUR NEW P07b1 cases** (cross/kneel × actor/pair), necessary top/side/ear/nape, 720×1280 medium/close and sampled idle, exported GLB reimport into true Cycles with .blend source, hashes, logs, and new ZIP CRC. Quantify any hair topology/material increase if necessary. No integration/Codex/merge; STOP FOR SA RE-REVIEW then explicit owner ART GO. **Current gate `P07B_SIDE_PART_73_ART_REVISION_REQUIRED`**. Owner alone may decide to accept current artwork as in prior undercut; do not presume that decision. No physical git checkout proven; verification used connected GitHub API and original Cycles PNGs.


**SA assignment:** 2026-11-22 — **ASSIGNED after explicit owner art decision**. **Workflow is mandatory:** SA giao task → AI Visual làm GLB + editable Blender + real Cycles → SA review → **owner duyệt P0.7b** → only then next stage. Read and obey `Design/07_WORK_RULES.md`. This file is the **authoritative standalone production task**, not a vague styling suggestion.

## 1. Role, one objective, scope and STOP / GATE

**Role:** independent **AI Visual / Blender 3D asset artist**, NOT Codex.

**Owner decision just received:** “tiếp tục chuẩn bị làm side part 7/3. Hiện tại vậy là đc rồi” after reviewing P0.7a1. Owner **accepts current P0.7a1 undercut ART appearance and authorizes preparing P0.7b**. Earlier SA formal review `ART PARTIAL` for undercut remains a truthful historical technical/art evaluation; **owner's new acceptance resolves the old undercut art iteration gate**. Do **not** make P0.7a2 or re-open undercut changes. This is **not** PR merge/integration approval or auto-SA/owner approval of the NEW side part.

**One task only:** create a **distinct male SIDE PART 7/3 (rẽ ngôi lệch ~70/30)** additional hairstyle option for **two existing male prayer poses**:
1. cross-legged prayer (ngồi xếp bằng chắp tay);
2. kneeling prayer (quỳ gối chắp tay).

The new option should feel tidy, soft, modest, calm and compatible with the existing rounded chibi / áo bà ba / lotus-garden, not an aggressive salon cut. **Recognizable 7/3 parting**, not merely the same three short raised grooves from P0.6c, nor a renamed P0.7a1 undercut. Upper forelock and swept mass on the majority side, a visible but **hair-covered** off-center part boundary, narrower restrained minority side, and softly tapered sides/back. 70/30 is a visual design **ratio**, not a requirement to measure exactly 70% of vertex counts.

**Authorized edits: HAIR ONLY** on newly exported male assets, including hair geometry, normals, hair shading/material strictly as necessary. **Immutable:** original male face/eyes/eyebrows/skin/ears/expression, prayer fingers/hands, body, áo bà ba and SIX color mappings, two poses, feet/knees/lotus contact, animations and keyframes, anchors and transforms, camera runtime; all female, lotus, Sakura, historic files and PRs. Do not use hair recolor/texture-only or changing head/scalp color to fake the split.

**Hard STOP:** after genuine two GLBs, editable Blender, real exported GLB→Cycles A/B, exact manifest and validations, PR #2 handoff → **SA review → owner ART GO**. No automatic P0.7c/P0.8, Codex PR #3/#4, V1/V2 app or TikTok integration, GPU/LIVE Studio tests, merge, side quests.

## 2. Repo, Draft PR, pinned reviewed HEAD, immutable baseline, output

- Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2
- Existing **Draft PR #2:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2
- AI Visual feature branch `assets/lotus-pad-chibi-p0`.
- **Exact reviewed head at issuance:** `c96b06372587134e38468388edaa60915f90a3bf`. AI Visual must `git fetch` and **report actual current HEAD before edits**; if diverged, inspect delta first. Do not claim later commits reviewed by SA.
- **Choose neutral base**: immutable original owner-accepted male **P0.6c** cross/kneel, **NOT P0.7a1**, because a 7/3 classic side part is a separate design option, not a modification of the accepted undercut. Source files:
  - `Assets3D/Review/lotus_pad_chibi/p6c/meditator_male_cross_prayer_p06c.glb` — SHA256 **`c9d1513bad21398fd776776cad97791cfa76a591d641838f885596d13f120ea4`**, **589,656 B**.
  - `Assets3D/Review/lotus_pad_chibi/p6c/meditator_male_kneel_prayer_p06c.glb` — SHA256 **`38e47f84b6b4f8987a47b39e791aaa06c3fed2d4d03e11e55fc72f0ef926c4ad`**, **456,072 B**.
  - Frozen original lotus P0.2 `p5f/p02_baseline/lotus_pad_01.glb` — SHA256 **`80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`**. Before running, verify actual path and SHA, and stop/report if file is absent.
- **Reference only (must stay unchanged):** owner-accepted undercut `Assets3D/Review/lotus_pad_chibi/p7a1/`: cross SHA `ffdb92adf27d8fa14ee2a12dbca57cd71c888f1b9023019761940c460151c09e` (590,476 B), kneel SHA `56de649df89ba124e5a546fe6981cbffd80193a5b858e0d4ae8b1ab444c316b4` (456,892 B). Those are SHA-confirmed real GLBs from SA re-review HEAD above; use only for non-overlap artistic comparison.
- **NEW versioned folder only:** `Assets3D/Review/lotus_pad_chibi/p7b/`. Two canonical new filenames:
  - `meditator_male_cross_prayer_sidepart73_p07b.glb`
  - `meditator_male_kneel_prayer_sidepart73_p07b.glb`
- **Absolutely no overwrite** to `p6c/`, `p7a/`, `p7a1/`, `p5f/`, or historical rendered files/ZIPs and their SHA manifests.

## 3. Required reading order and evidenced baseline

Read **before edit**, in order:
1. `Design/07_WORK_RULES.md`, `Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md`, `Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md`.
2. `Design/11_3D_ASSET_PRODUCTION_PIPELINE.md`, `Design/13_3D_EVENT_INTEGRATION_CONTRACT.md`, `Design/10_GRAPHICS_PROFILES.md`, `Design/16_P0_APPROVAL_AND_HANDOFF.md`, `Task/00_P0_EXECUTION_ORDER.md`.
3. `Task/AI_VISUAL_10_MALE_CHIBI_PRAYER_P06A.md`, `Task/AI_VISUAL_11_MALE_SHORT_HAIR_REFINEMENT_P06B.md`, `Task/AI_VISUAL_12_MALE_HAIR_SCALP_COVERAGE_P06C.md`, `Task/AI_VISUAL_13_MALE_UNDERCUT_VARIANT_P07A.md`.
4. [SA re-review at exact last HEAD, P0.7a1](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6012362849). **Owner subsequently accepted P0.7a1 and requests next hairstyle**, overriding further *aesthetic rework*, not rewriting earlier SA observations as PASS.
5. Real `p6c/` two GLBs and its build/validation scripts, `asset_manifest.json`, `P06C_CAMERA_CONTRACT.json`, `P06C_Cycles_Evidence/`, screenshots and latest `p7a1/P07A1_Cycles_Evidence/` actual source, scripts, case JSON, 9:16 and front/top/side/3Q/back images. Reuse frozen P0.6c evidence; **do not run Blender for old P releases**.
6. Owner-supplied `chuav2.mp4` only as scene mood reference **if actually available**; the 7/3 hairstyle is owner-requested, not asserted to appear in video. Unavailable content = `UNAVAILABLE`, no invented analysis.

**SA verified** P0.7a1 GLB technical invariants: 27/27 cross and 24/24 kneel nonhair accessor arrays byte-exact to P0.6c, animation samples exact, same hair both poses, 18,380 and 18,420 triangles, 21 materials. P0.6c has exactly 6 áo bà ba variants `pastel_lilac`, `blush_rose`, `sage_green`, `sky_blue`, `warm_cream`, `terracotta`, animations `sit_idle` and `cross_prayer_idle` / `kneel_prayer_idle`, five anchors `SeatRoot`, `UpperBodyBreath`, `HeadAnchor`, `NameplateAnchor`, `FXAnchor`, 2s / 17 samples (verify current real GLB). Old undamaged frozen female and lotus assets stay untouched. Do not infer P07b performance from P07a1.

## 4. Grounded SA findings: aesthetic goals and failure tests

**Decision on old work:** P0.7a1 **OWNER VISUAL ACCEPTED**; its technical GLBs SHA PASS and owner-run Cycles evidence exists. DO NOT spend time rebuilding P0.7a2, rerunning P0.6c, undercut, female or lotus Blender, or retesting unchanged body/palm/feet unless a new artifact truly changes. The **only new visual demand is P0.7b**.

| Priority | What must be visible in P0.7b | Implementation direction | Clear FAIL |
|---|---|---|---|
| **P0 identity** | Recognizable clean 7/3 side part from front, quarter and 720×1280 phone close/medium | Move the hair visual mass (~70%) to one side with a coherent long swept forelock and smaller (~30%) side; show a gentle off-center hair part at consistent head X across front/crown/top; sculpt actual geometry | Same old three parallel grooves, centered part, symmetric mushroom/helmet cap, or imperceptible change after phone downscale |
| **P0 scalp** | Continuous hair/skin coverage around parted line and both temples/crown | Groove or layered strands may reveal *subtle dark hair root*, but no wide beige scalp/gaps; use opaque legitimate hair mesh with soft transitions | Pale jagged holes or a bald 7/3 part, floating detached strip or see-through seams |
| **P0 chibi mood** | Rounded, neat, quiet Vietnamese classic boyish tidy 7/3 with modest height | Smooth individual direction, no stiff vertical quiff, no excessive shaved fade or hard barber stripe | Aggressive slick-back/salon spikes, oversized wave covering eye, high-shine oily styling |
| **P0 two poses** | Exactly same side selection and 7/3 hairstyle identity in both cross and kneel | One canonical hair builder/geometry reused across two exported GLBs, preserve head local coordinates | Different hair direction/sculpt in poses |
| **P0 freeze** | Full untouched identity/poses/animation/6 áo bà ba variants/anchors and female/lotus | Binary compare *actual* P0.6c→P0.7b all nonhair accessors, native sampler arrays, material variants, anchor nodes/meshes | Any drift in face/brows/body/hands/feet/outfit/lotus or animations |
| **P1 cost** | Chibi low-poly practical for eventual live crowd | Reuse materials, avoid extra drawcalls; justify real delta if topology needed | Unreported substantial tris/mesh/material inflation, fake RTX FPS or unsupported runtime claim |

**Art contract cameras:** true front, top (part direction), left/right profile (asymmetry), left/right 3Q, back, low-back/ear macro, 720×1280 original-lotus medium and close for BOTH poses. **Same camera, light, target, material/EV, render size** as original P0.6c proofs, with transparent documentation if a baseline camera is unavailable. **A/B must also show P0.7a1 as STYLE REFERENCE only** at least front and medium phone image; no new undercut render. Long side of 7/3 can be on artist-selected camera-left or camera-right **once**, but must remain fixed in every deliverable and named in report.

## 5. Four mandatory Sakura phases

### Phase 1 — inspect baseline, precise hair sculpt plan

1. Refresh actual PR HEAD and acquire real P0.6c GLBs, P0.7a1 style images, original P0.2 lotus, relevant original camera contract. Compute actual source SHA-256 and bytes; fail fast if mismatch. Build one stable hair-local coordinate / part direction from existing X/Y/Z axis; report e.g. **part offset to character's right, sweep left** (or inverse), and never flip in kneel.
2. Inspect hair mesh index/name and eyebrow sharing. Some hair primitives from baseline may include **eyebrow vertices**; explicitly detect and freeze exact raw eyebrow POSITION/NORMAL rather than accidentally changing eye expression.
3. Describe actual change: off-center part *geometry*, long majority-side curved volume from parted point along forehead/top, subdued smaller wing, temple and nape contact. Quantify top/brow/temple clearances using sampled rays only; label estimates `SAMPLED`, not exact continuous collision proof.
4. Commit `p7b/P07B_PHASE_A_FINDINGS.md`: source SHA, observed P0.6c vs P0.7a1 silhouette, chosen 7/3 direction, hair zones to modify, camera/phone criterion and precise preservation matrix. STOP and ask SA if inputs are missing or contract conflict.

### Phase 2 — build two new TRUE GLBs, hair-only

1. Create `p7b/build_male_sidepart73_p07b.mjs` or reproducible Blender script/source (Node/Blender free only), based on SHA-pinned **P0.6c** for both poses. **Do not** clone existing P0.7a1 undercut into the new haircut. Use the same canonical hair pattern/arrays for both pose exports, and physically model a side part, not only a painted or single thin central split.
2. Retain non-hair raw accessors **byte-for-byte**, eyebrow geometry if it shares hair mesh, six KHR_materials_variants names/maps, 5 anchor node names/transforms, 2 original animation clips/sampler arrays (2s/17 frames), skin/face/ear/palms/feet, lotus. Export native glTF2 GLB2. If topology/material changes, list and justify measured additions.
3. Output two files under `p7b/`: `meditator_male_cross_prayer_sidepart73_p07b.glb` and `meditator_male_kneel_prayer_sidepart73_p07b.glb`. SHA-256 and bytes calculated on actual written files. Verify same new hair POSITION/NORMAL/indices across both poses or explain true topology split, and no missing/invalid face normals.
4. Generate `P07B_VALIDATION.json`, `P07B_HAIR_SCALP_REPORT.json`, `asset_manifest.json`: cross/kneel source/output SHA, triangles/vertices/meshes/materials, all baseline protected accessors/animations/anchors/palettes comparison, sidepart side selection, sampled hair/skin first-hit rays front/top/L/R3Q and min distances to ears/collar. Correctly distinguish source checker claims from independent SA verification.

### Phase 3 — only NEW GLBs Blender Cycles (no redundant old Blender)

**Major efficiency correction requested by OWNER:** Prior P0.7a1 `run_p07a1_blender.ps1` ran **8 cases** (four unchanged P0.6c baseline + four new) in BOTH `quick` and `all`, deleting output. This repeats proven scenes. **Do not reuse that destructive pattern.** Frozen baseline owner-uploaded P0.6c A/B PNG/camera/lighting/case evidence remain valid if file SHA and contract unchanged.

- **Phase 3A: inexpensive acceptance smoke** on **new GLBs only**. Cycles cross: hair front, top/quarter, both side profiles, back and original-lotus 720×1280 medium; kneel: hair front + 720×1280 medium. **Look first**: can a reviewer clearly identify 7/3 vs baseline and undercut without filename labels? Does parting line avoid bald patch? If no, revise hair geometry **before** full multi-camera and idle runs.
- **Phase 3B: complete if Phase 3A visually convincing**. Run exactly **FOUR NEW real GLB→Blender Cycles cases**: `p07b_cross_actor`, `p07b_cross_pair`, `p07b_kneel_actor`, `p07b_kneel_pair`. Actual exported GLB must be imported into Blender, placed with SHA-pinned P0.2 lotus for pair; no source-only concept render. Match prior P0.6c camera/light/exposure/AgX and target 720×1280; documented CPU 32 sample reference is allowed, do not silently substitute external engines.
- For each pose actor: hair front/top/left/right/left3Q/right3Q/back/lowback/temple/ear close. For each pair: original lotus front/side, **720×1280 medium + close**. For new exports validate 5 idle stages at `0, 0.5, 1.0, 1.5, 2.0` in targeted hair front/quarter/profile + one phone view per pose; check no hair/scalp/ear/collar clipping/popping. Do not repeat unrelated old-body/lotus/female suites.
- **A/B use existing P0.6c and P0.7a1 PNGs**, not Blender rerenders; provide links to original immutable SHA and cases and exact matched camera matrix/samples/exposure for each new P07b shot. State `MATCHED` only where actually same settings. At least front, top, right3Q and 9:16 medium should be side-by-side visually reviewable P0.6c vs P0.7b; undercut as third style sample, without rerender.
- Deliver **four NEW editable .blend** files from real new GLB imports or single actual editable source + four genuine scene blends, true per-case PNGs and `case_report.json`, stdout/stderr, hash/bytes for every render and source, `P07B_Cycles_Evidence/`, ZIP and actually executed CRC. Log revision and true render engine/version, no simulated renders. **Do not delete/rewrite ANY P0.6c/P0.7a/P0.7a1 folders**. Renderer should have `-NewOnly` behavior by design; fresh P07b output folder and fail/backup rather than silently wiping owner evidence.
- If Blender unavailable, report `NOT_RUN`, manifest `pending_owner_run`, supply exact safe **Windows PowerShell** runner with source GLB/lotus hash validation. No fabricated `.blend`, images, scene benchmarks, or `PASS`.

### Phase 4 — versioned PR handoff, SA/owner gate

**Small text assets** to commit to branch `assets/lotus-pad-chibi-p0` on existing Draft PR #2 (no duplicate PR):
- `p7b/README.md`
- `p7b/P07B_PHASE_A_FINDINGS.md`
- `p7b/P07B_STYLE_A_B.md` (P0.6c vs P0.7b, P0.7a1 style reference, explicit art findings)
- `p7b/P07B_VALIDATION.json`, `p7b/P07B_HAIR_SCALP_REPORT.json`
- `p7b/P07B_CAMERA_CONTRACT.json`, `p7b/P07B_CYCLES_AUDIT.md`
- `p7b/asset_manifest.json`, `p7b/BINARY_HANDOFF.md`, `p7b/LICENSE_AND_PROVENANCE.md`
- `p7b/README_WINDOWS.md`, production/export/validator and *non-destructive new-only* Blender runner + SHA/ZIP CRC validation scripts.

**Large true assets**: two P07b GLBs + actual .blend + owner-run new Cycles originals/ZIP where feasible; owner may upload binaries into *same existing Draft PR branch* using Git LFS under repository policy. Give **real measured** SHA-256, bytes, exact repo-relative paths and `pending_owner_upload` status until actually observed on GitHub. Source docs do not substitute for missing binaries. After push, link actual new HEAD and evidence paths; don't call remote ZIP or CRC PASS until truly verified.

**Provenance**: 0 VND paid tools, licensed original/procedural Blender or free commercial assets only. Do not install/call paid generation services without owner signoff. No performance claims on 3050Ti/3060 without measurements.

**Git/handoff:** Never edit `main` or V1 from AI Visual, never force-push/merge; PR #2 stays Draft. Never touch runtime source or Codex PR #3/#4; no integration until separate explicit owner approval.

## 6. Explicit pass/fail table for SA review

- [ ] **P0 7/3 aesthetic:** Visible off-center split with one clearly dominant swept side and smaller opposite side, natural crown/back transition, looks **distinct** vs both P0.6c short-hair and P0.7a1 undercut in identical front/3Q and 720×1280 original-lotus medium; no harsh barber/helmet/crazy spikes.
- [ ] **P0 coverage:** No pale scalp hole at part/crown/forehead, no jagged hair edge, no ear/eyebrow/eye/collar clipping at all required shots and five animation timestamps. Finite ray findings truthfully labeled samples.
- [ ] **P0 dual pose:** Two real imported GLB2, canonical same hairstyle direction and hair raw data, SHA256/size/native structural reports, no new face/eyes/clothes/body/palms/feet change.
- [ ] **P0 freeze:** Nonhair glTF accessor raw bytes exact vs P0.6c for both poses, original animation inputs/outputs/anchors and six variants stable. All old folders and original GLBs untouched.
- [ ] **P0 Cycles:** True exported new-GLB Blender Cycles (not screenshots from source-only concept), *four only new* actor/pair cases, originally approved lotus and 720×1280 medium+close, original frozen old A/B images reused, editable Blender sources, per-image file hashes, logs and owner-run ZIP CRC.
- [ ] **P1 cost/provenance:** Geometry/drawcall delta quantified, original/0 VND tools, staged binary handoff truthfully reported.
- [ ] **Gate:** SA independent review of new revision then **owner explicit P07b acceptance**. Technical PASS by AI Visual is not SA/owner approval.

## 7. REQUIRED completion message — exact Sakura style

Report, compactly and with authentic evidence:
1. **SA finding → change implemented → measured 3D proof → real Cycles view → PASS/PARTIAL/NOT_RUN/FAIL**, separately for both poses. State chosen part side (character left/right).
2. Two new P07b GLB filenames + actual SHA-256/bytes/vertex/triangle/mesh/material values; compare true P0.6c nonhair accessors, eyebrow subranges, animation and anchors/6 colors; canonical hair across 2 poses.
3. Real Blender source paths, exactly four **new** actor/pair cases (not 8), 720×1280 medium/close, front/top/side/3Q/back and five idle points; matching baselines with existing P0.6c/P0.7a1 images, logs, ZIP CRC, Blender version and cost 0 VND.
4. PR #2 URL, feature branch, exact **NEW** HEAD, changed files; list `pending_owner_upload` separately with Windows PowerShell commands if any.
5. Any blocker/known limitations, **STOP — `P07B_SIDE_PART_73_SA_REVIEW_REQUIRED`**. Await SA review and owner visual acceptance. No new workstream or merge.

**Authority:** user explicitly accepts current P07a1 appearance, not an approval of P07b. Under all conditions the current Draft PR remains unmerged until new SA and owner gates.
