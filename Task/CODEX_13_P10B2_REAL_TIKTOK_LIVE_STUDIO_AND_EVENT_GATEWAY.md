# CODEX 13 — P1.0-B2 REAL TikTok LIVE Studio + Event Gateway (No Separate Offline Replay Phase)

> **SA TASK — 2026-11-23.** Owner explicitly said **“chúng ta cũng sẽ bỏ qua phần tích hợp mô phỏng này, tiến đến phần có thể Live luôn nhé. hãy đọc rules với vai trò sa và thực hiệm.”** This authorizes building the real LIVE capability, **not automatic broadcasting or unknown third-party licensing/payment**. **[Design 26 — P1.0-B2 Real LIVE Contract](../Design/26_P10B2_REAL_LIVE_STUDIO_AND_EVENT_GATEWAY.md)** is authoritative. Owner deliberately SKIPPED `CODEX 12 P10B1` offline replay and DEFERRED `CODEX 11 P10A` hardware benchmark. Neither has PASSED and neither should be implemented in this assignment.
>
> **HARD STOP: `P10B2_SA_REVIEW_REQUIRED`** at NEW stacked Code PR. If no lawful/accessible live provider is available without an unapproved fee/license/credential transfer, report `P10B2_PROVIDER_ACCESS_BLOCKED` honestly and deliver only the LIVE Studio capture/runbook portion. No merge, V1 edits, source asset edits, credentials in repo/chat, GPU PASS, or autonomous Go LIVE.

## 1. Role, scope, objective and gate

**Role: Codex (AI Code).** Implement a real owner-operated **TikTok LIVE-ready** stack in one isolated task, comprising **(A) a real 720×1280 3D Viewer source captured by TikTok LIVE Studio**, and **(B) an actual verified inbound LIVE event worker → normalized V2 Engine → original camera/gift FX**, from the Owner's actual eligible LIVE room when access is available. **Skip an independent synthetic replay bridge phase**. Isolated dummy packets in test cases are permitted for security/regression; **they never count as LIVE integration evidence**.

**Explicit non-goals:** do not fabricate a LIVE connection, expose a public control socket, request TikTok session cookies or account passwords in chat, scrape protected user data, bypass sign-in/CAPTCHA/rate-limit/paywall, purchase/give gifts, automate Studio Go LIVE button, change artist GLBs/camera/12 seats/3 real-seat limit, use paid plugins without Owner permission, edit V1, merge any upstream PR, claim physical RTX performance, or introduce unrelated rose/hill art.

**No separate "must build simulated bridge first" task.** Focus on the real source. The provider SDK may be replaced if proven blocked; every real provider choice and any additional dependencies require exact version/license/privacy/pricing evidence, and the source must actually work under the account and platform rules. **Do NOT select an AGPL project, managed signing API or copy a previously written V1 worker into this project without verifying obligations and getting approval where needed.**

## 2. Exact repository / branch / pins

- Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2
- **Viewer baseline:** [PR #14](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14), branch `feature/v2-p014-seven-shot-parity`, reviewed immutable HEAD **`5101df8ee0a7e63b391c9f72be4f5c79bc88b20f`**, base PR #13 `0810f537a7cbffd539c8acb9b8cd6ba2715bbc9f`. [Formal SA Review #6019006145](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14#pullrequestreview-6019006145) and Owner P0.14 Visual GO. All previous GLB/Viewer PRs remain OPEN/unmerged.
- **Branch/PR:** create fresh worktree and **`feature/v2-p10b2-real-live-pilot`** from exact PR #14 HEAD. Open ONE new stacked Code PR whose base is `feature/v2-p014-seven-shot-parity`. Do not push onto PR #14 or merge/cherry-pick PRs #2/#9–#14. If pinned HEAD differs STOP and ask SA to re-pin. Do not branch from unimplemented CODEX 11/12 or an imaginary PR #15.
- **Allowed changed paths:** new separate `packages/v2-live-gateway/**` source/tests/package/lock and `apps/v2-viewer/**` minimal real input/status/transport wiring, local scripts, tests, proof and `P10B2.md`. `packages/v2-events/src/{engine,focus,registry,protocol}.ts` and original GLBs/Assets3D, camera, lighting, 3 real-seat + 9 anonymous layouts, V1 are READ-ONLY unless SA grants a **specific separately reviewed** change after a proved compatibility issue.
- Source V2 `DemoEngine` currently only consumes `protocolVersion 0.1.0` typed events and `SliceDriver` internally loads DEMO scripts; **there is no existing real TikTok connector in this V2 branch**. Do not claim an underlying live server or source exists. `?demo=community` is DEMO, not LIVE, until a verified real gateway is connected.
- Existing Owner P1.0-A RTX 3050 Ti ECO / RTX 3060 QUALITY validation is **deferred, not PASS**. Keep current 720×1280, original visual fidelity PARTIAL for rose icon and far hills.

## 3. Required read order — exact and source-grounded

1. [Rules Design/07](../Design/07_WORK_RULES.md), [Zero-Cost/PR Design/14](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Owner gates Design/16](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00 execution order](00_P0_EXECUTION_ORDER.md).
2. **[Design 26 — P10B2 Real LIVE Studio + Gateway Contract](../Design/26_P10B2_REAL_LIVE_STUDIO_AND_EVENT_GATEWAY.md)**. Then [Design/09 Gift Camera](../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design/13 Typed Event/3D](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/17 roadmap](../Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md), [Design/23 shots](../Design/23_P014_SEVEN_SHOT_PARITY_AND_QA_CONTRACT.md), [Design/24 GPU still pending](../Design/24_P10A_OWNER_GPU_HARDWARE_PREFLIGHT.md), [Design/25 offline task explicitly skipped](../Design/25_P10B1_OFFLINE_LIVE_EVENT_REPLAY_BRIDGE.md).
3. [PR #14 formal SA review #6019006145](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14#pullrequestreview-6019006145) and existing `apps/v2-viewer/P014.md`, native P014 evidence, exact GLB SHA/manifest. Source `packages/v2-events/src/{protocol,engine,focus,registry}.ts`, `apps/v2-viewer/src/{slice-driver,main,community-presentation,seat-scene,gift-fx,gift-blessing}.ts`, `package.json` scripts from the pinned PR.
4. **Live upstream verification:** available **official** approved source if it actually documents LIVE room events, or an allowed/owner-approved nonofficial worker after license, terms, signing privacy and zero-cost checks. Explicitly inspect the current source/README/LICENSE of any candidate, e.g. https://github.com/zerodytrash/TikTok-Live-Connector (unofficial Node, AGPL, possible third-party signature) or https://github.com/isaackogan/TikTokLive (unofficial Python, modified AGPL); do not assume either is officially endorsed or an unconditional no-fee credential-free API. Operator access to LIVE Studio must be verified on Owner Windows desktop, not guessed.
5. The actual `chuav2(1).mp4` source video is NOT in this Github tree; use accepted seven-shot compositions, do not claim original pixel matches or copy third-party TikTok UI.

## 4. Phase 1 — REAL provider feasibility and LIVE Studio capture, no separate synthetic deliverable

1. Check exact SHA and parent PR; current V2 source runs; Owner LIVE Studio and creator account availability is a **manual operator prerequisite**. Build a valid local `LIVE_STUDIO_WINDOW_CAPTURE` runbook at 720×1280 landscape/portrait settings and 9:16 clean source. Show the native Viewer in an actual browser window; operator manually adds Window Capture (or officially supported capture source) in Studio. Document black-frame fallback, preview-only status and manual `Go LIVE`. Do **not** sign in, handle credentials or start a public stream for Owner.
2. Validate at least one **genuine authorized event provider** candidate with a decision table `official/unofficial, SDK name/version/license, pricing, signing service, privacy, device/account permissions, room identity, real connection possible`. Look for existing V1 source READ ONLY if accessible; if absent say absent. **Do not download SDK with AGPL/custom licensing into published app until its obligations are reviewed/accepted.** No bypass or unknown "free" service. If provider cannot be accessed or is paid/unlicensed: mark `P10B2_PROVIDER_ACCESS_BLOCKED`, preserve Studio capture and STOP safely; do not fake real gift data.
3. Only if legally and technically usable, record a minimal successful **read-only real room connection** with redacted room identity, source package SHA/locked version, connection timestamp/status, disconnect and no-message heartbeat. A connected room with zero gifts is **not** proof gifts work.

## 5. Phase 2 — Real receiver and local authenticated event transport

1. Implement one separate Node worker in `packages/v2-live-gateway/**` or a single clearly isolated process; no credentials in frontend. Provider calls run **server-side only**. Normalize actual incoming room/member/chat/like/gift events to **`DemoEvent | SessionEvent` version 0.1.0**, strict validate `unknown` bytes/counts/user keys/HTML/URLs, version-stamp roomEpoch/connection and monotonic event clock. Raw provider IDs and private names stay local/masked in logs. Do not import live UI state as authoritative `FocusIntent` or invent 12 real actors.
2. Use a **loopback-only authenticated** protocol from worker to browser, ephemeral short-lived secrets, strong same-origin/Origin and session checks, rate/frame caps and bounded queues, throttled likes/chat. No public WS port, open CORS, arbitrary remote URL or browser-side TikTok Webcast client. Handle short-lived bridge token exchange securely, not in URL/query/referrer/log; no unsafe production devserver exposure.
3. **One Event Engine** runs the actual domain state. Its existing `roomSessionId`, `actorId`, `seatId`, FIFO scheduler, gift `observed/confirmed` dedup and `giftFx` are sole authorities. True room changes open new epoch/clear stale gifts; connection reconnect increments scope and does not duplicate cumulative streak gifts. Provider gift semantics (**streak repeatCount vs increment, finished/end marker, event ID stability**) must be learned from **specific verified upstream schema and real event sample**, not assumed. Do not count a progress event as confirmed; never make up final acknowledgments.
4. Viewer must support explicit **`source=live`** with operator status `OFFLINE|CONNECTING|CONNECTED_NO_EVENTS|EVENTS_VERIFIED|DISCONNECTED|DEGRADED`, no false gift when connection absent, clean cinematic no-gift fallback, reconnection freeze/resume and original three seat identity. Existing `?demo=idle/gifts/capacity/community` routes unchanged. Do not silently auto-fallback from LIVE to demo fixture while showing LIVE. The existing `spawnOnMember=false` default must not change without separate Owner design approval.
5. Ensure shutdown worker closes provider and local sockets, flushes bounded queues, scrubs transient secrets; browser context restore reconnects safely, no duplicate gift FX. No live data persisted/uploaded by default. Expose sanitized operational counters and errors only to operator, hide TikTok private identifiers from public capture.

## 6. Phase 3 — Tests, native real Viewer/Studio evidence and owner-operated live end-to-end

- Run **all baseline 47 old tests** (8 Event + 39 Viewer from PR #14 logs) and both builds plus receiver tests: malformed/prototype-polluted packets, huge counts/UTF-8/name/URL, wrong user/room, dup event IDs/streak finals, reconnect, stale room reset, lost connection, no gift, B/C FIFO, pending queue cap, no-seat D, time drift, heavy bursts/backpressure, unknown provider schema, missing room, auth/origin rejection, prod no secret injection, graceful shutdown. Use test fixtures for tests **only**; never substitute them as LIVE evidence.
- Minimum **six authentic native 720×1280 ECO+QUALITY WebGL camera shots** plus before/after for actor/gift, actual local LIVE flag, correct P07b1/P05f, 12 positions/3 live real actors, gift overlay, clean 9:16 and Studio preview screenshot taken by Owner when available; original glTF hashes remain pinned.
- Owner manually operates LIVE Studio on their own eligible account: local Viewer window capture preview first, then **if the Owner chooses**, short real live session while gateway is connected. Show provenance and time correlation of one real `member/chat` event (redacted), one **actual confirmed gift if one arrives without requesting or spending money**; verify normalized accepted engine event, correct one-time gift count, actor/seat, camera, FX, and return; otherwise mark `REAL_GIFT_END_TO_END_PENDING`. Test disconnect/reconnect and no-event cinematic. An artificial `gift('A')` input can pass a test but **never counts as live acceptance**.
- Hardware status stays `P10A_GPU_DEFERRED`; record actual renderer and approximate per-profile performance if measured, but **no stable 30 FPS or RTX/30min claim** from software SwiftShader or an unqualified single screenshot.
- No live provider event logs, account identifiers, tokens, cookies, avatar photos or Studio login data committed to Github. Sanitized reviewed diagnostic/event structure only, with evidence classification `VERIFIED_REAL|OWNER_PENDING|SYNTHETIC_TEST`.

## 7. Phase 4 — One stacked PR, Codex report, STOP

- New PR from exact PR #14 HEAD onto `feature/v2-p014-seven-shot-parity`, only `packages/v2-live-gateway/**` / `apps/v2-viewer/**`. If provider access blocked, submit honest partial **Studio capture/runbook + safe adapter boundaries**, not a fake working gateway.
- Deliver `apps/v2-viewer/P10B2.md` with **two independent command flows** (Studio capture and real gateway), only scripts actually added/verified, explicit Windows PowerShell instructions without real account handles/keys, manual local startup/stop, provider selection/licensing/fee decision and artifact chain, all tests and builds, redacted snapshots, rate/authority, zero-cost or cost-blocked. No automated public Go LIVE.
- Final concise report: `SA finding → implementation → actual evidence → PASS/PARTIAL/BLOCKED`; include source/head SHAs, new PR URL, provider proven, Studio preview verified or owner pending, gift actually verified or pending, renderer, exact changed paths, follow-up Owner hardware and streaming gates. **STOP `P10B2_SA_REVIEW_REQUIRED`** → formal SA code/provider/real event review → Owner manual broadcast GO/NO-GO. **No merge, GPU PASS or LIVE capability claims by assumption.**

## 8. Windows PowerShell baseline — currently verified PR #14 scripts only

From a fresh worktree at exact pinned SHA:

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
    npm.cmd run dev -- --port 5189 --strictPort

Owner manual **video-only** preview URL using existing DEMO (NOT real gift source):
`http://127.0.0.1:5189/?demo=community&seed=9&profile=eco&look=twilight&clean=1&botanicals=on&diversity=on&blessing=on`.

**After Codex implements and proves it**, proposed real event URL `http://127.0.0.1:5189/?source=live&profile=eco&clean=1&botanicals=on&diversity=on&blessing=on`, with localhost operator gateway separately started using a newly implemented actual script. `source=live` does **not exist in original PR #14**. Never show this prospective URL as a working LIVE integration yet.

## 9. Exact gate table

| Gate | Current outcome |
|---|---|
| Owner direction to build real LIVE | GO (preparation/integration only) |
| GPU CODEX 11 | DEFERRED, NOT PASS |
| offline CODEX 12 | SKIPPED, NOT PASS |
| Source provider license/availability | NOT VERIFIED; STOP if blocked |
| Studio preview on Owner account | PENDING until screenshot/actual preview |
| Real member/chat/gift | PENDING until owner-operated, real-room evidence |
| `P10B2_SA_REVIEW_REQUIRED` | STOP when new code PR delivered |
| Public go-live/merge | OWNER CONTROLLED, NOT AUTOMATED |
