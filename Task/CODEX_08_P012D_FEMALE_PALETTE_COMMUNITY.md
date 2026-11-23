# CODEX 08 — P0.12-D Female P05f + Genuine Clothing Variants in 12-Slot Community

> **SA ASSIGNMENT — 2026-11-23.** Owner has explicitly given **`OWNER_P012C_VISUAL_GO`** for P0.12-C [PR #11](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/11) at immutable HEAD **`5aadf1e603aa0c82369aa1abc60c807c6ce1748c`**, following [SA Technical PASS #6017762932](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/11#pullrequestreview-6017762932). SA now authorizes Codex **one isolated V2 Viewer DEMO-only character appearance diversity task**. **Hard STOP at `P012D_SA_REVIEW_REQUIRED`**, then SA code/visual review → separate Owner P0.12-D Visual GO. **No merge.**

## 1. Role, objective, scope / STOP

**Codex (AI Code) ONLY:** integrate **existing Owner-approved female cross-legged P05f** alongside currently accepted **male P07b1** into the same original 12-slot meditating lake community, and apply real `KHR_materials_variants` outfit colors encoded in those GLBs, without any mesh generation or source art changes. The aim is to break up 12 identical figures with a believable, restrained mix of male/female silhouettes and pastel áo bà ba colors. Keep all 12 visual locations, water, approved flora, Sakura, gift behavior, hero seating, and look/style **exactly** as accepted in PR #11.

**No extra actual viewers or avatar IDs.** Keep **3 actual DEMO seat capacity** and nine anonymous renderer-owned figures. Actual users are represented only by Event Engine `AvatarPresentation` and the valid `actorId → seatId` mapping. Anonymous and genuine people may share an identical artistic style, but must have separate identity authorization. **A real DEMO join into an existing seat does NOT change that seat's cosmetic model or clothing**, only its accepted display name, gift and authorized data; never guess real people’s gender or clothing from names/photos.

**Strict OUT OF SCOPE:** new GLBs, female kneel P05c pose, P07a1 undercut, any new hairstyle/eyes/face/hand sculpt, AI model-generation calls, Blender/Cycles reruns, new lotus pad or flora, landscape/mountains, new seats, production LIVE/TikTok adapter, actor capacity changes, gift effects P0.13, camera P0.9, lighting/water P0.11, procedural shader recoloring that replaces approved material variants, Event Engine core source, V1, RTX benchmark, paid tools, any PR merges. If an accepted asset cannot be verified at the exact pinned binary, **report a narrowly evidenced blocker rather than creating replacement art**.

**STOP:** New small, separate stacked Viewer PR, clear native real WebGL ECO/QUALITY screenshots, all regression tests and truthful metrics, then **`P012D_SA_REVIEW_REQUIRED`**. No default production rollout or next phase before SA+Owner gates.

## 2. Exact source pins, branch and immutable GLB contracts

- Repository: https://github.com/nguyenbui5701/OnlinePagodaVer2
- **New CODE branch baseline:** PR #11 `feature/v2-p012c-botanical-integration`, exactly **`5aadf1e603aa0c82369aa1abc60c807c6ce1748c`**. **New branch name suggested:** `feature/v2-p012d-character-diversity`, created from this exact SHA, and a **new stacked PR targeting `feature/v2-p012c-botanical-integration`**. Never push to PR #11 or upstream PR #2/#9/#10. Verify current heads before branching and before submission; if one moves, stop and ask SA to re-pin. Do not rebase/force-push others' branches.
- **Approved female art:** PR #2 `assets/lotus-pad-chibi-p0` exact **`ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced`**; path `Assets3D/Review/lotus_pad_chibi/p5f/meditator_female_cross_prayer_p05f.glb`; **574,608 bytes**, SHA256 **`3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4`**, **17,752 tris, 10 meshes, 21 material definitions, zero textures**; `SeatRoot`, `UpperBodyBreath`, `HeadAnchor`, `NameplateAnchor`, `FXAnchor`; `sit_idle` + `cross_prayer_idle` (2 seconds, 17 samples); `+Y` up, `+Z` forward, seat local origin 0 and P02 world `PadSeatAnchor=[0,.195,0]`. Original P05f Owner Art GO is explicitly in [AI Visual 09 task](AI_VISUAL_09_FEMALE_CROSS_SEAT_CONTACT.md) header after authentic Owner Cycles handoff at PR #2 HEAD `e80ddc496df461728d3ee4cb6170ce2c3ff4fbfa`. Historical `p5f/asset_manifest.json` has stale pending fields; **the real remote file and checksum, specific Owner final decision, not stale status flags**, govern this gate.
- **Frozen existing male:** source PR #2 same commit, `Assets3D/Review/lotus_pad_chibi/p7b1/meditator_male_cross_prayer_sidepart73_p07b1.glb`, **589,932 bytes**, SHA256 **`4e8c8d082352d67d0eaf637df7973931442c724a0f7db598ea8fde8de3873097`**, 17,420 triangles, 10 meshes, 21 materials, identical named anchors and two idle clips. Already staged and used in `p08-assets.json`; do not alter or re-stage with different hash.
- **Frozen pad/tree/flora** from PR #11: P02 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`, R16 ECO/QUALITY, floral PR #10 source `9a01b39afde642d55dcf9bc7639f3a84ef913e4d` and four original bloom/bud SHA. Keep existing `p08-assets.json`, `p012b-botanicals.json`, `sakura-r16.json` unchanged.
- **Six original material variant names** reportedly present in both GLBs' `KHR_materials_variants`:
  `pastel_lilac`, `blush_rose`, `sage_green`, `sky_blue`, `warm_cream`, `terracotta`. Validate exact **actual glTF extension JSON and primitive mappings** before claiming applied palettes; variant names in a manifest do not mean the renderer has already selected them.
- **Only allowed changed paths:** `apps/v2-viewer/**` Viewer source/tests/evidence, its new P05f input manifest `src/p012d-actors.json`, new `scripts/stage-p012d.mjs`, package script `assets:p012d`, typed look registry / scene and batching integration, `P012D.md` and `evidence/p012d/**`. No `Assets3D/**`, `packages/v2-events/**`, V1, PR #11/runtime branch or other scoped docs source changes.

## 3. Mandatory read order (no phantom test claims)

1. [Rules Design/07](../Design/07_WORK_RULES.md), [Design/14 zero-cost](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/16 owner handoff](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00 order](00_P0_EXECUTION_ORDER.md).
2. **Current contract** [Design/21 P0.12-D](../Design/21_P012D_CHARACTER_DIVERSITY_CONTRACT.md); [Design/20 P0.12-C](../Design/20_P012C_BOTANICAL_RUNTIME_INTEGRATION_CONTRACT.md), [Design/18 community](../Design/18_P012_LOTUS_COMMUNITY_SCOPE_AND_GATES.md), [Design/13 asset/event](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/09 camera](../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design/10 ECO/QUALITY](../Design/10_GRAPHICS_PROFILES.md).
3. [PR #11 SA Technical review #6017762932](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/11#pullrequestreview-6017762932), native real [P012C runbook/screenshots](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/5aadf1e603aa0c82369aa1abc60c807c6ce1748c/apps/v2-viewer/P012C.md), [PR #2 P05f manifest](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced/Assets3D/Review/lotus_pad_chibi/p5f/asset_manifest.json), actual P05f Cycles/seat-contact evidence and [AI Visual 09 Owner art GO](AI_VISUAL_09_FEMALE_CROSS_SEAT_CONTACT.md).
4. Exact PR #11 code `apps/v2-viewer/src/{seat-scene,community-layout,community-batches,community-presentation,main,verified-glb}.ts`, `src/p08-assets.json`, `scripts/stage-p08.mjs`, `scripts/stage-p012b.mjs`, `package.json` and old tests `test/{community,botanicals}.test.ts` **if present**. `packages/v2-events/**` read-only.
5. The original `chuav2(1).mp4` is not in GitHub. Use the shot/time summaries in Design 17, not imaginary direct video observations. Do not clone TikTok names, UI or faces.

## 4. SA grounded assessment and strict correctness

**Current PASS baseline:** P0.12-C PR #11 accepted visually by Owner; 12 exact slots, three true capacity, 9 anonymous chibis all currently **male P07b1**, approved lotus flower/bud, P0.11 twilight and water, P0.9 camera, gift FIFO, A/B botanic off/on and evidence. Current `seat-scene.ts` has one GLB P07b1 loader and `community-batches.ts` instancing nine extra male actors; neither implements female source nor per-slot color variant. Old 36 submitted tests passed on PR #11 (8 Event + 28 Viewer); those must be rerun at new SHA.

**New visual target:** 12 still total; seeded balanced P07b1/P05f silhouettes with **actual preexisting materials** so silhouettes/garments vary naturally. **Do not add more individuals, modify seats, expand actor capacity or claim 12 actual online viewers**. Existing real/anonymous visual equivalence must hold *for each slot*.

**Core hazards to explicitly test before claiming PASS:**
- P05f source is 17,752 vs male 17,420 tris. **Same anchor names do not imply identical mesh order/material mapping.** Validate each independently; cannot put mixed primitive row into existing single-source `createCommunityBatches` without checking mesh/material compatibility. Use separate batched groups per **source × primitive × material**, bounded by profile.
- **GLTFLoader does not guarantee automatically applying `KHR_materials_variants`** in current Three.js code. Parse supported extension mapping; ensure selected variant maps to actual material indices/names, and ECO/QUALITY don't accidentally show default color for every slot. If mapping absent/inconsistent, report exact metadata and STOP rather than fake success by changing `material.color`.
- P05f cross seat-contact original physically tested versus real P02 at Y=.195 (finite samples). Independent 9:16 side/3Q and 5 animation phase screenshots must show no hovering/penetration; preserve original `SeatRoot`, `UpperBodyBreath` hierarchy without global height hacks.
- Gift focus/room join must still target only real `actorId` and its actual selected source's `NameplateAnchor` and `FXAnchor`. If female used at real seat, gift halo/name still follows female head/FX, not a male cached transform.
- World actor appearance for occupied hero slot should **not change abruptly** upon join/TTL unless explicitly intended for an independently approved future user-preference feature. No inference of sex/gender from metadata, name, photos, pronouns, or LIVE provider. Stable cosmetic `slotLook` is present even for a `DECORATIVE_ANONYMOUS` hero seat.
- Deterministic seeded look distribution independent of event arrival order/room viewerCount and fixed camera. `?diversity=off` reproduces **exact PR #11 visual snapshots**, zero extra P05f requests and original P07b1 batch; only explicit `?diversity=on` in `demo=community` changes cosmetic appearance. For other old demos default/off untouched.

## 5. Phased execution with objective gates

### Phase 1 — Exact baseline / female source and variant audit (no scene changes yet)
1. Verify both PR #11 and PR #2 exact HEADs, create separate clean worktree/branch from **PR #11 SHA**; compare existing P0.12-C browser and 36 tests. Record source SHA/byte sizes and actual `P05f` art-owner acceptance. If baseline mismatch, STOP.
2. Implement isolated `p012d-actors.json` and `scripts/stage-p012d.mjs` **read-only** from immutable PR #2 SHA using prior staging approach: `git cat-file blob commit:path`, fetch only pinned source if needed, check exact checksum, GLB2 header/version/length and write only verified bytes to Viewer `public/p012d/`. `npm.cmd run assets:p012d` is a NEW script; implement before claiming it passes. Do not edit the existing P08/art/glb source manifests, original assets or branch.
3. Independently parse actual female `KHR_materials_variants` primitive mapping, materials/anchors/clips/bounds. Validate male equivalent and 6 real named variants. Document which primitives vary (e.g. clothing only), which don't (skin/hair/eyes), and whether `GLTFLoader` currently exposes a usable plugin. If female SOURCE cannot be verified/animated, submit a **PARTIAL audit** and STOP, do not disguise a wrong mesh with code.

### Phase 2 — Correct deterministic appearances (no Event Engine changes)
1. Implement typed seeded cosmetic look registry for **12 original slot IDs**: maleP07b1 or femaleP05f + genuine approved named variant; seed 9/71 yields both silhouettes and multiple real colors, no claim about the viewer's demographic. Default OFF and true `?diversity=on|off` comparison in community mode.
2. Refactor viewer loading/seat construction **minimally** so exactly the approved actor mesh source is chosen for each hero or anonymous slot, preserving original P02 seat and world transform; keep name and FX anchors source-specific. Animate hero three sources with original clips; far 9 extras batched by model/primitive/material variant without mixing incompatible mesh index mappings. Explicit instancing caps per ECO/QUALITY; if the 6-color layout is too costly, use a measured 3-color ECO subset.
3. Verify name and gift lifecycle at a **female real hero seat**, existing male hero seat and out-of-capacity fallback; duplicate joins and TTL do not redraw genders or move seats. Anonymous figure has no name, actorId, seatId, roomId, gift ownership or online count. **Do not derive appearance by inspecting user names or real-life gender.**
4. Keep existing botanicals hash/placement, twilight and exposure, tree, gift FX and camera code untouched. Ensure `diversity=off` loads no female file and retains old baseline screenshot hash at fixed seed/clock.

### Phase 3 — Code tests, native WebGL and same-host performance
1. Re-run all **8 Event + 28 Viewer** existing tests and both builds; add P012D unit/integration tests for source GLB hash/byte+GLB2 fail-closed, extension mapping per male/female, palette actual applied material equality, seeded cosmetics determinism/NO identity mapping, multiple models instanced safely, female P02 contact and correct animated anchors, no hidden female asset load OFF, gift/TTL/overflow/camera regression. Do not change `packages/v2-events/**`; no real LIVE.
2. **Actual 720×1280 native WebGL ECO+QUALITY** A/B matching same seed/profile/fixed camera/time: LOW COMMUNITY, LAKE, AERIAL, UNDER TREE, female side/3Q close on real P02 at t=0/.5/1/1.5/2, member arrival with same body before and after, gift A/B/C and Duyên no-seat fallback. At least 6 genuine native screenshots per relevant profile, with screenshot metadata, SHA, camera FOV and seed. The accepted P012C baseline must be **pixel identical when diversity OFF**.
3. Same-host matched `?diversity=off/on` rAF wall frames at fixed clock for ECO and QUALITY, sample count and machine/renderer; report draw calls, triangles, textures/geometry/material count, GPU resource/disposal and page errors. Use P0.12-C SwiftShader **ECO 2.90 FPS / QUALITY 0.85 FPS** solely as context, not performance acceptance thresholds or Owner RTX result. If excessive batches, reduce palette breadth instead of faking metrics or removing genuine GLB detail.
4. Browser context loss/restore with both model kinds present; test `INVALID_OPERATION` detection and distinguish normal post-restore render from documented synthetic teardown warnings. Confirm no resource alias/double-dispose between female, male, botanicals, original P02/Sakura, and preserve 3 real seats after restore.
5. `apps/v2-viewer/P012D.md` Windows PowerShell and implemented local URL, exact test/build/perf logs, `evidence/p012d/` screenshots, counted look layout, source/art/GLB checksum report, snapshot and no-seat trace, fail-closed test evidence and **0 VND**. No screenshot fabricated by AI image generation.

### Phase 4 — New stacked PR, SA gate and Owner decision
1. Submit ONLY `apps/v2-viewer/**` changed paths in a new PR **stacked onto PR #11** at unchanged `5aadf1e603aa0c82369aa1abc60c807c6ce1748c`. Never merge/cherry-pick source PR #2, and do not force-push any existing branches. Retain asset source hashes in new viewer manifest and show which GLBs were staged read-only.
2. Summarize `SA finding → code change → actual evidence → PASS/PARTIAL/HOLD`; per-slot look table, authentic male/female GLB source, selected actual material mapping, 720×1280 side-by-side shots, 36 old tests plus new, ECO/QUALITY real cost, precise worktree/source/head refs and known limitations. **Do not claim user-specific appearance preferences are live**, since this phase intentionally assigns only synthetic visual style.
3. **STOP at `P012D_SA_REVIEW_REQUIRED`.** SA reviews exact new PR; Owner judges characters/palette in the real local moving browser before the next task. No merging, GPU hardware/Live Studio benchmark, new actor variants, LIVE adapter, P0.13 gift expansion or V1 edit.

## 6. Acceptance matrix

| Gate | PASS | BLOCKER |
|---|---|---|
| Source/provenance | Female 574608B and exact SHA, P05f verified 17,752 triangles/anchors/clips; male original hash unchanged; no new GLB sculpt | Unapproved haircut/pose or failed checksum |
| Clothing colors | Real `KHR_materials_variants` primitive mapping; multiple actual assigned male+female colors | Cosmetic color faker or incorrect mapping |
| World/animation | Exactly 12 original pads; female actor seated without low-angle foot/pants gap; original 2s idle | Float/collision, moved camera/seat |
| Authority | Same visible body during anonymous→real at hero seat; only real snapshots have names/gifts; 3 real seats | Fake users, inferred gender, wrong actor gift |
| Rendering | ECO/QUALITY native 720×1280 before/after, OFF pixel-identical PR #11; bounded instancing | Only concept/Blender shots, huge uncontrolled cost |
| Policies | New stacked viewer PR, zero cost, no source mesh/PR mutation, no merge/V1/LIVE | Unauthorized live changes |

## 7. Windows PowerShell commands — use only scripts verified/implemented

```powershell
# After creating NEW Codex P0.12-D worktree from exact PR #11 HEAD
Set-Location packages/v2-events
node --version
npm.cmd ci
npm.cmd test
npm.cmd run build

Set-Location ../../apps/v2-viewer
npm.cmd ci
npm.cmd run assets:p08
npm.cmd run assets:p012b
# New command only after it is actually implemented in package.json:
npm.cmd run assets:p012d
npm.cmd test
npm.cmd run build
npm.cmd run dev -- --port 5184 --strictPort
```

**Proposed browser after Codex implements query switch:** `http://127.0.0.1:5184/?demo=community&seed=9&profile=quality&look=twilight&clean=1&botanicals=on&diversity=on`. A/B replace `diversity=on` with `diversity=off`. This URL is **not** a feature currently present in PR #11; do not promise it works before implementation.

## 8. Final Codex report / STOP

Final report: exact base PR #11 and art PR #2 SHA, actual GLB hashes/bytes, new PR/commit SHA, selected looks and material IDs for seed 9/71, 12 slots vs three actual real actors, member→same-look handoff, camera/gift A→B→C, native WebGL images, test count and actual browser/CPU/GPU metrics, 0 VND and **`P012D_SA_REVIEW_REQUIRED`**. If any prerequisite is contradicted by real GLB metadata or browser screenshots, call `BLOCKED` and return the smallest source evidence, not a new art/production task without SA.
