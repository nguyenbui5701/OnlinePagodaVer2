# CODEX 14 — P1.0-B3A Viewer Identity + Timed Chat-to-Floating Bubble + Gift-Type Bubble

> **SA TASK LOCKED — 2026-11-23 / FIRST IMPLEMENTATION.** Owner supplied six reference screenshots and asked for a complete SA package. Exact contract: [Design 27](../Design/27_P10B3_LIVE_PRESENCE_BUBBLES_AMBIENCE_RING_LAYOUT_TREE.md). This task covers only **Track A presence/chat/gift UI**, not Track B ring layout/mist/camera or Track C artist R17. **STOP \`P10B3A_SA_REVIEW_REQUIRED\`**; SA and Owner must review before CODEX 15. No merge, no Studio Go LIVE or fake TikTok provider.

## 1. Role, objective, scope & STOP

**Codex/AI Code** implements seat-bound sanitized display name + permitted/fallback avatar badge, validated chat content in an amended typed protocol, a visible 1–2-second chat bubble which then becomes an independently animated upward-floating bubble, and per-approved-gift-type visual bubbles governed by existing verified gift lifecycle. References: Owner screenshot #1 (name+profile/chat), #2 (floating bubble), #3 (multiple rose-like gift rings); photos/icons/text in those screenshots are **NOT** source media and must never be copied.

**Out of scope:** refitting R16 Sakura mesh/rig, new GLBs/rose artwork or platform icon scraping, new ambient/seat emitter particles, trunk mist, circular pad layout, extra camera shots, real provider choice, automatic TikTok login/LIVE Studio, real gift transactions, V1, 12 actual viewers or changing three authoritative seats, changing gift queue fairness, paid API/service, any upstream PR merge. Keep P10B2 source BLOCKED until actual provider is verified. Build small original UI components—not an offline replay system.

**Hard stop:** New stacked PR with code/tests/real WebGL evidence; \`P10B3A_SA_REVIEW_REQUIRED\`, then SA + Owner UI Visual GO. No automatic CODEX15, AI Visual or production LIVE.

## 2. Exact reviewed Git refs, changed-file policy

- Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2
- **Frozen Viewer baseline:** [PR #15](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/15), branch \`feature/v2-p10b2-real-live-pilot\`, exact HEAD **\`f22033b5a6f9bc7e34208d0ddcdf40ce2c0c1282\`**, stacked on PR #14 \`5101df8ee0a7e63b391c9f72be4f5c79bc88b20f\`. [Formal SA review PR #15 #6022198865](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/15#pullrequestreview-6022198865): **capture-only TECH PASS; real provider BLOCKED**. Its \`?source=live\` is OFFLINE fail-closed; **do not turn it into demo**.
- New isolated branch \`feature/v2-p10b3a-presence-bubbles\` from **that exact HEAD**, new stacked PR targeting **\`feature/v2-p10b2-real-live-pilot\`**. If parent HEAD moves, STOP and ask SA to re-pin. Do not push into PR #15 or other branches; do not merge or change checked originals.
- Allowed changed paths: \`packages/v2-events/src/{protocol,engine,registry}.ts\` **only the narrow versioned optional chat-text + typed effect/sanitization extension** supported by tests; \`packages/v2-events/test/**\` or existing test scripts; \`apps/v2-viewer/src/{community-presentation,main,slice-overlay,gift-fx}.ts\` as strictly needed, new \`src/{chat-bubbles,gift-icon-bubbles,avatar-badge}.ts\` or equivalents, CSS, \`test/**\`, exact new \`scripts/evidence-p10b3a.mjs\` **only if implemented**, \`P10B3A.md\` and \`evidence/p10b3a/**\`. No \`Assets3D/**\`, R16/P02/P05f/P07b1/botany source changes, \`camera.ts\`, background scene effects, V1, Design/Task documents in Codex PR.
- **Raw visual reference images** are in the Owner chat, not in GitHub; compare by intent descriptions in Design27 rather than claiming direct GitHub asset access. Source TikTok account/real avatars unavailable; no actual LIVE screenshot/data can be claimed.

## 3. Mandatory reading order

1. [Design/07 Rules](../Design/07_WORK_RULES.md), [Design/14 Zero-Cost](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md), [Design/16 approval](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00 order](00_P0_EXECUTION_ORDER.md).
2. **[Design 27 / Track A](../Design/27_P10B3_LIVE_PRESENCE_BUBBLES_AMBIENCE_RING_LAYOUT_TREE.md)**; [Design 13 typed protocol](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design 09 gift fairness](../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design 21 female/male model anchors](../Design/21_P012D_CHARACTER_DIVERSITY_CONTRACT.md), [Design 22 gift FX](../Design/22_P013_GIFT_BLESSING_CHOREOGRAPHY_CONTRACT.md), [Design 26 REAL provider BLOCKED](../Design/26_P10B2_REAL_LIVE_STUDIO_AND_EVENT_GATEWAY.md).
3. [PR #15 SA technical/capture review #6022198865](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/15#pullrequestreview-6022198865); exact PR #15 \`apps/v2-viewer/src/{main,community-presentation,slice-overlay,slice-driver,seat-scene,gift-fx,gift-blessing,fx-profiles,ambient-fx}.ts\`; \`packages/v2-events/src/{protocol,registry,engine,focus,fixture}.ts\`; existing package.json/tests/evidence.
4. **Verified audit:** \`AvatarPresentation.displayName\` + \`avatarUrl?\` already exist; only displayName is currently rendered on real seats; chat \`DemoEvent\` carries **NO text**; GiftFxLifecycle + original blossom shader already exist; three authoritative hero seats + nine decorative anonymous bodies; \`source=live\` currently OFFLINE. Do not falsify these states or “solve” missing provider via synthetic replay.

## 4. P0 implementation phases

### Phase 1 — source-contract audit and deterministic typed chat cue

1. Verify pin, record 47 baseline tests (PR #15 Codex-submitted **8 Event +39 Viewer**) and two builds, source asset SHA pins and screenshot baseline.
2. Add an **additive documented optional chat text** to the *chat* event type; keep legacy events valid but no empty rendered bubble. Emit a **typed engine-owned ChatCue** (or equivalent) only after normalized accepted event with \`roomSessionId,eventId,atMs,actorId?,seatId?,displayName,sanitizedText\`. No direct raw transport→DOM path. If changing wire snapshot/effect type, explicitly version/review protocol version migration (0.1.0→0.2.0 or documented equivalent), update \`SceneObserver\` tests, reject stale version and keep old DEMO events valid. Do not modify gift session/FIFO scheduler beyond necessary type-compatible additions.
3. Sanitize text from \`unknown\`: bounded UTF-8/JS bytes, trim and normalize, strip control/bidi and markup, clamp **<=120 grapheme clusters**; bound rate per speaker/room, drop empty, dedup exact event ID per room/connection, coalesce spam. Name and profile/URL sanitization must remain as strict as \`registry.ts\`. **Do not auto-seat unseated chat senders** (\`spawnOnMember=false\`, spawn-on-chat as current config). If speaker lacks valid seat, only a small nonspatial generic overlay may appear; no roomCount/gift/focus change.
4. Standalone test input may contain originally written fictional chat strings, NOT borrowed chat/usernames from Owner screenshots. Mark all synthetic screenshot evidence as DEMO/tests, never \`REAL_LIVE_VERIFIED\`.

### Phase 2 — reusable photo/name/chat/gift UI (no generated artist graphics)

1. Existing accepted \`community-name\` currently text-only. Add an opt-in \`presence=on\` badge per **real actor seat only**, using \`NameplateAnchor\` (correct P05f/P07b1), sanitized text, optional source-authorized \`avatarUrl\`. Default use **original locally generated neutral circle/initials** if absent/malformed/not licensed/broken; avoid remote network in tests. A bare HTTPS address is NOT a license/SSRF clearance: use strict allowlisted origins and redirect/size/cross-origin policy; never allow user-provided URL to proxy arbitrary private IP or log a secret. No real person's portrait in committed evidence.
2. Add opt-in \`chatbubbles=on\`: display clean limited text close to true seat for a **clamped 1–2 s dwell** (e.g. \`1000+25*graphemeCount\` ms, max 2000), then shrink to one round translucent bubble drifting 30–90 CSS px up over approx 650–1100ms, fade to zero. Deterministic virtual time from accepted cue, no wall-clock randomness driving business state; bounded single DOM pool and timers, no raw HTML/innerHTML. Test 0/999/1000/2000/end boundaries. Speaker not seated → rate-limited nonspatial fallback, no fake avatar/seat. Hide/shorten chat during accepted gift focus, protect name/gift/palms/portrait safe zones (9:16, 8% outer safety margin).
3. Add opt-in \`gifticons=on\`: match **real typed engine giftId** to an original/approved allowlisted icon mapping; a missing/proprietary source uses a **neutral original gift token**; no third-party rose images scraped from reference. Strictly bind to existing **\`GiftFxLifecycle\` current confirmed room/request/actor/seat**. Observed/progress may show a subtle pending signal but **NO confirmed type icon or counted quantity until final**; duplicate final/reconnect/old room never spawns second ring. Show a bounded decorative count **max 3 ECO / 5 QUALITY at one time** independent of actual giftCount; bubble lifetime ~0.9–1.8s, orbit/rise near valid \`FXAnchor\`, not face/name, fade. Unseated Duyên remains **text-only**. Keep original confirmed gift + water/spark/before-after camera when new option OFF.
4. Clear nodes/pools on TTL, disconnect, room change, visibility/source change and WebGL context lost/reset. Properly cancel image fetch/load and free DOM. No crop overlap, narrator text or inaccessible contrast; long Vietnamese text and non-Latin emojis must render safely. Avoid race where seat-1 changes actor but stale bubble/avatar stays attached to old user.

### Phase 3 — tests, actual native 9:16 A/B evidence

1. Run existing **47** baseline tests and both package builds at new commit; add tests for protocol version compatibility and EventEngine disposition, input cap, grapheme/newline/bidi sanitization, invalid avatar URL and fallback, late/duplicate chat, time/float transitions, TTL/disconnect, A→B→C gift FIFO/confirmed-once, female/male correct anchor, missing seat D text fallback, no actor/profile gender inference and no DOM injection. Browser tests specifically assert **source=live remains OFFLINE** with no fake guest or fake gifts; no implicit event provider.
2. Genuine **720×1280 native WebGL** ECO + QUALITY screenshots at baseline feature OFF and ON, seed 9/71/1337. Focus on close person with name/avatar fallback, short/long valid chat after 0.2/1.0/1.5/2.1/2.8s, tiny floating bubble, female P05f close, male P07b1, roses in approved original token style, other gift types/fallback token, simultaneous name/gift priority, gift late/dupe, D fourth unseated, expiry, new room, cinematic. At least 6 representative original stills per profile plus actual timed frame sequence of each new animation. **No one-frame static screenshot falsely called a video**.
3. **OFF mode pixel-identical** to frozen PR #15 at same virtual clock/camera, deterministic seed; do not drift original ambient/lighting/poses or alter source scripts unless strictly behind flags. Profile CPU, DOM nodes, and render frames; compare scene cost with/without bubbles, same host and browser, record actual ANGLE renderer. Do not assert RTX/real LIVE Pass. WebGL context recovery and cleanup tests should distinguish inherited synthetic teardown warnings from normal render failures.
4. Pack a \`P10B3A.md\` Windows PowerShell runbook, exact feature flag names, actual implemented NPM scripts, sanitized JSON screenshot ledger + image SHA, source/new git commit, 0 VND/no new media/gateway. **No endpoint or screenshots of real TikTok data**.

### Phase 4 — small stacked PR and STOP

- Open new **\`feature/v2-p10b3a-presence-bubbles\`** branch from exact PR #15 HEAD \`f22033b5a6f9bc7e34208d0ddcdf40ce2c0c1282\`, new stacked PR base \`feature/v2-p10b2-real-live-pilot\` (PR #15). No V1, original binary, camera or environment changes.
- Final report **SA finding → precise actions → original native evidence → PASS/PARTIAL/BLOCKED**, source/new SHA, real UI feature results, dependency/permission uncertainty, test/build numbers, profile metrics and **STOP \`P10B3A_SA_REVIEW_REQUIRED\`**. No merge, no LIVE Studio automatic streaming, no launch CODEX15 before SA/Owner UI visual gate.

## 5. Owner Windows PowerShell baseline

Use an isolated worktree at the pinned PR #15 commit:

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
    npm.cmd run dev -- --port 5190 --strictPort

\`?presence=on&chatbubbles=on&gifticons=on\` **are proposed, NOT implemented on PR #15**, and only become runnable after Codex commits/tests them. For capture/Studio on production path do not change Vite browser security defaults. Updating insecure old Vite dependencies is a separate measured and tested dependency fix if necessary, **never expose dev server publicly**.

## 6. Acceptance/stop matrix

| Gate | Required PASS evidence |
|---|---|
| \`P10B3A_CHAT_PROTOCOL_PASS\` | message text is typed+validated in Engine; backward compatibility and clear version migration |
| \`P10B3A_PRESENCE_PASS\` | correct real name/seat + approved/fallback avatar, no anonymous identity, deletion on TTL |
| \`P10B3A_CHAT_BUBBLE_PASS\` | 1–2s dwell then distinct floating bubble + fade; overflow, long text, sanitization/security |
| \`P10B3A_GIFT_TYPE_BUBBLE_PASS\` | distinct approved/neutral type visual on confirmed original request, dedup, 3/5 cap, D no-seat |
| \`P10B3A_LEGACY_PASS\` | source/live OFFLINE unchanged, old true DEMO+gift+camera render parity, tests+native WebGL |
| \`P10B3A_SA_REVIEW_REQUIRED\` | formal SA PR review followed by separate Owner UI Visual GO; no external provider/hardware pass |
