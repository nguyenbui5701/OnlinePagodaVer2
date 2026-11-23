# CODEX 12 — P1.0-B1 Offline LIVE-Event Replay Bridge / No Real Provider

> **SA ASSIGNED — 2026-11-23.** Owner explicitly requested skipping the GPU check until later and continuing the next implementation phase. This is **a sequencing deferral, not an RTX PASS or permission for true TikTok LIVE**. Exact contract: [Design 25 — Offline LIVE-Event Replay Bridge](../Design/25_P10B1_OFFLINE_LIVE_EVENT_REPLAY_BRIDGE.md). Implement a provider-neutral, **LOCAL SYNTHETIC REPLAY ONLY** ingress into the existing V2 \`DemoEngine\` and existing Viewer to demonstrate live-like identity, membership, gifts, disconnect/reconnect and camera focus. **STOP \`P10B1_SA_REVIEW_REQUIRED\`; do not merge.**

## 1. Role / scope / objective / STOP

**AI Code/Codex ONLY.** Add an isolated, versioned offline event/replay source (validated synthetic packets -> original typed \`DemoEvent | SessionEvent\` -> existing Event Engine -> existing SceneObserver/SliceDriver-compatible output -> 3D Viewer). Keep all original art, camera, seat and graphics outputs unchanged unless explicitly in replay mode.

**Not part of this task:** real TikTok API/events, TikTok LIVE Studio, WebSocket/HTTP listeners for external traffic, operator tokens/cookies/credentials, production user data, live output, provider library/SDK/terms integration, payment/revenue, auto-start from prod builds, V1, RTX benchmark, GPU performance claims, original art/Blender, new GLB, changing 12 display positions/3 real seats, extra actual users, or any upstream PR merge. The original rose-ring and hill art remain deferred. **No use of a third-party TikTok SDK even for tests**; create synthetic fixtures under the repo.

**STOP:** publish new stacked Code PR and actual evidence \`P10B1_SA_REVIEW_REQUIRED\`, no merge. SA technical review then separate Owner offline-visual decision. A future real-provider P1.0-B2 requires explicit authorization and reinstatement of hardware risk/gate.

## 2. Exact reviewed repos, SHA and branch policy

Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2

- **New branch base:** [PR #14](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14), exact HEAD **\`5101df8ee0a7e63b391c9f72be4f5c79bc88b20f\`**, \`feature/v2-p014-seven-shot-parity\`, stacked on PR #13 **\`0810f537a7cbffd539c8acb9b8cd6ba2715bbc9f\`**. SA Tech PASS [review #6019006145](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14#pullrequestreview-6019006145); Owner P0.14 Visual GO.
- **GPU status:** [Design 24](../Design/24_P10A_OWNER_GPU_HARDWARE_PREFLIGHT.md)/[CODEX 11](CODEX_11_P10A_OWNER_GPU_HARDWARE_HARNESS.md) **deferred by Owner**, not implemented/failed/passed. **No PR #15** was observed during initial planning; do not invent or silently branch from an unreviewed GPU harness.
- Create a **fresh separate worktree/branch** from exact PR #14 SHA, suggested \`feature/v2-p10b1-offline-event-bridge\`. Open **new PR targeting \`feature/v2-p014-seven-shot-parity\`**. Never push onto PR #14, old PR #2/#9–#13, \`main\` source, or any asset branch. If PR #14 head has moved, STOP for SA re-pin. No force-push/merge.
- **Allowed changed files:** isolated new source/fixtures/tests within \`packages/v2-events/**\`; minimal opt-in \`apps/v2-viewer/src/{replay-driver,main,slice-driver}.ts\` only if necessary to share a typed driver seam; \`apps/v2-viewer/test/**\`, actual replay local evidence scripts/docs under \`apps/v2-viewer/{scripts,evidence/p10b1,P10B1.md,package.json}\`. Do **not** alter existing \`packages/v2-events/src/{focus,registry,engine,protocol}.ts\` or \`apps/v2-viewer/src/{camera,seat-scene,lighting,water,gift-fx,gift-blessing}.ts\` unless an identified input integration defect is evidenced, isolated and approved by SA first. No \`Assets3D/**\`, Design/Task files or V1 changes by Codex.

## 3. Mandatory reading order and grounded prior state

1. [Design/07 Rules](../Design/07_WORK_RULES.md), [Design/14 zero cost](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/16 Owner gate log](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00 execution order](00_P0_EXECUTION_ORDER.md).
2. **[Design 25 — authoritative P1.0-B1 contract](../Design/25_P10B1_OFFLINE_LIVE_EVENT_REPLAY_BRIDGE.md)**, [Design/13 typed contract](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/09 camera + fairness](../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design/17 roadmap](../Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md), [Design/24 deferred GPU](../Design/24_P10A_OWNER_GPU_HARDWARE_PREFLIGHT.md), [Design/23 accepted screenshots](../Design/23_P014_SEVEN_SHOT_PARITY_AND_QA_CONTRACT.md).
3. Read [PR #14 SA review #6019006145](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/14#pullrequestreview-6019006145), exact \`P014.md\` and \`evidence/p014/**\`. Code \`packages/v2-events/src/{protocol,engine,focus,registry,fixture}.ts\` and \`apps/v2-viewer/src/{slice-driver,main}.ts\` AT THAT EXACT SHA; verify \`package.json\` actual command scripts before using.
4. Current **protocolVersion = \`0.1.0\`**, source \`DemoEngine.ingest(unknown)\` accepts only roomEpoch/connection/events with safe counts; \`session.open\` requires increasing roomEpoch and connection=1; \`session.reconnect\` requires connection increment by 1; \`gift.progress\` requires streakId and is not confirmed, \`gift.final\` contributes confirmed counts only once. \`Snapshot\` and \`Effect\` remain authoritative, and \`SceneObserver\` rejects mismatched version/revision/clock. \`SliceDriver\` currently owns its own fixtures, which the minimal replay driver must not cross-wire by default.
5. Actual source \`chuav2(1).mp4\` is **not** available in the Codex GitHub worktree. Do not fabricate original video frames; use already accepted P014 source-shot description. No TikTok provider endpoint/payload spec has been audited or approved.

## 4. P0 risk and exact technical requirements

- **Identity/authority:** A real actor appears only after allowed engine member/chat/gift rules. \`spawnOnMember\` currently false unless explicitly overridden; do not silently change semantics. At most **three** real seated DEMO actors (existing \`timing/maxAvatars:3\`), the other nine displayed figures remain anonymous. Only \`DemoEngine\` issues real \`actorId,seatId,FocusIntent\` and \`confirmedGiftCount\`.
- **Security:** Strictly allowlisted *local immutable original synthetic fixture*; reject dynamic remote URLs/paths, unknown packet types, malformed UTF-8/JSON, huge packets, invalid \`userKey\`, \`giftId\`, \`eventId\`, \`count\` and long/control/HTML display names. Feed untrusted shape into explicit validation before normalizing to typed \`DemoEvent\`/\`SessionEvent\`. No host messages, file upload or network endpoint. Use escape/sanitized DOM as existing code, prevent prototype pollution and log injection. Retain no raw real identities or cookies because source data must be purely fictional.
- **State scope:** Monotonic virtual \`atMs\`, deterministic ordering for equal timestamp (declare priority for session events), \`roomEpoch\`/connection version; stale previous room/connection events dropped. End session and new room clears old camera focus, played ledger, active FX and registry correctly.
- **Gift:** A observed streak followed by final (confirmed only once), duplicated final with fresh \`eventId\`, progress after final, B/C FIFO, D/no-seat text-only, queue capacity, request expiry, later reconnection, reconnect duplicate suppression. No blessing for observed-only/no-seat; no wrong-giver focus or fake 'rose' count. No duplicate snapshot effect from replay step.
- **Replay:** One \`ReplayDriver.update(atMs)\` with same minimal return shape as \`SliceDriver.update(atMs)\` so Viewer uses existing camera/renderer. A replay event consumed once on monotonic clock; deterministic proof for repeated/reloaded runs. Capture disposition logs and bounded amount of traces; do not call \`DemoEngine\` twice or invent another gift queue.
- **Feature flag:** New **\`?source=replay\`** plus allowlisted \`fixture\` ID in **\`import.meta.env.DEV\` and localhost/127.0.0.1 only**. The ordinary old \`?demo=...\` behavior and screenshots must remain baseline-identical without the flag. Static production build must disable replay (test this explicitly, including direct \`?source=replay\` on nonlocal host). No live API, real social account, background listener or LIVE Studio.
- **Art/scene:** No R16/P02/P07b1/P05f/bloom/bud/FX/lighting/camera source change; preserve valid original GLB SHA. Source interposition cannot change guest positioning/appearance when replay flag is absent.

## 5. Phased implementation

### Phase A — Read/lock baseline / declare adapter wire shape
Check exact source PR #14 SHA, correct worktree, existing Event/Viewer test baseline **8 +39=47**, two builds and local stage scripts. Map existing \`DemoEvent|SessionEvent\` verbatim. Design versioned synthetic fixture schema, bounded parser and a common existing-result type. Reject any design requiring actual TikTok data/credentials.

### Phase B — Implement local offline replay, not TikTok
Write self-contained parser, original synthetic fixtures for idle and 66s community/gift sequence, including room/reconnect/invalid/overflow. Implement opt-in \`ReplayDriver\` that uses one \`DemoEngine\` and existing SceneObserver/seat mapping, route to Viewer only when explicit DEV+loopback source flag is on. Avoid import-time network, accidental production injection or exposed global mutable raw event queue. Use existing gift progression correctly. Implement tests for valid/invalid event types and results.

### Phase C — Prove domain+WebGL, negative tests and limited costs
- Run existing **47** tests and two package builds at exact new SHA, plus unit/integration tests for malformed/oversize fixtures, invalid key/name/URL, hostile payload, repeated/final streak, duplicate ID, stale/connection/room flip, no-seat, FIFO, fair queue, TTL, device-independent timestamp ordering, memory caps and no remote fetch. Proof fixture-only results equal direct-engine ingest of equivalent typed events.
- True native **720×1280 ECO+QUALITY** browser WebGL screenshots at 6+ distinct source-grounded views per profile: empty cinematic, A progress, A confirmed, B/C FIFO, D/no-seat overlay, disconnect and new-room reset, final cinematic. Include 85s idle and ≥66s replay cases, seeds 9/71/1337, actual \`source=replay\` and \`source=demo\` A/B image parity for legacy when flag absent. Do not claim fake thumbnails generated from still concepts as native WebGL evidence.
- Honest runtime frame costs if measured. No Owner RTX benchmark or VRAM claim; mark \`P10A_GPU_DEFERRED\` and \`P10B2_REAL_PROVIDER_NOT_AUTHORIZED\`. Recreate documented WebGL context-loss/restore, actor/gift effects identity and non-leaking disposal. Only genuine local fixtures and 0 VND.

### Phase D — New GitHub PR handoff / STOP
Open new stacked PR from exact PR #14 HEAD targeting \`feature/v2-p014-seven-shot-parity\`; changes only allowed source/test/fixture/evidence paths. Deliver \`apps/v2-viewer/P10B1.md\` with real implemented command names, Windows PowerShell runbook and local preview URL; replay fixture JSON schema and SHA, error handling, 47 old tests + new, both builds, native browser screenshots/trace and clear **no external network** evidence. No merge/force-push, no new model, no production LIVE, no real TikTok provider, no GPU PASS.
**STOP \`P10B1_SA_REVIEW_REQUIRED\`**; SA reviews exact new HEAD, Owner separately judges offline replay, then later explicit approval before P1.0-B2 real provider or concurrent Studio is considered.

## 6. Owner PowerShell baseline — verified scripts only

Start in a new clone/worktree rooted at PR #14 pin:

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
    npm.cmd run dev -- --port 5188 --strictPort

**Only after Codex implements \`?source=replay\` in a DEV-safe new PR**, proposed URL:
http://127.0.0.1:5188/?source=replay&fixture=community-gifts&seed=9&profile=quality&clean=1&botanicals=on&diversity=on&blessing=on
This is **NOT** a working URL on original PR #14; do not claim replay enabled there. Any proposed \`replay:p10b1\` script must first be added to package.json and proven in log.

## 7. SA gates

| Gate | State required |
|---|---|
| Correct git/source boundary | exact PR #14 pinned, no art/Events core/V1/PR chain mutation |
| Adapter | strict local synthetic schema/limits, typed 0.1.0 engine input, deterministic snapshots |
| Gift and people | 12 visual/3 real, confirmed once, A→B→C, no-seat D, reconnect/session reset, no leaked focus |
| Viewer | true local 720×1280 ECO/QUALITY + old DEMO baseline parity when flag absent |
| Security | prod disabled, loopback DEV only, no remote fetch/listener, no third-party credentials/user records |
| Performance/GPUs | no RTX PASS claim, software only if available, P10A still deferred |
| STOP | \`P10B1_SA_REVIEW_REQUIRED\` → SA → Owner offline replay visual GO; no merges or LIVE |


## 8. Owner skips CODEX 12 and authorizes CODEX 13 — 2026-11-23

**Superseding Owner direction:** “chúng ta cũng sẽ bỏ qua phần tích hợp mô phỏng này, tiến đến phần có thể Live luôn nhé. hãy đọc rules với vai trò sa và thực hiệm.” **Do not execute this offline replay task.** Its status is `P10B1_OWNER_SKIPPED_NOT_PASS`; there is no submitted implementation or production replay source. Its requirements remain only historical design reference, not a prerequisite for new real LIVE work.

**Current Codex assignment:** [CODEX 13 P1.0-B2 Real LIVE Studio + Event Gateway](CODEX_13_P10B2_REAL_TIKTOK_LIVE_STUDIO_AND_EVENT_GATEWAY.md) under [Design 26](../Design/26_P10B2_REAL_LIVE_STUDIO_AND_EVENT_GATEWAY.md), pinned on approved PR #14 exact HEAD `5101df8ee0a7e63b391c9f72be4f5c79bc88b20f`. Build direct real provider feasibility + owner-operated Studio capture + authenticated local event ingress. Unit-test fixtures are still allowed *as tests*, never as false real LIVE evidence. **P1.0-A GPU remains deferred NOT PASS**, and provider license/available connection, real verified gift, Owner Studio preview and manual broadcast are separate non-automatic gates. **STOP `P10B2_SA_REVIEW_REQUIRED`**; no merges, live credentials or GPU claims.
