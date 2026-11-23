# CODEX 11 — P1.0-A Owner GPU Hardware Profiler & Validation Handoff (NO LIVE)

> **SA ASSIGNED — 2026-11-23.** Following [PR #14 formal SA Tech PASS #6019006145](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14#pullrequestreview-6019006145) at exact HEAD **`5101df8ee0a7e63b391c9f72be4f5c79bc88b20f`**, Owner said **“tôi thấy oke, tiếp tục”**. Record **`OWNER_P014_VISUAL_GO`** for current reviewed 7-shot/3-seed native 9:16 visuals, including existing fast aerial→gift approach. **The reference's rose-ring and far hills remain deferred**; P0.14 image approval does not certify original video pixel parity or hardware speed.
>
> **Mandatory source-of-truth [Design 24 — P1.0-A Hardware-Only Contract](../Design/24_P10A_OWNER_GPU_HARDWARE_PREFLIGHT.md)**. Codex creates ONLY an **accurate, owner-runnable real-GPU benchmark harness and runbook** in a new stacked V2 Viewer PR. **STOP `P10A_HARNESS_SA_REVIEW_REQUIRED`**. Owner GPU results are a separate after-review gate; do NOT run LIVE Studio/TikTok adapter or invent RTX results.

## 1. Role, objective, clear STOP and prohibited scope

**Role:** Codex/AI Code. Build/reuse a small, *truthful* deterministic measurement harness + Windows PowerShell runbook for the already accepted V2 Viewer scene. Do not optimize or change approved runtime source, light/camera/GLBs/seat count/gift behavior in this first task; gather the baseline **before** recommending any performance changes.

**Actual Owner devices from Design 10:** PC #1 RTX **3050 Ti 4GB → ECO**; PC #2 RTX **3060 8GB → QUALITY**. Both first at **720×1280 actual canvas**. Design target ~30fps sustained; no promise or auto-pass. Current Codex/SA GitHub evidence is only Windows Edge/ANGLE **SwiftShader software renderer**, ~0.82 QUALITY FPS on community wide; this is **not** a real RTX estimate. **Hardware owner tests are still PENDING** and can only be performed on real Owner PCs.

**Prohibited:** changes to `packages/v2-events/**`, V1, `Assets3D/**`, R16/P02/P07b1/P05f/lotus GLBs, camera, water, graphics presets, gift FIFO and FX, 12 visual slots/3 actual seats, LIVE Studio capture, TikTok provider/api/keys, invented 24/100-actor crowd, new rose/hill art, new Blender/media, unapproved paid tools and any Git merge/force-push. No changes to original stacked PRs or existing CODEX 10 evidence. Do NOT disable visible content to artificially boost FPS.

**HARD STOP A:** submit NEW profiler PR + testing evidence `P10A_HARNESS_SA_REVIEW_REQUIRED`. **HARD STOP B AFTER SA GO:** provide Owner-facing runbook and await sanitized hardware reports `P10A_OWNER_GPU_EVIDENCE_REQUIRED`. No live adapter or simultaneous live stream without later explicit separate Owner permission.

## 2. Exact repositories, immutable baselines and allowed paths

- Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2
- **Stacked parent:** [PR #14](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14), branch `feature/v2-p014-seven-shot-parity`, exact HEAD **`5101df8ee0a7e63b391c9f72be4f5c79bc88b20f`**, base PR #13 `0810f537a7cbffd539c8acb9b8cd6ba2715bbc9f`; HEAD includes evidence-only P0.14, no runtime change. **Do not modify parent PR branch**.
- **New worktree/branch:** suggested `feature/v2-p10a-owner-gpu-preflight` from exact HEAD. **New separate stacked PR** targeting `feature/v2-p014-seven-shot-parity`. Before branching verify current SHA, clean worktree and true source-art SHA; if parent HEAD changes STOP and ask SA to repin.
- **Allowed edits only `apps/v2-viewer/**`:** `scripts/owner-gpu-p10a.mjs` (or similarly named Node/Playwright runner), `scripts/owner-gpu-sample.ps1` optional `nvidia-smi` helper, `test/p10a-*.test.mjs`, `package.json` new `gpu:p10a` script only after implemented, `P10A.md` Windows instructions and `evidence/p10a/harness/**` **software/fixture samples explicitly marked NOT OWNER GPU**. Never commit personal machine metadata, raw profiles, accounts, serial numbers or actual owner logs until sanitized/authorized. Prefer no source `src/**` modifications; use existing report/inspect endpoints as they actually exist.
- Preserve original SHA pins and exact Code source `__REPO_REVISION__`; do not spoof the app revision or silently import from another branch.

## 3. Required reading order (do not skip)

1. [Design/07 Rules](../Design/07_WORK_RULES.md), [Design/14 zero-cost](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/16 approvals](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00 order](00_P0_EXECUTION_ORDER.md).
2. **[Design 24 — P1.0-A Hardware-only benchmark contract](../Design/24_P10A_OWNER_GPU_HARDWARE_PREFLIGHT.md)**, [Design 10 actual owner GPU profiles](../Design/10_GRAPHICS_PROFILES.md), [Design 17 Step 5 sequence](../Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md), [Design 23 seven-shot QA](../Design/23_P014_SEVEN_SHOT_PARITY_AND_QA_CONTRACT.md).
3. [PR #14 SA formal review #6019006145](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14#pullrequestreview-6019006145), [P014 runbook and measured 42-shot matrix](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/5101df8ee0a7e63b391c9f72be4f5c79bc88b20f/apps/v2-viewer/P014.md), [PR #14 SwiftShader browser report](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/5101df8ee0a7e63b391c9f72be4f5c79bc88b20f/apps/v2-viewer/evidence/p014/browser-report.json) and regression/GL report. **No hardware sample in that file.**
4. Actual pinned code `apps/v2-viewer/src/{main,camera,seat-scene,community-layout,avatar-look,gift-fx,gift-blessing,botanical-scene}.ts`, `apps/v2-viewer/scripts/{evidence-p014,p014-shots}.mjs`, `apps/v2-viewer/package.json`, V2 Event `packages/v2-events/src/**` **READ ONLY**. Do not claim an instrument/export already exists if it is not in source.
5. Reference clip is not available in GitHub/Codex environment: use Design 17 reference goals and original actual Viewer frames, not fictitious source-media pixel comparisons.

## 4. Phased objective workflow — no GPU PASS from a workstation-only harness

### Phase A — source and instrumentation audit
- Verify source, original approved 12 display positions / 3 true actor seat cap / nine anonymous, fixed R16/P02/P05f/P07b1/bloom/bud hashes, old 47 tests and both builds if changes affect tests/build. Verify `?profile=quality`, `demo=community|capacity|gifts|idle`, `crowd=off` and original `inspect=1` behavior **from source**, not assumptions.
- Probe WebGL adapter before any measurement: headful Edge on Windows/real screen; no `--use-angle=swiftshader`, `--enable-unsafe-swiftshader`, GPU block/zero-copy spoof, hidden/background/minimized tab. Capture WebGL unmasked renderer with `WEBGL_debug_renderer_info` if available, signed GPU model corroboration from Windows/NVIDIA source, browser version and requested pixel/dpr. Unknown/SwiftShader/llvmpipe must produce **`GPU_NOT_VERIFIED` and disallow `PASS`**.
- Inspect existing profiling evidence runner for correct rAF frame measurements; distinguish virtual DEMO seconds advanced for deterministic shots from actual **wall-clock rAF intervals while rendering**. Reject missing frame samples, paused browser, page visibility not visible and suspicious fixed 16.7ms values from synthetic code. Reuse old `viewerReport` runtime metrics (draws, triangles, textures etc) read-only if possible.

### Phase B — implement small reusable hardware runner (not an optimizer)
- Add only the instrumentation and fail-closed checks needed to collect real-time profile samples from the **currently approved render loop**. For each selected profile and seed, record >= several windows of **60 seconds real elapsed** across community-low, Sakura-aerial, gift-focus, lake/under-tree and full cinematic loops at true browser speed. Record rAF counts, real elapsed wall seconds, mean and median FPS, p50/p95/p99 and max frame milliseconds, 1% low, >100ms and >250ms stalls; valid loaded GLB hashes/scene count, confirmed real gift actor identity and fallback.
- Include supported baseline modes without inventing unsupported actor-count controls: **3 original occupied-capable seats, 12 visual slots (9 decorative)**. Only attempt a different supported `crowd=off` comparison if the code truly supports it. Do not add 24 or 100 viewers, do not generate fake live users or alter Events.
- GPU memory/driver: owner may run `nvidia-smi --query-gpu=name,driver_version,memory.total,memory.used,utilization.gpu --format=csv` at ~1s interval when available; if unsupported record **NOT_AVAILABLE** and request Windows Task Manager GPU memory/driver screenshot, never invent memory via `performance.memory`. A helper is allowed but must not require administrator, hardware serials or extra purchases.
- Scenario fidelity: check gift 2 hoa hồng belongs to An; Duyên is no-seat text only, valid A→B→C and no replays, actor name/face readable; ECO/QUALITY still source-approved and don't change looks to inflate FPS. Maintain screenshot snapshots at 720×1280, rate/event logs and camera route/return.
- WebGL recover: test actual GPU context loss/restoration in a **short independent diagnostic** after time series; no false "no warnings" when inherited synthetic teardown invalid-delete debt exists. Guard against accidentally inducing GPU instability during the 30-minute duration. For live runner, stop safely on crash, keep partial evidence and state reason.

### Phase C — Codex validates harness, Owner later runs hardware
- On any available Codex environment run isolated unit tests for metrics calculations, adapter classification, sampling time base, percentile edge cases, output sanitization, fail closed logic; old 47 tests and two builds as appropriate. If only software ANGLE/SwiftShader is available, run a short smoke and store **`HARNESS_ONLY_SOFTWARE`**, not numerical PASS for the RTX 3050/3060.
- Supply native 720×1280 screenshot and sanitized exact execution logs, runner schema `sourceSha, browser, canvas, adapter, gpuSampleSource, profile, seeds, duration, frames, frameStats, draws, triangles, VRAM, errorLogs`, with missing entries null/not available. Note hardware-free testing cannot demonstrate true 15- or 30-minute Owner stability.
- Write `apps/v2-viewer/P10A.md` with exact **Owner Windows PowerShell commands** for both machines, all prerequisites (Node >=24, Edge path, `nvidia-smi` optional), appropriate power/capture settings, how to preserve source fidelity and collect screenshot + JSON without secrets. Document two passes: initial **15min smoke ECO** on 3050 Ti, then **30min qualification ECO 3050 Ti** and **30min QUALITY 3060**. Clearly indicate what actions require Owner physical machine; no automatic remote action.
- Define measured decision: target ~30 FPS sustained and desired p95 <=33.3ms, record actual p99, JS heap and VRAM; failure/PARTIAL and targeted measured bottleneck if not met. No "already PASS" prior to real logs. High runtime environment overhead cannot be inferred from headless Edge/SwiftShader.
- Owner must provide either the generated sanitized reports or explicit availability of connected source for SA to audit. No continuous monitoring or asynchronous work claims.

### Phase D — new PR evidence and hard STOP

- Open only new stacked Viewer-only PR from exact PR #14 HEAD, no changing old branches/PRs, no production setting changes, no LIVE/RTMP/TikTok actions.
- Report **SA finding → Codex action → measurable harness evidence → PASS/PARTIAL/HOLD**, **`P10A_HARNESS_SA_REVIEW_REQUIRED`**, new HEAD and PR URL, exact filename list, no hidden GPU model guesses, 0 VND, protected artifacts. Hardware-specific profile outcomes remain **`P10A_OWNER_GPU_EVIDENCE_REQUIRED`** until actually recorded on each Owner PC.
- SA reviews the harness PR, after that Owner runs GPU test and reports; hardware acceptance may spawn a single measured optimization task (not an unbounded redesign). **Do not merge, do not run LIVE Studio, do not integrate real provider**. Later LIVE requires explicit new Owner GO.

## 5. Windows PowerShell baseline (verified only from existing source)

From a NEW P1.0-A worktree rooted at the PR #14 exact SHA:

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
    npm.cmd run dev -- --port 5187 --strictPort

Existing PR #14 supports the DEMO query settings, e.g. `http://127.0.0.1:5187/?demo=community&seed=9&profile=quality&look=twilight&clean=1&botanicals=on&diversity=on&blessing=on`. The above launch is a local DEMO, NOT a LIVE endpoint. `npm.cmd run gpu:p10a` is **proposed**, and must not be claimed existing until Codex adds and validates that script in the new PR.

## 6. Review/checkpoint matrix

| Gate | Required result | If missing |
|---|---|---|
| Harness SA source/safety | reproducible runnable script, true device detection, valid rAF and no source alterations | HOLD harness |
| 3050 Ti ECO 720x1280 | actual Owner GPU logs, per-shot frame quantiles and >=30min stability | EVIDENCE PENDING |
| 3060 QUALITY 720x1280 | same actual Owner GPU logs, actual VRAM and draw details | EVIDENCE PENDING |
| Viewer actor/camera truth | source-approved 12/3, original P05f/P07b1, gift A→B→C and no-seat D | HOLD if altered |
| Optional higher crowd | no unsupported 24/100 fake performers, only new separately approved density task | DEFER |
| TikTok LIVE/Studio | **NOT AUTHORIZED in P1.0-A** | HOLD |


## 7. Owner defers CODEX 11 and starts CODEX 12 — 2026-11-23

Owner instruction **“có thể bỏ qua bước kiểm tra này làm sau, tiếp tục triển khai next step”** explicitly defers this assignment. **CODEX 11 implementation NOT STARTED / NOT PASS / no Owner GPU evidence yet**; do not open or assume its harness PR, do not run RTX 3050 Ti/3060, and do not claim that the older SwiftShader evidence is physical GPU qualification. This is an audit-preserving **schedule HOLD**, not task deletion or loss of hardware acceptance criteria.

**Active successor:** [Design 25](../Design/25_P10B1_OFFLINE_LIVE_EVENT_REPLAY_BRIDGE.md) and [CODEX 12 — Offline Live-Event Replay Bridge](CODEX_12_P10B1_OFFLINE_LIVE_EVENT_REPLAY_BRIDGE.md), independent new Code PR from exact [PR #14](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14) reviewed HEAD `5101df8ee0a7e63b391c9f72be4f5c79bc88b20f`. All input strictly local synthetic data and a DEV+loopback Viewer switch; **no real TikTok provider/LIVE Studio/credentials, no production acceptance or merges**. **STOP `P10B1_SA_REVIEW_REQUIRED`**, later SA and Owner offline replay gate. Return to CODEX 11 only when Owner explicitly resumes hardware testing.
