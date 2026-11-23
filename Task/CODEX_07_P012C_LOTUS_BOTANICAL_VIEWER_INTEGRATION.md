# CODEX 07 — P0.12-C Approved Lotus Bloom & Bud / 12-Seat Viewer Integration

> **SA ASSIGNED / 2026-11-23 / OWNER P012B BOTANICAL ART GO.** This is a **Codex runtime integration task** for the **already approved** P0.12-B original lotus flower and closed bud, ECO/QUALITY. No mesh authoring, AI Visual work, Blender rerun, source asset PR merges, LIVE adapter or RTX claims. **STOP at `P012C_SA_REVIEW_REQUIRED`** on a new stacked viewer PR → SA review → **Owner P0.12-C Visual GO**. No merge without Owner approval.

## 1. Role / scope / outcome / STOP

**Role:** AI Code / Codex exclusively: import/stage/verify approved GLB bytes, render low-cost deterministic flowers and buds into the P0.12-A 12-position lake community, profile ECO and QUALITY, preserve actor identity/camera/gift architecture, measure real browser cost and provide native WebGL screenshots.

**Owner-approved visual outcome:** the existing 12 meditating chibis and Sakura in the Owner-accepted dark twilight lake gain appropriately scaled **open pale-blush lotus blossoms and upright closed buds**, arranged in modest foreground and midground groups around (not on top of) lily pads. Flowers/buds are quiet environmental flora with no real actor, seat, name, gift or user keys. Approved P0.12-B geometry, materials and waterline are **immutable**; no subjective "make them prettier" sculpting in this task.

**Only Codex/Viewer P0.12-C**. New actor clothing/female variants (later P0.12-D), new mountains/shoreline, P0.13 gift choreography, LIVE event connectors, 12 real-event actor capacity, camera route retiming, water re-shading, new particle density, full-screen bloom or new production mesh geometry are **OUT OF SCOPE**. Never modify `packages/v2-events/**`, `Assets3D/**`, original Sakura/P02/P07b1, prior PRs/heads or V1.

**STOP:** once source, tests, original browser captures, performance and staged PR are ready, return `P012C_SA_REVIEW_REQUIRED`. SA Technical PASS and Owner Visual GO are separate; no automatic merge, deployment, Blender, LIVE Studio or P0.13.

## 2. Exact repo revisions / branch / art provenance — verify FIRST

Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2

**Runtime baseline:** [P0.12-A PR #9](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/9), exact HEAD **`0a5d060d0ec4eeda19d62cfcd4a58a29f58c38bf`**, head branch **`feature/v2-p012a-community-demo`**; target of the new stacked PR. P0.12-A has [SA TECH PASS #6016205924](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/9#pullrequestreview-6016205924) + Owner Visual GO. It includes P0.11 Owner-accepted twilight/water and P0.9/P0.10 camera/gift correctness.

**Approved art source:** [P0.12-B PR #10](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/10), exact HEAD **`9a01b39afde642d55dcf9bc7639f3a84ef913e4d`**, branch `assets/p012b-lotus-blossom-bud`. SA [Art PASS #6017468836](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/10#pullrequestreview-6017468836) and **Owner Botanical Art GO explicitly granted 2026-11-23**. Asset PR #10 is a separate unmerged stack targeting PR #2, and does NOT automatically share binary files with PR #9. **Do not merge/cherry-pick PR #10 into the runtime branch.**

**Integration PR:** from **exact PR #9 commit** create new branch, suggested `feature/v2-p012c-botanical-integration`. Open **new stacked PR targeting `feature/v2-p012a-community-demo`**. Never commit to any existing P0.12-A/P0.12-B branch. Recheck exact PR #9/#10 heads immediately before branching; if either moves, STOP and request SA re-pin rather than silently consume a new revision. Do not force push, self-merge, rebase/mutate approved stacks.

**Allowed changed files ONLY:** `apps/v2-viewer/**`, including `src/p012b-botanicals.json`, new loader/scene module, `src/main.ts` integration, `scripts/stage-p012b.mjs`, `package.json` to register *real implemented* `assets:p012b` / optional `evidence:p012c`, tests, `P012C.md` and `evidence/p012c/**` outputs. Do not alter existing `src/{sakura-r16,p08-assets}.json` or current `scripts/stage-p08.mjs` source pins/behavior.

## 3. Required reading — no shortcuts or invented baseline

1. [Design/07 Rules](../Design/07_WORK_RULES.md), [Design/14 Zero Cost](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/16 Owner Handoff](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00 Execution Order](00_P0_EXECUTION_ORDER.md).
2. **Latest approved cross-team contract** [Design/20 P0.12-C Integration](../Design/20_P012C_BOTANICAL_RUNTIME_INTEGRATION_CONTRACT.md), [Design/18 P0.12 community](../Design/18_P012_LOTUS_COMMUNITY_SCOPE_AND_GATES.md), [Design/19 P0.12-B audit](../Design/19_P012B_BOTANICAL_ASSET_AUDIT_AND_SCOPE.md), [Design/13 asset↔Event contract](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/09 camera](../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design/10 ECO/QUALITY profiles](../Design/10_GRAPHICS_PROFILES.md) and [Design/17 video-fidelity map](../Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md).
3. [P012B SA Art PASS](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/10#pullrequestreview-6017468836), exact [P012B manifest](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/9a01b39afde642d55dcf9bc7639f3a84ef913e4d/Assets3D/Review/lotus_botanicals/p012b/asset_manifest.json), four authentic approved [P012B Cycles 9:16 context images](https://github.com/nguyenbui5701/OnlinePagodaVer2/tree/9a01b39afde642d55dcf9bc7639f3a84ef913e4d/Assets3D/Review/lotus_botanicals/p012b/P012B_Cycles_Evidence) and original actor/leaf baseline on PR #9.
4. Read at PR #9 exact SHA `apps/v2-viewer/src/{main,seat-scene,community-layout,community-batches,community-presentation,verified-glb,asset,water,gift-fx,slice-driver}.ts`, `src/{p08-assets,sakura-r16}.json`, `scripts/stage-p08.mjs`, `scripts/evidence-p012a.mjs`, `package.json`, `P012A.md`, prior tests, plus `packages/v2-events/**` **read-only**.
5. **Reference provenance:** Owner's `chuav2(1).mp4` was inspected by SA; it is not in GitHub. Use Design 17 shot descriptions ~0–5s, 6–10s, 26–29s and 40–43s as inspiration **unless independently supplied to Codex**. Don't falsely claim native video access, clone TikTok UI or reuse specific user names/pictures.

## 4. Exact four approved GLBs — freeze byte-for-byte

Canonical source directory at PR #10 exact SHA: `Assets3D/Review/lotus_botanicals/p012b/`.

| GLB file | Bytes | SHA-256 | Tris | Dimensions (approx.) |
|---|---:|---|---:|---|
| `lotus_bloom_p012b_quality.glb` | 50,004 | `63edb12d02664a44ce4484b847ef07aeffab6a22a36cf44415b141f56804f0d0` | 1,728 | 0.743×0.299×0.746 m |
| `lotus_bloom_p012b_eco.glb` | 20,924 | `8dce16649f0dff541601047628ad7175f0b9ec028e7803b967cf2dee5efc0bd5` | 589 | 0.733×0.279×0.726 m |
| `lotus_bud_p012b_quality.glb` | 20,940 | `fe62a2f9aeb166d0eadf758c75eb47950a9053d8f2149d2a66ceaf5007a05f1a` | 648 | 0.289×0.634×0.290 m |
| `lotus_bud_p012b_eco.glb` | 8,552 | `c442cc04c3b0094a920c2b86fb202233782d5076a97e1110a84b345df3f0d082` | 192 | 0.290×0.634×0.283 m |

- Coordinates: meters, **+Y** up, root at **lake world Y=0**, bloom petal plane near water and bud rises ~0.634m. Preserve original GLB local origin, material colors/alpha/doubleSided/normals and dimensions. 3 PBR materials bloom, 2 bud, no textures/cameras/animation, no new geometry. `P012B_botanicals_editable.blend` already exists and remains out-of-scope for Codex (SA disclosed independent-open caveat).
- Existing P02 SHA `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`, male P07b1 `4e8c8d082352d67d0eaf637df7973931442c724a0f7db598ea8fde8de3873097`, Sakura ECO/QUALITY `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173` / `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c`: none change.

## 5. Phased implementation / objective gate sequence

### Phase 1 — Baseline, provenance and asset acquisition (NO scene changes yet)

1. Save `git status --short`, `git rev-parse HEAD`, baseline PR #9/#10 exact HEADs. Create a fresh branch/worktree at PR #9 exact SHA, not the Owner's or AI Visual's working directory. Record current P0.12-A baseline screenshots/metrics at seeded 720×1280 community LOW/LAKE/AERIAL/UNDER-TREE; don't recapture an entire earlier phase without need.
2. **Implement a new separate pinned runtime botanical manifest** `src/p012b-botanicals.json` (only four assets) with Git source commit and ref, source paths, exact hash/bytes, profile mapping, waterline, verified triangles/materials, 0 textures; do not modify existing P0.8 manifest or PR #10's art manifest.
3. Mirror the **real already-working** `scripts/stage-p08.mjs` approach: `scripts/stage-p012b.mjs` uses `git cat-file blob 9a01b39...:Assets3D/Review/lotus_botanicals/p012b/<file>` for each of four GLBs. When commit missing from local repo, fetch **`refs/pull/10/head`** (read-only) and assert the **pinned SHA**, rather than silently switch to current latest PR head. Before write to `public/p012b/`, validate bytes, SHA-256, GLB2 header/version/declared byte length; avoid leaving a corrupt partial manifest/staged set after a failed verification. Provide real `npm.cmd run assets:p012b` script, test tampered/missing binary, report source commit and source file paths in log.
4. Reuse existing `importVerifiedGlb('p012b', ...) ` so runtime verifies bytes and SHA after `fetch`, and validate actual loaded mesh counts/triangles/materials/texture count and bounds against pinned art manifest. Fail closed if wrong source or corrupt/tampered content: show an honest error, don't pretend a debug mesh is production bloom. Honor AbortSignal, load once per LOD source and dispose correctly. `botanicals=off` must not force extra GLB file load when explicitly disabled.

### Phase 2 — Deterministic low-cost P0.12-A botanical community

1. A separate typed `botanical-layout.ts`/renderer module owns **floral decorative IDs only** (`flower-* / bud-*`), seeded placement and per-instance transforms. Reuse original flower/bud GLB geometry/materials and appropriate **InstancedMesh/batching** where safe; no new sculpt, generated vertex mesh, texture or per-frame extra clone, and avoid duplicate GPU material disposal.
2. Keep **12 P0.12-A community slots exactly**, with `seat-1..3` positions/camera actor/gift anchors frozen; 3 real seats cap and 9 anonymous figures unchanged. A flower is **never** an AvatarPresentation, SeatRegistry seat or FocusIntent target; don't change room viewer count, `confirmedGiftCount`, nameplate, gift FX or no-seat text-only fallback.
3. Initial **candidate caps:** ECO up to **3 blooms + 5 buds**, QUALITY up to **5 blooms + 8 buds**. These are evidence targets, not quotas overriding visible quality or performance. Place some near but never under pads; P02 conservative radius ~1.067m, bloom radius ~0.38m, bud ~0.15m, plus justified margin. Include camera corridor and tree base/gold fissures clearance; check projected overlap in fixed LOW/LAKE/AERIAL/UNDER-TREE/gift views, avoid flowers obscuring face/name/gift. If collisions or performance occur, reduce counts first before code/GLB changes.
4. `?botanicals=on|off` **new documented switch**, default to on **only for `demo=community` with crowd enabled**, off for old `demo=idle`, `demo=gifts`, `demo=capacity` and `crowd=off` legacy comparisons. Record exact actual behavior of any explicit overrides. Legacy mode and original gifts tests should retain prior screenshot/image hashes at fixed timestamps, not just tests passing. Do not assert this query parameter existed at PR #9.
5. ECO/QUALITY choose correct audited LOD. Optional very slow bounded stem sway only if it adds meaningful value and is deterministic; no need to invent a separate petal shader or geometry animation. Reuse existing P0.11 twilight/water look untouched; verify petals not blown out, stems contact water, no incorrect water reflections claimed.
6. Scene cleanup on abort/reload/context loss/pagehide/HMR must avoid disposing shared P02/R16/P07b1 materials or leaving InstancedMesh buffers, GLTF roots or retained promises behind. Renderer resource counts must remain bounded for many camera cycles.

### Phase 3 — Tests, native WebGL evidence and same-host performance

1. Run baseline **Event Engine 8 + Viewer 25 = 33 tests** (per PR #9 logs) plus targeted floral tests: four source GLB hash/size/source pin; ECO/QUALITY structural checks; seeded placement repeatability seeds **9 and 71**; no pad/root/camera/gift occlusion; old 12 slot positions and identities unchanged; flora never counted as an actor/focus/viewer; `botanicals=off` exact old scene; disposal/context restore; corrupt or absent asset fails closed; old `demo=idle,gifts,capacity,community` cases have correct gift A→B→C and no-seat behavior.
2. Genuine native **720×1280** Edge/Chromium WebGL screenshots for **both ECO and QUALITY**, minimum **six** comparable target shots: (a) low community `botanicals=off/on`, (b) near-water side, (c) aerial Sakura/lake depth, (d) under-tree with gold veins visible, (e) real An gift focus and no-seat Duyên fallback, (f) return/85s idle shot. Use equal camera pose/FOV, exact seed/profile and deterministic virtual time for before/after. Provide machine-readable screenshot index with SHA/source revision; no Blender or generated image represented as runtime evidence. Original source-video `chuav2(1).mp4` is not a GitHub asset: report if unavailable to Codex.
3. Measure **same host, same fixed camera and virtual scene** old PR #9 (botanicals=off) vs new PR (on) for 720×1280 ECO and QUALITY: actual GPU/renderer (ANGLE/SwiftShader/RTX), 30–90 rAF wall-frame intervals (state sample size), p50/p95/p99, FPS, draw calls, triangles, geom/material/textures, JS heap if available; include one 85s idle cycle and ≥66s community event/gift fixture. Record cost of staging GLBs and runtime memory when possible. No invented Owner RTX 3050Ti/RTX3060/LIVE results, no automatic pass at 30 FPS.
4. Rerun browser context loss/restore if new asset disposal path is added: detect real `INVALID_OPERATION` console cases with phase-separated teardown vs normal rendering, avoid the earlier P0.11 false-negative regex. Confirm several native frames after restore remain populated with correct flora and colors, resource count bounded. Don't mislabel preexisting synthetic teardown warnings as "zero GL errors".
5. Exact binary provenance proof: stage logs for four original GLBs, SHA/bytes, artist commit, unchanged existing R16/P02/P07b1 original hash, exact PR #9 source and new PR HEAD, `package.json` real scripts, complete `P012C.md` Windows runbook and `evidence/p012c/` images, trace, browser report, tests/build logs, **0 VND**.

### Phase 4 — PR submission and stop

- New **small, independent stacked Code PR** from PR #9 HEAD `0a5d060d...` targeting branch `feature/v2-p012a-community-demo`, working in new worktree. No binary art edits in original PR #10; staged copies under viewer public are **derived bytes only**, with git provenance and hash. Do not push changes to PRs #2/#5–#10. Do not make source asset acquisition require merging art first.
- List exact changed paths, file-level before/after, stage/test/build/ECO+QUALITY evidence, screenshot matrix and all known limitations. Report source and doc SHA and which gates are passed vs Owner pending.
- **Stop at `P012C_SA_REVIEW_REQUIRED`**. SA will inspect new PR code + native images + numbers, then Owner decides whether the flower/bud look fits the 12-seat lake. If accepted, later separately assess **P0.12-D character variation** (P05f female and actual variant compatibility) or proceed to P0.13 only after new design authorization. No merge/GPU/LIVE/V1.

## 6. Pass/fail matrix

| Gate | PASS requires | BLOCKER example |
|---|---|---|
| BIN | 4 real GLB2 from pinned PR #10, bytes/SHA/LOD/meter bounds validated; fail-closed tampering | Latest branch used silently, fake source primitive, incorrect GLB |
| WORLD | Real flower/bud visible near original 12 pads at sensible waterline; deterministic and no collisions | Flowers on seats, cover face/nameplate, float/sink, tree hidden |
| IDENTITY | Zero flower↔actor/seat link; baseline real viewer/gift FIFO unaffected | Dummy rose-focus, false `viewerCount`, extra real seats |
| LOOK | Native ECO & QUALITY 9:16 LOW/LAKE/AERIAL/UNDER/GIFT contexts, better layered lake depth than P0.12-A | Only Cycles PNG proof, offscreen flower, blown-out petals |
| PERFORMANCE | Capped instancing/source reuse, same-host costs reported and reasonable; no unbounded resource growth | Unknown cost, per-frame material clones, fake RTX pass |
| POLICY | Independent PR, no art reauthoring, no merges or LIVE/V1, 0 VND | Code creates mesh, unpinned binary, unauthorized source change |

## 7. Verified commands / evidence runbook template (Windows PowerShell)

Baseline has **`npm.cmd run assets:p08`**, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run dev`. **`assets:p012b` and `evidence:p012c` are NOT available until implemented** by Codex; don't claim they already run.

```powershell
# Run inside NEW P0.12-C code worktree, at the proper repository root:
Set-Location packages/v2-events
node --version
npm.cmd ci
npm.cmd test
npm.cmd run build
Set-Location ../../apps/v2-viewer
npm.cmd ci
npm.cmd run assets:p08
# New *implemented* script only:
npm.cmd run assets:p012b
npm.cmd test
npm.cmd run build
npm.cmd run dev -- --port 5183 --strictPort
```

**Proposed URL once Codex actually implements the switch**:
`http://127.0.0.1:5183/?demo=community&seed=9&profile=quality&look=twilight&clean=1&botanicals=on`; A/B replace `on` with `off`. These are **not** current PR #9 working URLs.

## 8. Mandatory final Codex response

`SA finding → code action → actual evidence → PASS/PARTIAL/HOLD`, exact base `0a5d060d...`, approved art source `9a01b39...`, new PR link/branch/HEAD, exact four binary SHA/bytes, actual placed number per LOD/profile, identity/camera/gift regressions, original 9:16 before/after WebGL, native browser/OS/perf sample size, zero-cost/asset-not-edited truth, known limitations and **STOP `P012C_SA_REVIEW_REQUIRED`**. Do not auto-assign P0.12-D, P0.13 or hardware testing.
