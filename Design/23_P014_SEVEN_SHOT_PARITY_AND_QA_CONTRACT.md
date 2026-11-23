# Design 23 — P0.14 Seven-Shot Parity & QA Contract

> **2026-11-23 / Owner P0.13-A Visual GO.** Following [P0.13-A formal SA Tech PASS #6018488791](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/13#pullrequestreview-6018488791), Owner explicitly responded “duyệt, tiếp tục”, accepting the current P0.13-A original, abstract gift choreography **only** at exact [PR #13](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/13) HEAD **`0810f537a7cbffd539c8acb9b8cd6ba2715bbc9f`**. Record `OWNER_P013A_VISUAL_GO`; do **not** infer full-reference video fidelity, original rose art approval, merges, RTX or LIVE authorization.
>
> Per [Owner-approved Design 17 roadmap](17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md), advance from P0.13 staged gift to **P0.14 full reference shot-parity / QA**, not an unsolicited new 3D art phase. The original rose-in-ring, distant mountain silhouettes and other art gaps remain **clearly deferred**; commission original art later only by a separate SA/Owner decision. This contract authorizes one focused **Codex 10 Viewer-only** scoped PR.

## 1. Owner decisions, source truth and role assignment

- **Rules:** [Design/07](07_WORK_RULES.md), [Design/09](09_GIFT_CAMERA_DIRECTOR.md), [Design/10](10_GRAPHICS_PROFILES.md), [Design/13](13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/14](14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/16](16_P0_APPROVAL_AND_HANDOFF.md), [Design/17](17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md), [Design/18](18_P012_LOTUS_COMMUNITY_SCOPE_AND_GATES.md), [Design/20](20_P012C_BOTANICAL_RUNTIME_INTEGRATION_CONTRACT.md), [Design/21](21_P012D_CHARACTER_DIVERSITY_CONTRACT.md), [Design/22](22_P013_GIFT_BLESSING_CHOREOGRAPHY_CONTRACT.md).
- **Frozen Viewer base:** PR #13 branch `feature/v2-p013a-gift-blessing`, **exact commit `0810f537a7cbffd539c8acb9b8cd6ba2715bbc9f`**, stacked on approved PR #12 `385816518987b2a0ea6ef094bb0f65bfb363e720`. PR #13 remains OPEN/unmerged. Its FX technical PASS and Owner Visual GO apply to actual P0.13-A visuals **without** certifying original rose glyph parity.
- **Approved, immutable scene:** original R16 Sakura, P02 2.083m pads, approved P07b1 male and P05f female real KHR_materials_variants palettes, ECO/QUALITY bloom/bud GLBs from PR #10, 12 deterministic visual positions, **3 real-capable seats + 9 anonymous decorative figures**, twilight/water, bounded gift particles, source-verified request/room/actor/seat FIFO A→B→C, no-seat Duyên text-only fallback, original camera continuity and return.
- **SA owns** shot map, scope, qualitative objective ratings, acceptance gates and review. **Codex** performs viewer-source read, 9:16 native WebGL capture/audit, **only demonstrated** camera/view/profile-level corrections, tests/regression/performance in new branch. **AI Visual** alone owns any **new** 3D models/icon/sprites if separately approved in future; no asset generation in this task. **Owner** judges the actual moving P0.14 9:16 visuals after SA Technical PASS.
- **Important limitation:** Original reference clip `chuav2(1).mp4` informed the human SA's documented descriptions in Design 17, but video **bytes are not in the GitHub repo**. Codex must never claim it independently inspected or extracted frames from that unavailable video, nor generate fabricated "reference" stills. If Owner later explicitly supplies the clip, a separate authorized apples-to-apples frame audit is possible; until then report **reference-description fidelity**, not pixel/video identity.

## 2. Scope: composition and quality only, not new scene content

Seven **reference moments** are **timestamps in the original video**, **NOT automatically equal** to elapsed milliseconds in our DEMO. Each moment maps to an **intent/shot class** and a **deterministic native viewer pose at a named scenario/seed/snapshot state**, with the mapping published. Do not naively compare reference 22.5s to our DEMO 22.5s if gift timing differs; use existing snapshot actor/time and a recorded review camera pose.

| Reference timestamp | Shot key | Source-derived content and grounded PASS intent | What must be measured/checkable |
|---|---|---|---|
| **00:01** | `HERO_CLOSE` | One large seated foreground actor on P02, low 3/4, dark water, at least some distant layer/lotus | safe head/hands/name crop, actual pad contact, character prominence vs negative space |
| **00:07.5** | `COMMUNITY_LOW` | Several rows of true 12-position visual community with varied approved clothing/sex *silhouettes*, flowering lotus and bud | visible near/mid/far density, no fake viewer claims, identifiable distinct flowers |
| **00:12.5** | `SAKURA_AERIAL` | Giant Sakura canopy + twinkling depth, smaller pads on pond, rose-violet backlight | Sakura occupies dominant region, roots+canopy context, near/far actors, petals/ambient readability |
| **00:22.5** | `GIFT_FOCUS` | One *genuine* actor gift portrait with warm seat aura, correctly authorized gift name/count and staged blessing | true actor/seat/request, P05f head/hands/name and gift readable, 3/5 abstract orbs; *reference rose glyph absent and deferred* |
| **00:26.5** | `LAKE_REFLECTION` | Low lake view, dark navy-violet body, peach/gold reflections, lotus foliage and people depth | warm reflective streak area, contact with water, no flat matte lake, no wrong canopy claim |
| **00:34.5** | `GOLD_UNDER_TREE` | Thick Sakura trunk, legible gold veins, drifting light points, warm backlight and fog, seated figures far below | actual original material gold line contrast, trunk visibility, no excessive overexposure or branch collisions |
| **00:44.5** | `RETURN_TREE` | Return to overall tree/community with warm pink canopy glow, visible lake and atmospheric motes | continuous P0.9 transition, no abrupt path seam, subject remains visible, fallback no-gift cinematic correct |

**No literal 1:1 TikTok UI or copyrighted asset matching.** The displayed actual viewer count, identity/gift semantics and approved chibi silhouettes take precedence over reference visual density. No extra claimed real actors from decorative figures. The original movie also contains distant mountains; this baseline has no approved mountain geometry. **Log `HILLS_ASSET_DEFERRED`** rather than having Codex draw production mountains. Likewise `P013_ROSE_ICON_VISUAL_FIDELITY_DEFERRED` stays open; a 7-shot report **cannot falsely claim fully matching those two elements**.

## 3. Phase plan (one PR, not seven tiny gates)

### Phase A — Frozen baseline / seven-shot evidence audit, no visual changes

1. Check exact PR #13 HEAD and parent and clean worktree; create new separate P0.14 Code branch (suggested `feature/v2-p014-seven-shot-parity`) from **that SHA**, target new stacked PR to branch `feature/v2-p013a-gift-blessing`. Never amend PR #13 or artist branches, never merge.
2. Read `apps/v2-viewer/src/{camera,slice-camera,main,lighting,twilight,water,seat-scene,community-layout,botanical-layout,avatar-look,gift-fx,gift-blessing,blessing-cloud}.ts`; existing evidence `p011`, `p012a`, `p012c`, `p012d`, `p013a`, native P013A shots and Design 17 description. Document current truth: camera `loopSeconds=40`, 4 seeded routes with P0.9 clearance and continuity, 85s idle and 66s gifts/capacity/community, default `blessing=off`, optional community `diversity=on` and `botanicals=on`. These are not user interface defaults requiring silent changes.
3. Produce a **machine-readable seven-shot matrix** with for each shot: reference descriptive requirements; selected DEMO scenario, seed, virtual seconds, fixed pose and/or route sample, camera position/target/FOV, look/profile, intended FX state, visible entities and evidence filename. `GIFT_FOCUS` must use **confirmed real An** with `blessing=on` (community seed 9 around 17.05–18.7s) or A→B→C in capacity around 47–60s; no fake user as a gift target. All other shot times may be scene-appropriate, **not** blindly reference seconds.
4. Capture **true baseline native 720×1280 WebGL stills** (7 shots × ECO + QUALITY × ≥2 seeds), include a dense virtual sample for cut/return and key gift phases. Record status PASS/PARTIAL/GAP in objective shot matrix. **Identify ≤3 highest impact solvable composition failures**, with concrete camera or local look correction and before images, before implementing. If no proven code-side issue exists, supply an evidence-only PR and do not invent cosmetic tweaks.

### Phase B — Only corrections supported by actual visual evidence

Allowed adjustments (only if Phase A shows a real regression or high-impact mismatch):
- **Shot-aware camera pose/route targets** through the existing P0.9 `createCinematicRoutes`, `SliceCamera` or review-shot mapping **only**, with a true before/after and proof no continuity violation. Prefer local target/FOV/shot weighting vs rewriting motion algorithm or modifying actor/seat placement; on gift FIFO and return preserve old validated transitions.
- **Existing renderer look profile knobs** for `DUSK_COMMUNITY`, `PINK_AERIAL_BLESSING`, `GOLDEN_UNDER_TREE` only if A/B shows a specific water-reflection, gold vein or canopy legibility problem, preserve R16/P02/botanical/actor source hash and remove any brightness clipping. Do not alter original GLB material source, generate new water mesh or world hills.
- **Existing presentation/frustum culling logic** or allowed camera framing to keep the approved lotus bloom/bud, both genders and the background around 12 figures readable, never add real seats or user identities. Do not move the approved original 12 slot transforms or change the true 3-actor capacity.
- `P013A` original blessing shader, gift lifecycle and names remain unchanged unless a **documented shot-parity bug** is specifically proven and a small camera-side fix suffices. No new rose icon, painting or animation.
- Avoid new per-frame allocations or full-screen postprocessing. Keep existing fixed deterministic seed and ECO/QUALITY budgets. Initial target **0 new draw calls** for camera-only fixes; if an allowed look tweak adds draw calls, report exactly.

All deviations must be recorded as **finding → minimal diff → before/after evidence**, not a general "make it prettier" redesign. P0.14 is one practical Codex task; do not split into repeated micro-gates. If shot gap is only absent asset art, **leave it PARTIAL and defer to SA**, not implement fake models.

### Phase C — Test, verification and performance

- Complete **7-shot native browser gallery** for both profiles at least seeds **9,71** and third seed **1337** for route QA (different seeds must actually exercise accepted routes or report route fallback); image index with hashes and camera/view properties. **At least 42 final images** from 7×2×3, plus paired before/after **only for modified shots** and gift/return frame sequences. Distinguish shots selected for storyboarding from full 40s timeline.
- Run old **44 tests** (8 Event + 36 Viewer as reported by PR #13), both builds, plus targeted P014 shot mapping, crop, route continuity, root/branch/water/pad clearance, camera look blending, seeded selection, fixed recording determinism, gift interrupt and RETURN fade, stale room/no-seat fallback and legacy OFF invariance. Full 85s idle and ≥66s gift/capacity/community at three seeds, **two complete 40s cinematic cycles**; verify no regressions, camera safe margin = 0.08 and no abnormal frame seam.
- A/B same host, same original scene/camera where comparable, ECO and QUALITY 720×1280; measured rAF frame counts/p50/p95/p99, FPS, draw calls, triangles, textures, geometry/materials, heap, actual ANGLE renderer; performance is measured, **not** fabricated Owner RTX. Include the true result at both gift and representative wide/under-tree poses.
- Test WebGL context loss/restore including gift/return, several real post-restore rendered frames with gl.getError=NO_ERROR, note inherited **synthetic teardown INVALID_OPERATION** errors truthfully. No claim that debt is fully fixed without a separately demonstrated correction.
- Cross-check exact GLB hashes/staging outputs for Sakura R16, original P02, P05f/P07b1, bloom/bud, three real seats, 9 decorative figures and roomCount truth. Zero cost; no production LIVE/RTX/Studio/hardware claims.
- The final scored parity matrix must explicitly distinguish **(a)** accepted fidelity against *Design 17 descriptions*, **(b)** absent original art/video pixels preventing literal parity, **(c)** genuine baseline/regression checks. Use `P014_SHOT_INTENT_PASS` for correctly framed native shots and `P014_FULL_REFERENCE_FIDELITY_PARTIAL` until unresolved original clip/rose icon/hill gaps are addressed (if any).

### Phase D — PR handoff and STOP

- New Codex Viewer-only PR **branched from exact PR #13 HEAD `0810f537a7cbffd539c8acb9b8cd6ba2715bbc9f`** and targeting `feature/v2-p013a-gift-blessing`. Allowed paths strictly `apps/v2-viewer/**` code/tests/evidence/docs; no `Assets3D/**`, `packages/v2-events/**`, V1, task/design modifications by Codex, original PR branches or source model edits.
- Deliver `P014.md` with 7×2×3 native screenshot gallery, selected story/virtual time distinction, numerical crop/visibility criteria, A/B differences, rank-ordered missing elements, legacy gift/camera behavior, actual perf/GL evidence, 0-VND no-new-assets statement and a Windows PowerShell runbook with only implemented scripts. Maintain **`P013_ROSE_ICON_VISUAL_FIDELITY_DEFERRED`** and **`HILLS_ASSET_DEFERRED`** until separate Owner Art task.
- **STOP `P014_SA_REVIEW_REQUIRED`** → SA code/image review → separate **Owner P0.14 Visual GO**. Only then can SA recommend a focused AI Visual missing-original-art task and, after Owner authorizes, the RTX + LIVE hardware work. Do not merge or enable true LIVE within P0.14.

## 4. Non-negotiable safety/ownership

- Original source video was observed by SA and described in Design 17, but **not available to this Codex worktree**. A report can compare *shot intent*, not exact source pixels or claim visual identity. The 7 timestamp numbers are reference milestones, not absolute current DEMO frame times.
- Decorative figures have no identity, online count, real gift target or camera authority.
- No automatic merge of stacked PRs #2, #9, #10, #11, #12 or #13. No paid tools or third-party content licensing assumptions.
- No unauthorized source mesh, camera route overhaul, event schema change, V1 production or TikTok connector.
- **Current approval:** `P013A_SA_TECH_PASS` + `OWNER_P013A_VISUAL_GO`. **Next:** `P014_SA_REVIEW_REQUIRED`; Owner P0.14 Visual GO remains pending.


## 5. Owner P0.14 Visual GO and P1.0-A hardware preflight — 2026-11-23

**Historical Owner P0.14 Visual GO pending resolved:** After [formal SA Tech PASS #6019006145](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14#pullrequestreview-6019006145) at exact PR #14 HEAD `5101df8ee0a7e63b391c9f72be4f5c79bc88b20f`, Owner responded **“tôi thấy oke, tiếp tục”**. Record **`OWNER_P014_VISUAL_GO`** for reviewed seven-shot Viewer scene and acknowledged P1 fast aerial→gift motion; no further camera correction is authorized. PR #14 adds only QA/evidence and does not move the approved runtime camera. Original rose-in-ring and hills are **deferred**, and full original-video-pixel parity is still **`P014_FULL_REFERENCE_FIDELITY_PARTIAL`**.

**Successor:** [Design 24 — P1.0-A Owner GPU-only Preflight](24_P10A_OWNER_GPU_HARDWARE_PREFLIGHT.md), [CODEX 11](../Task/CODEX_11_P10A_OWNER_GPU_HARDWARE_HARNESS.md). Begin with safe instrumented *hardware-only* ECO RTX 3050 Ti 4GB / QUALITY RTX 3060 8GB at 720×1280 after SA harness review; actual GPU results remain pending. No concurrent LIVE Studio/real TikTok, 24 extra seats or people, V1, art source changes or PR merge. **STOP `P10A_HARNESS_SA_REVIEW_REQUIRED`**, then Owner hardware evidence.
