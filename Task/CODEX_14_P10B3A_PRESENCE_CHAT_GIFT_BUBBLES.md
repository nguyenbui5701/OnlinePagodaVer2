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


## 7. SA formal review PR #16 — 2026-11-23

**Formal technical review:** [PR #16 review #6023479077](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/16#pullrequestreview-6023479077) at immutable HEAD `bd10c6c05902ced6d3888ecc6554574672cdd22d`, correct stacked base [PR #15](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/15) `f22033b5a6f9bc7e34208d0ddcdf40ce2c0c1282`. 3 commits, 54 changed paths only in `apps/v2-viewer/**` and `packages/v2-events/**`. SA checked actual code, compare, provided test logs, native 720×1280 PNG screenshots, JSON ledger and context loss/restore evidence. **`P10B3A_SA_TECH_PASS_WITH_BOUNDED_MEDIA_LIMITATION`**, **`OWNER_P10B3A_UI_VISUAL_GO_PENDING`**, `MERGE_HOLD`. A COMMENT review (not approval to merge), because source media and final aesthetics require separate owner decision.

**What PASSED as DEMO code:** 0.2.0 versioned optional sanitized chat text/engine ChatCue with no new seat allocation from text; 1–2 s readable bubble + 0.9 s rising/fade bubble; first-initial local avatar badges linked to current true seat; 3 ECO / 5 QUALITY original confirmed gift-type tokens following original GiftFxLifecycle, A→B→C and unseated D text-only; 12 original visual slots / 3 real-capable seats; old DEMO and `source=live` OFFLINE intact. Codex log: 12/12 Event tests, 42/42 Viewer tests and two builds; 32 original WebGL PNGs labeled `SYNTHETIC_DEMO_NATIVE_WEBGL`, 12 OFF parity frames with SHA match, two safe artificial context restores, Edge ANGLE SwiftShader (not owner GPU). Evidence code revision `8ce98713259534b7af18ab26f987b9e00776bcd7` differs from PR final HEAD by evidence/docs-only commit, no runtime code change. No external GitHub CI returned and no independent local Node/Edge run was performed by SA.

**Nonblocking limitations / future gates:** Only **local initials**, not a real user profile photo; empty approved avatar origin allowlist means deliberate no external image fetch. Type-specific gift bubbles are **original neutral/rosette/lantern glyphs**, not official TikTok product pictures. These do not warrant a fake `REAL_PHOTO_PASS` or `REAL_TIKTOK_GIFT_ICON_PASS`; authentic media requires separately verified provider rights, allowlist, size/redirect/referrer policy and approved local icon manifest. Vite 7.2.2 dependency still requires patch/security audit before actual provider/public LIVE. Hardware `P10A_GPU_DEFERRED_NOT_PASS`; real TikTok `P10B2_PROVIDER_ACCESS_BLOCKED`.

**Required next Owner action:** view [PR #16 P10B3A.md](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/bd10c6c05902ced6d3888ecc6554574672cdd22d/apps/v2-viewer/P10B3A.md) ECO+QUALITY video-like local animated scene (not static PNG alone) and decide **`OWNER_P10B3A_UI_VISUAL_GO`** or bounded correction on bubble location/timing/shape, initials and gift ring visual fidelity. **DO NOT begin CODEX 15** until Owner gives UI GO. If GO, SA re-pins [CODEX 15](CODEX_15_P10B3B_AMBIENCE_CIRCULAR_SEATS_HERO_SHOTS.md) exact source HEAD `bd10c6c05902ced6d3888ecc6554574672cdd22d` (verify it remains unchanged first) for a new stacked PR. This task remains for dependent handoff/audit; no merge, code/asset modifications or public LIVE implied.


## 8. OWNER UI CORRECTION — mandatory revision on existing PR #16 (2026-11-23)

**NEW OWNER DIRECTION / P0 UI BLOCKER before visual signoff:** persistent name always above the head of each truly seated participant; stable head-relative placement during moving camera and floating chat; remove unseated-chat toast “Có lời nhắn mới”; keep initial-letter avatar when no real profile source but implement reliable stable-user-ID→avatar selection/authorization for the future. Owner additionally agrees current simple glyph gift tokens are not the eventual source-authorized gift images; maintain a safe resolver/fallback and do not scrape reference art.

**Why the previous SA TECH PASS does not close this:** [PR #16 formal SA review #6023479077](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/16#pullrequestreview-6023479077) only accepted code at exact HEAD **bd10c6c05902ced6d3888ecc6554574672cdd22d**. That source hides community-name for giftActorId and separately displays gift-name; community name is clamped in screen X to 26–74%, so it can drift from the projected head; presence-bubbles.ts emits a no-seat “Có lời nhắn mới”. The Owner did **not** grant **OWNER_P10B3A_UI_VISUAL_GO**. Mark **P10B3A_OWNER_UI_CHANGES_REQUIRED** now; no merge or CODEX15 until corrected and re-reviewed.

### A. Exact PR/branch and source ownership

- **Correct THIS SAME PR #16:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/16, branch **feature/v2-p10b3a-presence-bubbles**, original reviewed HEAD **bd10c6c05902ced6d3888ecc6554574672cdd22d**, parent PR #15 **feature/v2-p10b2-real-live-pilot** SHA **f22033b5a6f9bc7e34208d0ddcdf40ce2c0c1282**. Verify fresh PR16 HEAD before editing; if it has changed, inspect latest Codex changes first; never reset or force-push another person's work.
- **Updated authoritative reading:** [Design/07 Owner P10B3A-R1 amendment](../Design/07_WORK_RULES.md) and [Design/27 Section 9](../Design/27_P10B3_LIVE_PRESENCE_BUBBLES_AMBIENCE_RING_LAYOUT_TREE.md), original CODEX14 sections 1–7, latest review + Owner feedback.
- **Modify only** apps/v2-viewer/src/{community-presentation,slice-overlay,main,presence-bubbles,avatar-badge,style}.ts/css and dedicated new shared nameplate/avatar-resolver module if needed; tests/evidence/runbook under apps/v2-viewer/**. Event Engine currently has stable room-scoped userKey→actor, seat and optional avatarUrl, so no protocol version bump or domain rewrite is authorized without a proven gap and SA signoff. Do NOT modify original models, camera route, seats/layout, R16, other GLBs, V1, source=live status, real provider/gateway, or unrelated files.

### B. Persistent nameplate — P0

1. **Single authoritative label per visible authorized actor/seat**. Eliminate current competing presentation ownership: community-presentation.ts hides community-name when avatar.actorId === giftActorId; slice-overlay.ts creates another gift-name only while GIFT_FOCUS. Have one nameplate renderer, which can optionally style the same label in gift focus but never hides/reparents/jumps. Preserve correct displayName + initials. No duplicates or flicker in CINEMATIC / GIFT_TRANSITION / GIFT_FOCUS / CINE_RETURN, camera interpolation, user changes/seat TTL, simultaneous two or three occupied seats.
2. **Fixed in world-relative terms:** compute every frame from current seat.name/NameplateAnchor (or a single calibrated head anchor offset); project to camera with continuous transform. Remove independently clamped screen-X placement such as 26–74% and any bubble-dependent offset. It moves on screen naturally with its character when camera pans/zooms, yet maintains a stable relative gap to head. Avoid abrupt 0→1 opacity restart on each chat/gift/seat animation; a new actor may fade in once, existing actor should remain. Adjust sizing/depth/scale to stay readable at 720×1280 without ghost labels for out-of-frame actors.
3. **Never tie name visibility to gift overlay.** Draw gift quantity and gift type separately near FX anchor. Chat uses separate independent anchored bubble offset and its own float animation, never changes nameplate position, content, style or element. True actor removed/seat reused or room ended → clear stale name (do not show old username on new actor).

### C. Completely disable unseated CHAT notice — P0

- In presence-bubbles.ts when cue has no valid actorId and seatId, do **not** show generic “Có lời nhắn mới”, any other toast, or another actor's name. Return no visible chat bubble and no stage DOM. Keep accepted chat validation and speaker dedup internal, do not create a seat via message or reveal text. Distinguish from *unseated confirmed GIFT*: keep existing truthful text-only Duyên gift fallback at bottom; no spatial token or stolen focus.
- Remove fixture/test assumptions expecting generic toast; add explicit no-UI assertions and screenshots at a time when an unseated chat packet arrives. An empty chat bubble or animated '...' placeholder is also NOT acceptable for an unseated sender.

### D. Avatar identity resolver — P0 design seam, safe fallback now

- **Implement/test a small AvatarResolver/identity binding**, not computer vision. Use existing Event Engine stable userKey for source person in a room, then actorId+seatId and current AvatarPresentation.displayName/avatarUrl; tie all updates and invalidation to the Engine-owned room/actor/seat. Do not identify viewers by equal screen name, photo pixels, or inferred gender.
- Decision output: if a source-approved **HTTPS origin allowlist and rights/privacy policy** are explicitly configured and URL/size/referrer/redirect/decode pass, show an authorized photo; otherwise show original initial-letter badge. On image error or timeout, immediately fallback to initial. With current TikTok provider BLOCKED and **empty allowlist**, all real application DEMO examples continue showing **initials only**, no external network fetch or unauthorized image.
- Add isolated tests with **fictional two userKeys sharing exactly the same name**, same actor rebinding after name/avatar update, actor/seat reuse/TTL, disconnected/room epoch reset, stale event attempts and approved simulated/local image-source policy and load error. No actual third-party avatar URL or photo attached to PR. If a working image path cannot be enabled safely without an approved provider, implement policy/resolver and tests but **do not claim real-photo display PASS**; keep future provider media gate explicitly PENDING.

### E. Gift image mapping without proprietary asset copying — P1 follow-up within bounded revision

- Add or preserve strict **giftId→allowlisted source-approved icon mapping with original-token fallback**, with test cases for rosette/lantern/neutral unknown. Current text glyphs can remain as temporary, source-safe visuals; **do not** claim exact TikTok gift picture fidelity or invent a provider catalog. Any new actual media belongs to a separate rights-cleared asset handoff; no Codex generation of art/GLB, no license bypass. Existing FX lifecycle, confirmed-only, one-time dedup and 3 ECO/5 QUALITY token budgets remain unchanged.

### F. Mandatory new evidence and hard STOP

- Tests: rerun previous **54** Event+Viewer tests and both builds, add regression cases for static world-anchor offset across camera positions/zoom and chat float, 2–3 simultaneous names, gift focus scene transition/return, one-name-per-actor, stable avatar across identity/seat changes, no-seat chat fully silent but D confirmed gift text remains, 0 external image/network fetch with empty allowlist, photo policy rejected sources and fallback, source=live OFFLINE, exact three true seat capacity and FIFO A→B→C.
- Browser: fresh **native WebGL 720×1280 ECO and QUALITY** evidence per seed 9/71/1337 at no-gift seated wide/close, moving camera keyframes, chat at +0.2/+1.5/+2.1s, gift transition/focus/return and actor swap. Record per-frame actual **projected Head/NameplateAnchor (x,y) vs DOM name bounding rect center/offset** and assert stable displacement under chat+camera/gift. Show **zero generic unseated chat notifications**, while existing text-only unseated gift fallback still visible. OFF feature parity to PR #15 and source=live OFFLINE still mandatory. Include actual moving/timed frame sequence, not one fixed screenshot falsely called full animation.
- Deliver amended apps/v2-viewer/P10B3A.md and evidence/p10b3a/** with new SHA/renderer, truthful SwiftShader/RTX state, exact source/new HEAD, no previous accepted assets touched and 0 VND. If screenshots still show label floating far away from character, treat as fail; no hardcoded screen clamping to silence issue.
- **Push focused corrective commit to existing PR #16, then STOP at P10B3A_OWNER_UI_CORRECTION_SA_REVIEW_REQUIRED.** Do not merge, start CODEX15 or accept real LIVE provider/gift/RTX PASS. SA will review new HEAD and Owner decides explicit Visual GO (or another bounded feedback cycle).

**PR #16 formal Owner-correction review posted:** [SA review #6023756791](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/16#pullrequestreview-6023756791) on reviewed HEAD bd10c6c05902ced6d3888ecc6554574672cdd22d. GitHub prevents REQUEST_CHANGES by the current PR-author account (422), so COMMENT review carries an explicit OWNER_UI_CHANGES_REQUIRED/STOP, not approval. Codex must amend this same PR; Owner has not granted Visual GO.


## 9. SA R1 formal re-review PR #16 — head ee27355b (2026-11-23)

**Formal [SA review #6024504313](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/16#pullrequestreview-6024504313) posted** on immutable **PR #16 HEAD `ee27355b2b80f847602b0f6d2a3c259e4861fc54`**, base PR #15 `f22033b5a6f9bc7e34208d0ddcdf40ce2c0c1282`. Prior owner-correction baseline `bd10c6c...` is **2 commits behind**. **`P10B3A_R1_SA_TECH_PASS`** for the exact reviewed code and *Codex-submitted* ECO/QUALITY DEMO evidence. **`OWNER_P10B3A_UI_VISUAL_GO_PENDING`** remains the next gate. COMMENT SA technical PASS is not authorization to merge or launch a real LIVE.

**Corrections verified:** one single continuously projected head-relative `nameplates.ts` renderer per current authorized actor/seat; normal names no longer hidden on gift or duplicated by separate `#gift-name` when `presence=on`; no screen coordinate clamp dislocating name from the head; legitimate out-of-view/occlusion culling only; absent-seat chat now produces no `Có lời nhắn mới` notification or DOM bubble but original truthful unseated GIFT fallback remains. A verified room-scoped actor/seat avatar selector uses Engine's stable distinct userKey → actor, and an empty real-image allowlist keeps letter initials; synthetic approved URL tests cover security and stale/room/seat/TTL fallback. No facial recognition or real unauthorized avatar downloads. Original ✿/▣/◇ tokens remain safe placeholders pending a licensed provider gift-icon source.

**Evidence reviewed:** 164 native 720×1280 WebGL PNGs (not independent LIVE); 8 motion traces, 19,840 time samples and 13,238 visible nameplate checks, maximum measured DOM↔projected-anchor error 0.016 CSS px (constant 4 px gap), 12 exact pixel OFF regressions, context restore tests; logged **12/12 Event + 46/46 Viewer = 58 tests PASS**, 2 builds PASS. Edge/SwiftShader only; **no external GitHub CI run returned**. Runtime source was committed at `a8256768fc5524b9fe967e684b4c0f880e307694`, final HEAD added only evidence/runner/docs; evidence revision is labeled `-working-tree` because the handoff/runbook was edited while evidence was captured, not because runtime source changed. SA inspected GitHub code and actual PNGs, not a local ReviewPR/16 checkout or independent Owner hardware.

**Nonblocking documentation P1:** the existing PR #16 description links still point to older HEAD `bd10c6c...` and 54 tests; request a documentation-only description refresh to R1 HEAD, new [P10B3A.md](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/ee27355b2b80f847602b0f6d2a3c259e4861fc54/apps/v2-viewer/P10B3A.md) and 58 tests. Edge clipping when an actor is itself cropped can be visually discussed at Owner review; do not clamp name away from actual head. Real TikTok photo/gifts/provider still BLOCKED/PENDING; Vite security upgrade and Owner GPU remain future separate gates.

**STOP `OWNER_P10B3A_UI_VISUAL_GO_PENDING`**. Keep CODEX14 task document for ongoing Owner gate and dependency audit. Only after explicit Owner GO may SA re-pin the **actual immutable CODEX15 input SHA** (verify PR #16 still equals `ee27355b...`) and activate its separate stacked PR. Do not begin CODEX15 yet, edit runtime, merge PR16 or claim `PUBLIC_LIVE_READY`.


## 10. SA review of Owner-provided 18.52 s browser video (2026-11-23)

Formal [SA PR #16 VIDEO review #6024783556](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/16#pullrequestreview-6024783556) at immutable HEAD **`ee27355b2b80f847602b0f6d2a3c259e4861fc54`**. **`P10B3A_R1_SA_VIDEO_SCOPE_PASS`** for the Owner-provided 1920×1044 Cốc Cốc screen recording's visible 18.52s DEMO sequence. This is **supplemental visual review** on top of code/test [R1 Tech PASS #6024504313](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/16#pullrequestreview-6024504313), not confirmation that this desktop recording exposes the exact source revision, not Owner Visual GO and not real TikTok LIVE. Video/screenshots intentionally **not uploaded to public GitHub** because browser tabs/address bar and local information are visible.

**Visible factual observations:** ~0–6s close/wide anonymous seated chibis with no name (appropriate for DECORATIVE_ANONYMOUS before real actor binding); ~7–9s An name stable above person while a separate readable "Chúc an lành" chat becomes floating marker; ~10–15s wide Sakura and three real names An/Bình/Chi attached to their seats during continuous camera motion; ~16–18.5s An name survives gift focus, separate "2 hoa hồng" original glyph FX and truthful unseated "Duyên · 1 hoa hồng" acknowledgement. **No generic "Có lời nhắn mới" observed**; current tests/code establish unseated CHAT is silent. Character-relative nameplate is visually stable. Only local initials shown; no authentic external photo/icon source available.

**Remaining P1 visual and deployment observations:** opening composition ~0–6s has generous empty sky/water and isolated pads; wide ~12–15s names become small and approach frame edge. Treat as planned **CODEX15 shot/ring/ambient/readability** consideration, not regression in CodeX14's own scope; **do not screen-clamp names away from heads**. Desktop video captured Cốc Cốc UI and huge dark horizontal sidebars; not a clean portrait-only LIVE Studio source. Owner must crop/Window Capture only 9:16 stage, hide tabs/local URL and provide sanitized Studio preview at **P10B2** gate. The 18.52s clip ends during GIFT_FOCUS, cannot by itself prove 40s+ route return/TTL/dedup/long LIVE performance or GPU FPS. No LIVE provider, Avatar image permission or RTX PASS implied.

**Gate unchanged:** **`OWNER_P10B3A_UI_VISUAL_GO_PENDING`**. Once Owner explicitly says UI Visual GO, SA should verify live PR16 HEAD then re-pin CODEX15; until then CODEX15 is **NOT ACTIVE**, PR16 remains OPEN/unmerged and no public Go LIVE. No new CODEX14 P0 fixes required by the observed video.
