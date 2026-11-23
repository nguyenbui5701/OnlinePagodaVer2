# CODEX 05 — P0.11 Twilight Atmosphere, Sakura Gold Lighting & Reflective Pond

**SA assignment:** 2026-11-23. **Status:** `ASSIGNED_TO_CODEX` after explicit **Owner Design GO**. Execution must stop at **`P011_SA_REVIEW_REQUIRED`**, followed by SA review and independent **Owner P0.11 Visual GO**. This document is an actionable code task, **not** a request for SA to change runtime, a merge, LIVE deployment, Blender rerun, hardware RTX pass or permission to edit previous branches.

## 1. Role, scope, objective, non-goals and STOP

**Owner-approved art direction:** dark blue-violet twilight with warm pink/peach/gold streaks on the lake, a softly backlit pink Sakura canopy, and clearly visible golden fissures in the dark trunk. The Owner explicitly approved the phased order **P0.11 atmosphere/water → P0.12 lotus/crowd → P0.13 gift choreography** after the full `chuav2(1).mp4` was inspected by SA. **P0.14** reference composition review and **P1.0** Owner RTX/LIVE gates remain later stages. This is approval to **issue the focused P0.11 task**, not implicit merge approval or P0.10 Owner visual GO.

**Codex / AI Code** implements low-cost, deterministic **V2 viewer-only** look development: scene lighting and fog/sky palette, R16 gold trunk material readout where permitted, one-pass P0.10 water shader look, existing ambient FX color response, and temporal smoothness of three cinematic looks. **SA** reviews code and video-to-native-WebGL evidence; **Owner** evaluates real browser aesthetics. **AI Visual is not assigned**; no 3D mesh authoring, new GLBs, Blender, Cycles, text-to-image or paid assets.

**One outcome:** In 720×1280 native V2 clean browser, the accepted Sakura/chibi scene should communicate **mystic dusk** rather than bright matte lavender: dark navy/purple depth, peach-gold moving water highlights, luminous pink canopy, golden vein contrast, calm fireflies, readable seated person and clear gifts.

**Hard out-of-scope:** new community/lily pad counts, additional seats, lotus flowers/buds or mountains (P0.12), a new moon 3D mesh/skyline asset, new gift rose-icon choreography (P0.13), camera spline or tree-facing/seat orientation rewrites (P0.9), Event Engine or confirmed/observed gift semantics (P0.10), TikTok transport, V1, paid services, HDR/SSR/full-scale planar reflections, expensive real volumetric ray marching, full-screen bloom/SSAO, dense extra particle counts, automatic RTX/LIVE testing, scene expansion, model geometry/texture/GLB/morph/rig edits, any PR merges. A small optional original **shader/lighting-only warm backlight cue** may be considered within budget; do not create production 3D scenery primitives.

**STOP** after one focused stacked PR and verifiable browser evidence at `P011_SA_REVIEW_REQUIRED`. If real golden fissures are impossible to improve without editing R16 source material geometry, STOP and give SA an exact screenshot + material evidence; propose a distinct *future* AI Visual R17 variant gate, never overwrite R16.

## 2. Repo / baseline / branch / immutable approved artifacts

**Repository:** https://github.com/nguyenbui5701/OnlinePagodaVer2

- **Current exact P0.10 software baseline:** [PR #7](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/7), feature branch `feature/v2-p010-water-blessing-gift-fx`, **HEAD `323955bed04e88f37cc251f8ae902e5ef7550eb5`**. At SA assignment, PR #7 is open and unmerged; [SA technical review #6013428819](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/7#pullrequestreview-6013428819) is **TECH PASS**, not final video-look parity or Owner P0.10 Visual GO.
- P0.10 stacked on P0.9 [PR #6](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/6) `675675cdf4d1a6868f370e6417ac689a15c1054b`; PR #6 stacked on P0.8 [PR #5](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/5) `844361b5edd8ca1c2498ee1e708c66b634312069`. Other PRs #1–#4 stay independent. P0.9 tree facing + four seeded routes already Owner-accepted. Do not merge/rebase/force push any of these heads as part of P0.11.
- **Create a new implementation branch from the exact P0.10 HEAD**, suggested `feature/v2-p011-twilight-lighting-water`. Open a **new stacked PR targeting `feature/v2-p010-water-blessing-gift-fx`**. Verify the PR #7 head remains at the pinned SHA *immediately before* branching and before submitting evidence. If any mismatch, STOP and request SA to re-pin baseline; do not silently rebase.
- Limit changes to `apps/v2-viewer/**`: likely `src/{lighting,water,fx-profiles,main}.ts`, a **small** viewer-only look-profile module if justified, optional isolated styling of existing ambient motes, related viewer tests, `P011.md` and `evidence/p011/**`. No `packages/v2-events/**` or `Assets3D/**` edits. Do not change or silently delete P0.10 evidence.
- **Original binary SHA-256 and byte sizes** must stay the same:
  - Sakura R16 QUALITY `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c` / **5,055,232** bytes.
  - Sakura R16 ECO `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` / **1,393,492** bytes.
  - Lotus P02 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9` / **262,108** bytes.
  - Male P07b1 cross-prayer `4e8c8d082352d67d0eaf637df7973931442c724a0f7db598ea8fde8de3873097` / **589,932** bytes.
- `sakura-r16.json` and `p08-assets.json` remain exactly pinned. Asset verification must still run **before** any temporary runtime lighting/material integration. Preserve original source factor checks in `asset.ts`; never weaken the verification to pass an attractive but wrong material.

## 3. Required reading order — read BEFORE source changes

1. [Design/07_WORK_RULES.md](../Design/07_WORK_RULES.md), [Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/16_P0_APPROVAL_AND_HANDOFF.md](../Design/16_P0_APPROVAL_AND_HANDOFF.md) and [Task/00_P0_EXECUTION_ORDER.md](00_P0_EXECUTION_ORDER.md).
2. **Now Owner-approved** [Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md](../Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md): source-video analysis, distinct desired look, approved P0.11-first order, *no video/third-party UI cloning*. Read [Design/09_GIFT_CAMERA_DIRECTOR.md](../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design/10_GRAPHICS_PROFILES.md](../Design/10_GRAPHICS_PROFILES.md), [Design/12_CORE_PRIORITIES_AND_AI_ROLES.md](../Design/12_CORE_PRIORITIES_AND_AI_ROLES.md), [Design/13_3D_EVENT_INTEGRATION_CONTRACT.md](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md).
3. [CODEX 04 P0.10 Task](CODEX_04_P010_WATER_BLESSING_AMBIENT_AND_GIFT_FX.md), [P0.10 Windows guide](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/323955bed04e88f37cc251f8ae902e5ef7550eb5/apps/v2-viewer/P010.md), [P0.10 WebGL evidence](https://github.com/nguyenbui5701/OnlinePagodaVer2/tree/323955bed04e88f37cc251f8ae902e5ef7550eb5/apps/v2-viewer/evidence/p010), [P0.10 formal SA review](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/7#pullrequestreview-6013428819) and [supplemental video review in PR #7](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/7#issuecomment-7082695379).
4. At pinned P0.10 SHA read `apps/v2-viewer/src/{lighting,water,fx-profiles,ambient-fx,main,asset,seat-scene,camera,slice-camera,gift-fx,slice-overlay}.ts`, `src/{sakura-r16,p08-assets}.json`, test fixtures and `scripts/evidence-p010.mjs`; read `packages/v2-events/src/{protocol,engine}.ts` **read-only** to understand constraints.
5. **Reference availability:** The Owner uploaded `chuav2(1).mp4` in the SA conversation; SA directly inspected it. **Codex should not assume the actual file is present in the Git checkout or its own workspace.** The video is NOT uploaded to GitHub. Use Design 17's timestamp-specific description and existing verified PR #7 browser frames as grounded requirements; if the clip is separately made available to Codex, report its actual local source/provenance; if not, explicitly say `REFERENCE_VIDEO_NOT_AVAILABLE_TO_CODEX`. Never invent direct video frame comparison or copy platform UI/gift symbols.

## 4. SA grounded assessment and reference shot targets

| Gate | P0.10 status and concrete source | P0.11 requested change |
|---|---|---|
| R0: source integrity | **PASS, FREEZE** — `asset.ts` validates GLTF PBR factor parity and SHA, GLBs original; P0.9 actor/route Owner accepted | keep original asset bytes, model placement and camera sampling byte-identical |
| W1: pond | **P0.10 TECH PASS / VISUAL PARTIAL** — Y=0 shader in `water.ts` has crossed waves, soft canopy/trunk masks and gift ring. Native near-water/aerial shots still muted matte mauve | darker near-water navy/violet foundation, unmistakable but calm peach/gold moving long highlights and Sakura glow reflection, preserve ripple and safe contrast |
| L1: lighting | **VISUAL PARTIAL** — `lighting.ts`: background `#ae93b5`, `FogExp2` density `0.009`, three directional + ambient lights, fixed renderer exposure `0.94` | twilight fog/sky gradients, warm backlight with readable foreground actor, clear near/far layers and profile-based lighting |
| L2: Sakura | **ART STRUCTURE PASS / look PARTIAL** — R16 peach canopy under current uniform lighting looks washed-out; `Golden_bark_veins` shader/material present but low contrast | brighter perceived canopy depth and trunk fissure glow *without binary edits* |
| A1: ambiance | **P0.10 TECH PASS / mood PARTIAL** — ECO 48/36/7, QUALITY 94/74/15 motes/petals/leaves; one point draw | retain counts; tune warmth/visibility only if needed for sunset/dusk, don't blindly increase allocation |
| G1: gift | **TECH PASS / FREEZE** — typed `roomSessionId + requestId + actorId + seatId`, P0.10 observed/confirmed/return & no-seat overlay | same gift counts, FX origin/timing/dedup; preserve legible labels/skin tone under new light |
| P1: perf | **SWIFTSHADER MEASURED, Owner GPU PENDING** — P0.10 same-host ECO 7.43 FPS, QUALITY 2.09 FPS under software Edge/SwiftShader, no LIVE | compare `look=legacy` vs new twilight **same host / same path / same profile**, log p50/p95/p99 and GPU vendor, never extrapolate RTX |

**Specific visual map (reference-inspired, not copy):**
- ~**7.5 s** community low shot: dark horizon/fog; water darker than sky yet foreground actors distinguishable. **Crowd/mountains missing is P0.12**, must not be "fixed" by fake avatars.
- ~**12.5 s** / **16 s** aerial tree: canopy softly luminous pink with silhouette, not uniformly pastel/overexposed; water has localized warm reflections near trunk.
- ~**26.5 s** lake-level: most important **long peach/gold reflective bands** and depth on dark water; don't hide actor or pad or introduce white striped waves.
- ~**34.5 s** under-tree: strongest **gold fissure vs dark bark** contrast and warm backlight/fog, no unnatural flash or occluded tree.
- ~**44.5 s** return: tree remains luminous; lighting transitions back to dusk continuously; moving motes remain subtle.

**Video/source truth:** Previous PR #7 SA visual fidelity is **PARTIAL overall**, but its 24/24 test and actor/focus technical PASS remain valid. **P0.10 Owner Visual GO is not assumed** just because the Owner approved this P0.11 direction.

## 5. Phases of execution

### Phase 1 — Audit, baseline, design decision log (no modifications first)

1. Start a separate worktree/branch at the **exact SHA** and note `git rev-parse HEAD`, branch, status and PR #7 base. Do not touch any Codex/AI Visual's existing branch or owner worktree. Save before images at 720×1280 in ECO + QUALITY from the actual P0.10 viewer, seeded `9`, including near-water, close actor, aerial, under-tree and gift-focus. Store source revision, capture URLs/time/pose/shot so images are reproducible. Reuse `evidence/p010` shots only with truthful provenance (no renaming them into "new" evidence).
2. Inspect `R16` materials after `loadSakura` verification, especially `Golden_bark_veins`, dark bark, Sakura canopy; record which PBR material channels exist, which are shared, number of lights, current `FogExp2`, `AgXToneMapping`, exposure, projected water mask location, current gift ring and screen-space safe margins. Record baseline drawcalls/textures/shadow maps.
3. Write a small *look-profile interface* specification before changes. Three authored looks must have intentional blend durations, not randomly timed changes. Separate physical scene values from screen/renderer values; no magic constants in domain logic. Agree on a direct `?look=legacy` or similarly documented **viewer-only comparison switch** (implement and test; not present in P0.10 baseline). Ensure legacy reproduces the full P0.10 appearance, including original water uniforms, at fixed camera/time/seed, not just the old sky color.
4. Use **same existing seed, clock, camera position and FOV** for A/B; changing exposure/lighting/water shader is the purpose and must be documented, but don't also shift camera/actor.

### Phase 2 — Twilight sky, fog and coherent lighting profiles (required)

1. Define named `DUSK_COMMUNITY`, `PINK_AERIAL_BLESSING`, `GOLDEN_UNDER_TREE` presets in a typed localized file. They control **ambient intensity/color, warm accent key/backlight, fog color/density, background/sky palette or procedural gradient and water reflection balance**; share base PBR materials and preserve skin/clothing colors. **Presets are authorable in ECO and QUALITY** with capped costs. Avoid expensive dozens of dynamic lights, per-frame light recreation or huge sky meshes.
2. Map existing **CLOSE/COMMUNITY/AERIAL/UNDER_TREE** shot IDs to coherent look weights, with optional soft atmosphere emphasis during gift focus without changing focus selection/queue. **Blend all scalars and colors through existing camera transitions** using a time-based smoothing/easing or equivalent continuous timeline; no abrupt profile snaps at the four shot boundaries or at loop crossing (40s) or during A→B→C transitions. Keep deterministic output for the same seed, timestamps and gift fixture schedule. Explicitly test shot boundaries at 9/16/29/40s and gift focus/return times with at least two seeds.
3. Establish a **dark blue-violet evening palette**, saturated yet readable pink canopy with lighter center and darker silhouette edges, and warm local gold accents. Fog must add real foreground/background separation without washing the scene into an opaque lavender rectangle. **Do not invent 3D mountain geometry or copy a platform skybox**; a cheap procedural color/sky cue is enough, with mountain silhouette deferred to P0.12.
4. If a warm glow disk or fake rays genuinely improves the reference composition, use a **small original procedural screen/environment cue** only if it is clearly motivated, behind the trunk/canopy and performant. Avoid blinding shafts, flicker, volumetric ray marching, per-frame geometry/material allocation and third-party image assets. Track exact draw calls and whether the feature is enabled in ECO.

### Phase 3 — Golden Sakura fissures and canopy lighting, non-destructive (required)

1. Prefer **lighting-level solutions first** (warm accent key, modest rim/point light, tuned fog/background exposure); log the number of active lights per profile. Test direct low/side under-tree hero views and tree shape from aerial before changing any PBR material.
2. If needed after proof, add **reversible, runtime-only and explicitly scoped** emphasis on the existing **`Golden_bark_veins`** material *after GLTF source verification*, e.g. a small bounded emissive/color response on a **cloned runtime material** attached only to matching mesh(es), with no mutation of source/import association, no shader code injection into original bytes, no unintended changes to other gold/petal/skin materials. **Preserve GLB hash, material factors stored in manifest, gold geometry and tree bounds.** Track clone material disposal/context restoration separately; restore original assignments during `dispose` and HMR. Document any deviation from source PBR and compare against unmodified legacy mode truthfully. Do NOT change source validation (`asset.ts`) to hide differences.
3. Tune canopy light contrast rather than globally turning saturation/ambient brightness up. Skin must remain recognizable and text legible, and faces not black silhouettes. Use no original Blender re-export or R16 reauthoring.

### Phase 4 — Water reflection with corresponding lighting (required)

1. Extend **existing P0.10 `water.ts` single-pass shader**, not replace with a static plane or high-cost mirror. Keep Y=0, proper GLSL color-space/tone mapping, original `WaterRipple` at correct real seat, viewport 9:16. Reuse original world-tree pivot to anchor reflected warm streaks.
2. In community/low-water views darken the water base to navy/violet, increase **legible localized peach/gold bands** around reflected canopy/backlight/trunk while keeping calm wave breakup and slow motion. Avoid high-frequency ripple aliasing, hard horizontal stripes or physically impossible bright water everywhere. Under aerial the tree silhouette must remain dominant, not a glowing uniform purple disk.
3. Water should respond **continuously** to the three lighting profiles, including during gift and return; keep the prior gift ripple intensity and pool semantics independent from global atmospheric blend. Controlled stylized reflection **must be labeled an approximation**, not SSR/physical reflection or Cycles parity.
4. Tune in ECO first with honest GPU cost, then QUALITY only for modest detail/visual benefit. Track material allocations and shader variants; no added full-screen framebuffer passes or live reflection render targets unless new SA-approved measurable technical case exists (not authorized here).

### Phase 5 — Validation, evidence and STOP handoff

1. Build/execute existing baseline tests plus targeted new viewer tests for **deterministic look samples** by seed/time, palette/profile transitions at 9,16,29,40s, fog/exposure finite bounds, correct legacy switch, disposal of any cloned materials, no unbounded per-frame allocation, water ring correctness, actor color visibility and A/B/C focus/regression. Test automatic `CINEMATIC` ≥85 s and gift A→B→C / return ≥66 s with no face occlusion, correct overlays and 7 DEMO confirmed gifts (unless fixture changed outside allowed scope — which should not happen).
2. Capture **actual native browser WebGL** clean images 720×1280, ECO and QUALITY, from matched source and consistent *camera poses* at reference-inspired **7.5, 12.5, 16, 26.5, 34.5, 44.5 s** as appropriate. Include before and after `look=legacy`/new look, at least 2 water views (near water + aerial), 2 bark/canopy views (low/under + aerial), 3 actual crossfade boundary probes at 9/16/29/40, 2-time same camera water motion and A/B/C gift with readable label. Include stable screenshot names containing shot, time, profile and look and a machine-readable screenshot index. **If a video sample is in 720×1556 with TikTok UI, don't call our 720×1280 clean shot a pixel-perfect match.** No concept imagery, generated reference or invented clip comparisons.
3. Measure p50/p95/p99 real-frame interval/FPS in **same browser + same GPU renderer + fixed virtual timeline** for P0.10 legacy vs P0.11 new, at 720×1280, with LIVE Studio closed. Log rAF wall clock vs virtual clock, vendor, OS, Node/browser, render target, draw calls, triangles/points, textures, geometries, shadow maps (when available), heap memory where available, shader warnings/errors and context restore. **Real hardware RTX not required and not to be claimed.** A performance regression is acceptable **only if measured, small, and explicitly reported for Owner choice**; significant regression requires efficient alternative or SA blocker report. Prefer same number of shadow maps, no new full-screen passes.
4. Verify all 4 original GLB hashes/bytes and manifests, Event Engine file byte identity, actual P0.9 camera path/seat orientation unchanged, P0.10 FX observed/confirmed/reconnect/no-seat and bounded pools unchanged; no modifications to `packages/v2-events/**`, other PR branches or V1. Zero-cost tool requirement: **0 VND**, no Blender, LIVE Studio, paid asset or image generation. Preserve real shader errors in evidence, do not hide them.
5. A short reproducible `apps/v2-viewer/P011.md` must explain Windows preview port and query switches, baseline/new profile, seed/time capture, same-host comparisons and known differences. Commit `apps/v2-viewer/evidence/p011/**` with source SHA, commands/test logs, before/after PNG, visual analysis table, time-series palette/brightness transition metrics, browser-performance JSON, source/manifest hashes, pending Owner judgements. If adding `evidence:p011` to package.json, **implement and run the actual script**, never claim it existed before.
6. Open a **small stacked PR** against the pinned P0.10 implementation branch and document exact base/head SHA, every changed path, no merge, no GPL/paid content, and `P011_SA_REVIEW_REQUIRED`. SA reviews source + native captures; Owner then evaluates dark lighting, gold veins and moving pink/gold lake on the actual browser. **No P0.12 task or code is authorized as a side effect.**

## 6. Objective acceptance matrix

| Gate | PASS requires | FAIL/BLOCKER example |
|---|---|---|
| **L1 Twilight** | Clearly dusk navy-violet low/wide views with proper pink/gold readable subject and foreground color; fog/sky not flat lavender; original skin still legible | All-black actors, overexposed magenta, flat light-lilac sky, color banding |
| **L2 Three looks** | Named, documented dusk/community, aerial pink, golden under-tree profiles; smooth transitions at 9/16/29/40s and gift interrupt/return; deterministic seed/timeline, no camera/snapshot rewrite | Visible one-frame brightness/color snap, flicker, shot direction changes or random per-frame light switching |
| **T1 Sakura** | Existing black/plum bark reads dark, golden lines clearly visible in under-tree and side views, canopy luminous but retains original R16 silhouette/bounds/GLB hashes | Gold material hidden, material mismatch check bypassed, GLB re-exported, canopy blown out |
| **W1 Water** | Moving warm peach/gold reflection bands visible over dark lake at water-level and aerial; original calm wave, y=0 contact and gift ripple preserved, one-pass stylized approximation labeled truthfully | Matte flat mauve lake, static streak, strobe/alias, pad/roots occluded, invented SSR result |
| **A1/G1 Regression** | Ambient motes/petals/leaves and one observed + three confirmed gift cues still work as submitted; A→B→C correct, no-seat false FX prohibited, camera routes and actor facing intact | Wrong actor, gift replay/changed confirmed count, FX hidden by post-look palette, clip/occlusion |
| **P1 Cost** | ECO/QUALITY measured same-host against P0.10, error-free builds; bounded lights/materials/memory, no heavy postpasses | Unmeasured slowdown, unbounded clones, failed GL build, false Owner RTX or LIVE claims |
| **E1 Evidence** | True matched 720×1280 native Edge/Chromium 3D images + logs at mapped shots, exact source SHA and URLs; honest video source availability | Concept PNG passed as runtime proof, screenshots with unrelated camera/seed and claim of pixel equality |

**Pass split:** `P011_TECH_PASS` (SA code/evidence) is NOT `OWNER_P011_VISUAL_GO`. A visual acceptance depends on the Owner's live view; if the screen still feels too lavender or gold veins not visible, return a *narrow* lighting/color fix instead of reopening GLB creation.

## 7. Known valid Windows PowerShell reproducibility commands

At pinned P0.10, Node >=24 and existing script `evidence:p010` are verified. In a **separate P0.11 checkout**, run the following and capture actual output:

```powershell
# From repository root of the P0.11 worktree
Set-Location packages/v2-events
node --version
npm.cmd ci
npm.cmd test
npm.cmd run build

Set-Location ../../apps/v2-viewer
npm.cmd ci
npm.cmd run assets:p08
npm.cmd test
npm.cmd run build
npm.cmd run dev -- --port 5181 --strictPort
```

Browser: `http://127.0.0.1:5181/?seed=9&clean=1` (twilight ECO default after implementation), `?seed=9&clean=1&profile=quality`, and `?seed=9&clean=1&demo=gifts`. `?look=legacy` is **proposed to be implemented**, not available in P0.10. If implemented, provide exact URL and document whether it reverts every related shader/lighting parameter. `?time=` and `?inspect=1` already exist for review, but must be exercised truthfully. If a fresh P011 evidence runner is added, include its actual browser path prerequisite (`V2_BROWSER`) and dual-worktree baseline config, execute it, and attach real results.

## 8. Required Codex handoff — exact report structure

1. **SA issue → specific code change → objective evidence → PASS/PARTIAL/BLOCKED** for twilight sky/fog, three look profiles, golden trunk, canopy, moving reflection, existing ambient/gift unaffected.
2. Branch + new PR permalink; pinned P0.10 SHA, PR #7 head at checkout and at submission, P0.11 new HEAD, all paths changed; confirm other PR #1–#7 untouched/unmerged and no force pushes.
3. Screenshot A/B grid indexed by *actual native* profile/camera/seed/time; shader/report JSON of look parameters, crossfade and water delta, honest reference-video provenance. Indicate whether the actual `chuav2(1).mp4` was present.
4. All original binary SHA/byte checks, Event Engine equality, camera/actor unchanged, no GLB/assets overwritten; if runtime gold-material clones used, state exact material names, cloned count, cleanup test and any intentional difference from imported source PBR.
5. Commands, passed/failed tests and builds, browser/OS/GPU vendor, ECO/QUALITY wall vs virtual fps & p50/p95/p99, textures/geometries/draws/light counts, browser errors and context restore/leak checks; separate SwiftShader from Owner RTX.
6. Cost **0 VND**, **no Blender, no LIVE, no TikTok transport, no V1, no production merge**. List genuine blockers, residual PBR vs Cycles differences and deferred P0.12/P0.13 work.
7. **STOP at `P011_SA_REVIEW_REQUIRED`**, request SA code/visual-evidence review and then Owner P0.11 Visual GO. Do not continue into community/gift phase automatically.


## 9. SA PR #8 review blocker — 2026-11-23

**Reviewed exact PR #8 HEAD:** `e2a741c1cd45e028154fa5aefbf8e76c27390d46`. **Formal SA COMMENT review + inline evidence blocker:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/8#pullrequestreview-6015447164 . GitHub disallows `REQUEST_CHANGES` on the connected account's own PR, but this **SA technical HOLD is binding under Design/07**. Do not infer technical approval or Owner visual GO from 30 passing tests.

**What passed and must be frozen:** Scoped V2 viewer diff, correct P0.10 stacked base, two-profile dusk/pink/gold look blending, native water A/B, original R16/P02/P07b1 SHA checks, Event Engine/actor/camera/gift FIFO regression, and reproducible prior screenshots. Golden fissure contrast improved by darkening bark; the absolute vein luminance did not improve, so Owner visual judgment is still pending.

**Evidence blocker:** `apps/v2-viewer/evidence/p011/browser-report.json` contains **81 `WebGL: INVALID_OPERATION` console messages** around the intentionally induced `WEBGL_lose_context` test. `apps/v2-viewer/scripts/evidence-p011.mjs` around line 366 currently tests `/shader error|VALIDATE_STATUS false|GL_INVALID/i`, which does **not** match `INVALID_OPERATION`; therefore `errors: []` and the success assertion do not mean no GL errors.

**Focused Codex rework, restricted to existing PR #8 branch:**
1. Correct GL console classification to catch real `INVALID_OPERATION` / `INVALID_ENUM` / `INVALID_VALUE` and distinguish pre-loss, intentional-loss, restore and post-restore windows with actual timestamps and raw messages.
2. Re-run the deliberate loss→restore with **multiple real post-restore rendered frames** on ECO and QUALITY; verify nonblank pixels, correct warm sky/gold/water, exact existing A→B→C/gift pool semantics, and zero *persistent* GL errors during normal continued rendering. Prefer same-host P0.10 control run to distinguish inherited browser/driver warnings.
3. Fix renderer/material/GL resource lifecycle if invalid operations recur during normal post-restore rendering. If isolated to the synthetic context teardown, do not suppress the warnings: document exactly when/why they occur and demonstrate that subsequent normal rendering is clean. Ask SA to decide acceptability rather than falsely asserting no errors.
4. Push only the minimum viewer code/test/evidence correction, preserve previous valid before/after screenshots if runtime output unchanged, rerun affected tests and builds, and provide new exact HEAD, browser details, logs, error counts by phase and screenshot/trace provenance.

**Gate:** stop again at `P011_SA_REVIEW_REQUIRED` for SA re-review. **PR #8 must not merge; no P0.12 implementation, new assets, Blender, LIVE, V1 or RTX benchmark.** Owner P0.11 visual acceptance remains separate.
