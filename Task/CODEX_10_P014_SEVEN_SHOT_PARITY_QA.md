# CODEX 10 — P0.14 Seven Golden Shots, Shot Parity & Viewer QA Lock

> **SA ASSIGNED / 2026-11-23.** Owner approved [P0.13-A / PR #13](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/13) after [formal SA Tech PASS #6018488791](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/13#pullrequestreview-6018488791) and said “duyệt, tiếp tục”. Record **`OWNER_P013A_VISUAL_GO`** at exact PR #13 HEAD **`0810f537a7cbffd539c8acb9b8cd6ba2715bbc9f`**. Follow Owner-approved roadmap [Design 17](../Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md), Step 4. Exact contract: [Design 23 — P0.14 Seven-Shot Parity](../Design/23_P014_SEVEN_SHOT_PARITY_AND_QA_CONTRACT.md).
>
> **Role: Codex / AI Code**, one focused new Viewer PR and evidence; **STOP `P014_SA_REVIEW_REQUIRED`**, then SA review and separate Owner P0.14 Visual GO. No merges, Blender/art creation, LIVE/GPU claims or production changes.

## 1. Objective / narrow scope / no unauthorized asset work

**Objective:** make the seven most meaningful scene compositions recognizably line up with the **shot intentions** recorded by SA from the Owner video. Quantify current composition/crop/visibility and camera behavior **before** editing. Fix only clear **camera framing, transition or existing look-profile interactions** demonstrated by before/after native browser shots, without breaking the previously approved world, 12 visual actors, gift FIFO or cinematic continuity. No vague blanket "make all visuals prettier" pass.

**Hard boundary:** The original `chuav2(1).mp4` was reviewed by SA but **the movie bytes are NOT available in this GitHub repository/Codex workspace**. Reference times are source clip timestamps **not** current V2 DEMO timestamps. You **MUST** use Design 17 descriptions; cannot claim pixel-accurate match, native extracted video frames, or a sourced reference screenshot you never accessed.

**Out of scope:** any new production GLB, 3D/sprite rose, mountain meshes/hill silhouette, video/icon/image generation, new avatar variants, new seats/real users, identity inference, TikTok UI/gift badges, Event Engine business semantics, gift economics/caption changes, changed camera scheduler semantics without demonstrated breakage, art/source GLB reauthoring, full scene redesign, resource-heavy postprocessing, V1, LIVE Studio, hardware FPS certification, paid services, merges or P1.0. Preserve **`P013_ROSE_ICON_VISUAL_FIDELITY_DEFERRED`** and **`HILLS_ASSET_DEFERRED`** if no art assets are approved.

## 2. Exact revision/branch contract

- Repository: https://github.com/nguyenbui5701/OnlinePagodaVer2
- Current accepted *Viewer* source **PR #13**, HEAD `0810f537a7cbffd539c8acb9b8cd6ba2715bbc9f`, branch `feature/v2-p013a-gift-blessing`, based on PR #12 `385816518987b2a0ea6ef094bb0f65bfb363e720`. [SA review #6018488791](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/13#pullrequestreview-6018488791); **Owner P0.13-A Visual GO**. Existing stacked sources #2/#9/#10/#11/#12/#13 all remain unmerged; do NOT merge them.
- New work: separate clean branch/worktree named `feature/v2-p014-seven-shot-parity` **from the exact PR #13 HEAD**. Open one **new stacked PR targeting `feature/v2-p013a-gift-blessing`**. Do not edit source PR #13 branch, existing task/design docs or artist sources. Recheck exact HEADs before beginning and before posting PR; if parent changes, STOP for SA repin rather than silently moving baseline.
- Allowed changed paths **only `apps/v2-viewer/**`**: optional minimal fixes to `src/{camera,slice-camera,twilight,lighting,water,main}.ts` with evidence, small focused `src/shot-parity.ts` if genuinely needed, `test/p014-*.test.ts`, `scripts/evidence-p014.mjs` if actually implemented, `P014.md` and `evidence/p014/**`. If no code defect, submit **evidence-only new PR**; don't invent changes for the sake of a diff. Explicitly **exclude** `packages/v2-events/**`, `Assets3D/**`, immutable manifests, `Task/**`, `Design/**` and V1.

## 3. Must-read order and existing evidence

1. [Rules Design 07](../Design/07_WORK_RULES.md), [Zero Cost Design 14](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Approval/Handoff Design 16](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task order 00](00_P0_EXECUTION_ORDER.md).
2. **Authoritative [Design 23 P014 contract](../Design/23_P014_SEVEN_SHOT_PARITY_AND_QA_CONTRACT.md)**; [Design 17 reference shot map](../Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md) Sections 2, 3 and Step 4; [Design 09 gift camera](../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design 10 graphics profiles](../Design/10_GRAPHICS_PROFILES.md), [Design 13 identity and event contract](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design 18 community](../Design/18_P012_LOTUS_COMMUNITY_SCOPE_AND_GATES.md), [Design 20 botany](../Design/20_P012C_BOTANICAL_RUNTIME_INTEGRATION_CONTRACT.md), [Design 21 diversity](../Design/21_P012D_CHARACTER_DIVERSITY_CONTRACT.md), [Design 22 confirmed blessing](../Design/22_P013_GIFT_BLESSING_CHOREOGRAPHY_CONTRACT.md).
3. [PR #13 SA formal review](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/13#pullrequestreview-6018488791), [P013A runbook and native gallery](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/0810f537a7cbffd539c8acb9b8cd6ba2715bbc9f/apps/v2-viewer/P013A.md), prior P011/P012A/P012C/P012D/WebGL artifacts, particularly true 9:16 low, aerial, lake, under-tree and gift shots.
4. Read original PR #13 code at pinned HEAD: `apps/v2-viewer/src/{camera,slice-camera,main,lighting,twilight,water,seat-scene,community-layout,botanical-layout,avatar-look,gift-fx,gift-blessing,blessing-cloud,slice-driver}.ts`, `apps/v2-viewer/package.json`, existing test directory and `packages/v2-events/src/**` READ-ONLY. Baseline camera 40s loop and four seed-selected continuous routes, 720×1280, safeMargin=0.08, A→B→C, P0.13-A opt-in blessing=on, P05f + P07b1 only in community diversity mode, 3 actual seats and nine anonymous.
5. **Do not claim original video directly inspected by Codex**; native browser captures generated with three.js are not replacement reference-video frames.

## 4. Seven-configuration objective shot matrix — must be completed first

The exact original-video moment maps to a named **shot objective**, not the same virtual second in V2. Publish a `shot-matrix.json` with `referenceSeconds`, `name`, `sourceDescription`, `demo`, `virtualSeconds`, `seed`, `profile`, `position`, `target`, `fov`, `cameraMode`, `look`, `actorId` if true focus, `sourceRevision`, `screenshotSHA256`, `objectiveChecks`, `status=PASS|PARTIAL|GAP`, `unavailableArt`, `evidence`.

| Original ref t | Key | Essential composition |
|---|---|---|
| 1.0 s | HERO_CLOSE | large cross-legged chibi on real P02 near dark water, near/mid field, safe head/hands |
| 7.5 s | COMMUNITY_LOW | near/mid/far 12 meditating figures with real female/male clothing palette, P02, true original bloom and bud |
| 12.5 s | SAKURA_AERIAL | original pink giant R16 canopy dominant, scale, haze, tiny people and layered lake |
| 22.5 s | GIFT_FOCUS | true confirmed An with face/name/2 hoa hồng legible, warm seat 3/5 abstract orb blessing and Duyên no-seat text-only; source-video rose icon intentionally deferred |
| 26.5 s | LAKE_REFLECTION | stylized dark violet/navy pond with visually legible warm rose/gold streaks and lotus/figures at proper waterline |
| 34.5 s | GOLD_UNDER_TREE | high-contrast original named golden bark veins, dark trunk silhouette, mist and seated people far below; no source geometry change |
| 44.5 s | RETURN_TREE | continuous genuine camera return, pink-gold canopy/tree community framed without jarring jump |

**Camera selection:** start from existing P0.9 route/story shot and saved referenceViews or actual `p08Review.step(...)` camera state; use a deliberately selected *real* DEMO actor state for gift. Time stamps 1 / 7.5 / ... are **source-video reference classes**, do NOT set `review.seconds=22.5` by habit. Support both ECO+QUALITY and seeds 9, 71, 1337. If any source art not present (hills / rose) mark PARTIAL and isolate future asset task; do NOT fake it with text, toy mountains or new 3D shapes.

**Shot scoring:** report explicit visibility/crop evidence: actor head/palms/gift/name safe-region, P02 leaf/water contact, count of visible different-depth actors, at least one flower/bud where scene angle permits, Sakura overall screen extent, golden vein image visibility under tree, water warm-streak screen pixels vs plain pond, camera FOV/route continuity and shader overexposure. Use objective image data and grounded aesthetic finding; don't invent a magical "90% fidelity" or assert 7/7 literal reference parity without the clip/art. Distinguish *art missing* from *camera framed badly*.

## 5. Implementation phases (one practical batch)

### Phase A — baseline and P0.14 gap audit, before code changes
- Fresh worktree from pinned parent, run old 8 Event +36 Viewer **44 existing tests** and builds as control, stage required original approved GLBs (p08, p012b, p012d), confirm all source hashes. Produce baseline 7×2×3 original native **42-shot** gallery at 720×1280 using **original PR #13 code**, plus shot matrix. Verify seeds 9/71/1337 select actual camera routes and fallback accurately.
- Select **0–3 highest-impact P0 fixes with proof**. E.g. giant Sakura cropped too far, gold bark too dark, water reflection invisible, or crowd framing empty. Do NOT turn visual preferences into retroactive technical failures and do not re-run expensive old Blender evidence.
- If the seven shots already pass their achievable requirements, **stop code edits** and ship evidence-only + report with known source-asset gaps.

### Phase B — minimal code-side, justified A/B correction only
- Improve named shot framing or existing P0.9 route sample/targets and shot-aware existing P0.11 look profile **only** for documented issues with before and after and tests. Keep approved camera director's smooth tangent and gift return; do not reset routes, alter `SliceDriver` or Event Engine.
- Keep all 12 original slot transforms, 3 real actors, name/FX anchors, Sakura trunk/branches and P02 contact frozen. No new GLB, procedural mountains, renamed materials, additional orbiting avatars or made-up online viewers.
- Preserve original lighting/camera and gift source behavior for `blessing=off` and prior accepted routes unless the before evidence *specifically* warrants changes; when visible changes are intentional, identify which shots were changed and how they improve reference intent. Zero extra draw calls is the target for camera-only fixes.
- Freeze all accepted outputs after one focused batch. Avoid multiple sequential micro-gates or broad parameter search without clear shot defect.

### Phase C — verification and real native 9:16 evidence
- Minimum **42 final native 720×1280 screenshots** = 7 shots × 2 profiles × 3 seeds; 7-shot machine-readable matrix + index SHA-256, before/after pairs for each modified shot at same seed and appropriate pose/state (do not fake same camera pose if changing camera), and a dense genuine gift/return frame series to verify moving continuity. Original movie not in repository; no fabricated frame/video matching.
- Existing **44 test baseline** plus targeted shot/frame/crop/route/obstacle tests and both builds. 85s idle and 66s gifts, capacity, community at seeds 9/71/1337; two complete 40s route loops; A→B→C confirmed count/dedup, An and Duyên fallback, no fake identities, return to cinematic, exact original source ART SHA and six genuine apparel palettes. Use existing verified screenshot methods and virtual time.
- Normal rendering after simulated WebGL context loss must preserve camera, actor, P0.13-A blessing and original assets; report 4+ post-restore `gl.getError()==NO_ERROR` frames and inherited synthetic teardown `INVALID_OPERATION` separately. No sweeping log filters.
- Same-host ECO/QUALITY sample for low/lake/aerial/under/gift reference situations, at 720×1280, actual sample count and device/renderer, frame p50/p95/p99, FPS, draw, triangles, textures/geometry/materials, heap/memory, context losses, VRAM only if actually measured. Browser software SwiftShader is **not** RTX certification or TikTok LIVE Studio. Report explicit zero-cost.
- Classify `P014_SHOT_INTENT_PASS` vs `P014_FULL_REFERENCE_FIDELITY_PARTIAL`. It's acceptable and honest to pass composed shots while rose-in-ring source art and horizon hills remain deferred.

### Phase D — deliver PR and HARD STOP
- New independent stacked Viewer-only PR onto feature/v2-p013a-gift-blessing. Include `apps/v2-viewer/P014.md` (shot table, technical findings, A/B deltas, 7×2×3 images, source/renderer limits, old legacy traces, measured cost, clear future art gaps and Windows PowerShell reproducible runbook), evidence scripts if implemented and `evidence/p014/**`.
- User-facing final report: **SA finding → Codex action → source/code/GLB facts → original native screenshot and test evidence → PASS/PARTIAL/HOLD**; exact parent/new HEAD, branch and PR URL, changed paths, three seeds, real actor/guest authority, A/B performance, 0 VND and known missing art, no merges.
- **STOP at `P014_SA_REVIEW_REQUIRED`**, then SA independently reviews code/files/screenshot evidence and Owner judges browser. Do NOT start RTX or LIVE, change V1, auto-merge old PRs or launch a rose/hill AI Visual task without Owner/SA approval.

## 6. Windows PowerShell baseline (verified PR #13 scripts only)

Start from new P0.14 Code worktree and its proper repository root:

    Set-Location packages/v2-events
    node --version
    npm.cmd ci
    npm.cmd test
    npm.cmd run build

    Set-Location ../../apps/v2-viewer
    npm.cmd ci
    npm.cmd run assets:p08
    npm.cmd run assets:p012b
    npm.cmd run assets:p012d
    npm.cmd test
    npm.cmd run build
    npm.cmd run dev -- --port 5186 --strictPort

**If** Codex implements `evidence:p014` in Viewer package.json, run it only then. Suggested community preview **after** new PR exists:
http://127.0.0.1:5186/?demo=community&seed=9&profile=quality&look=twilight&clean=1&botanicals=on&diversity=on&blessing=on
Current PR #13 supports the named query switches; this proposed *port and P014 changes* require a running worktree and are not yet created.

## 7. Gate matrix and next owner handoff

- **P0.14 scope technical PASS:** correct stacked source, reproducible 7×2×3 true screenshots, measured shot intent and deliberate differences, unchanged Event Engine/GLB/FIFO/3 seats, no camera collision/return break, old+new tests and truthful same-host metrics.
- **P0.14 full video parity:** remains **PARTIAL** if rose-in-ring, hills or original source frame pixel parity absent. Do not hide this as PASS.
- **Separate final gate:** `P014_SA_REVIEW_REQUIRED` → SA Review → Owner P0.14 Visual GO or a specific bounded correction. GPU/hardware, LIVE or future art require separately authorized tasks.


## 8. Owner P0.14 Visual GO / successor CODEX 11 — 2026-11-23

**Gate closure:** [PR #14 formal SA Technical PASS #6019006145](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14#pullrequestreview-6019006145) at exact HEAD `5101df8ee0a7e63b391c9f72be4f5c79bc88b20f`, followed by Owner **“tôi thấy oke, tiếp tục”**. Record **`OWNER_P014_VISUAL_GO`** for seven written-source shot compositions and existing fast aerial→gift camera. **No additional CodeX 10 runtime/source work needed**, because PR #14 is QA-only; keep prior test evidence and PR open/unmerged. Full original reference remains PARTIAL; absent rose icon/hills are not retroactive CodeX 10 defects.

**Next phase:** [CODEX 11 — P1.0-A Owner GPU-only Harness](CODEX_11_P10A_OWNER_GPU_HARDWARE_HARNESS.md) under [Design 24](../Design/24_P10A_OWNER_GPU_HARDWARE_PREFLIGHT.md), new Viewer-only stacked PR from PR #14 HEAD. Device instrumentation and real Owner 3050 Ti ECO/3060 QUALITY measures only; no LIVE Studio, 24 fabricated actors, V1, merges or paid tools. **STOP `P10A_HARNESS_SA_REVIEW_REQUIRED`**, then physical Owner GPU evidence before hardware PASS.
