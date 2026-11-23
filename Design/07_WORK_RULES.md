# 07 — Rules for SA, AI Visual, AI Code, PR review

## Responsibility & boundaries

**SA (this assistant):** analyze video/source, create and version `Design/**`, resolve tradeoffs and architecture; wait for owner to approve design; then write isolated `Task/*.md` with reading order, scope, acceptance, tests, and PR instructions. During design phase, do not mutate runtime source, package manifests, workflow config or `Task/**`.

**AI 3D (independent ChatGPT specialist):** read 01–04, 10–13; owns production 3D meshes, editable Blender source, low-poly variants/LODs, materials, UV, rig, animations, GLB exports, art provenance, asset_manifest and true multi-angle GLB renders. May use 3D generation service (including connected fal **when actual mesh capability is verified**) and Blender; must flag conceptual images as concept only and never claim a PNG is game-ready GLB. Focus on giant sakura, seated chibi, lotus pads/flowers and minimal lake terrain. Do not implement the app's renderer or LIVE business logic.

**AI Code (Codex):** code only. Read all `Design/**` and assigned future `Task/<assigned>.md`; own V2 Event Engine, event queue, client/server, shader water/fog/particles, renderer integration (load approved GLBs), animation player, camera, test harness. **Codex MUST NOT spend tokens generating images or 3D models, text-to-3D/image-to-3D calls, and must not manually compose production meshes from thousands of vertices.** Temporary debug primitives are allowed, clearly marked placeholders. PR requires engine tests and six actual 3D camera screenshots. No additional scope without SA/owner approval and no edits to V1 production repo.

## Primary priority / coordination

**Highest priority P0:** (1) V2 Event Engine, (2) real 3D Scene + camera. AI 3D and Codex can work concurrently **only after** SA locks asset manifest (11/13) and event-to-camera protocol (09/13). Test mocks decouple Event Engine development from asset delivery. Gift camera FIFO and no-gift cinematic are owner-confirmed hard requirements. Secondary polish, rituals, expanded dashboard, fortune, voice and unrelated V1 modules remain deferred (12).

**SA review gate for AI 3D:** asset files must genuinely open as GLB, meshes/animations/materials correct, manifest/LOD/provenance present and video reference shots match. If assets fail, AI 3D revises; don't ask Codex to disguise a broken model in code.

**SA review gate for Codex:** architecture boundary, deterministic engine tests, focus correct actor, queue fairness, 3D camera, measured ECO/QUALITY on owner GPUs; ask Codex to fix code defects, not to generate art.

## SA prompt-writing rule — use the proven Sakura review/task format

**Required for future SA-to-AI Visual prompts** (and recommended for all substantial SA-to-Codex task prompts): write **an actionable, evidence-driven assignment like the Sakura R04–R16 tasks**, not a vague creative brief or a long chat recap. Use [Design/15 — Sakura example](15_AI_VISUAL_SAKURA_NEXT_PROMPT.md) as the style reference; preserve the exact current task context instead of copying obsolete Sakura R04 checksums or targets.

Every new iteration prompt must contain, **in this order**:
1. **Role, scope, objective and STOP/GATE:** name AI Visual versus Codex; focus on exactly one asset/workstream; explicitly state what is out of scope and when work must stop for SA/owner review.
2. **Repo + correct PR/branch + exact reviewed HEAD:** supply verifiable GitHub URL and immutable commit/SHA; keep baseline revision intact and create a separately versioned output (e.g. `p0.1` → `p0.2`); never pretend a changed HEAD has been reviewed.
3. **Required reading order:** specific `Design/**`, `Task/**`, latest SA review permalink, original video/reference frames and current source/manifest. If a source is unavailable, explicitly mark it unavailable instead of inventing content.
4. **SA's grounded assessment:** report `PASS/PARTIAL/BLOCKED/PENDING` per actual technical/artifact gate; identify **P0/P1 priorities**, concrete shot-specific defects and constraints to preserve; never turn aesthetic preferences into unverified technical failures.
5. **Phased execution:** `Phase 1` inspect existing PR and answer SA findings, `Phase 2` build a focused A/B revision, `Phase 3` validate real 3D files and image evidence, `Phase 4` push small files and hand off large binaries. Do not order a rerun of a test already proven PASS unless the asset under test changed.
6. **Deliverables and evidence:** actual GLB/Blender sources/animations/anchors, manifest and license, exact **SHA-256/byte size/triangles/materials**, matched camera/light/exposure multi-angle **Blender Cycles** comparison and Windows PowerShell validation when needed. Rendered concept PNGs must never be represented as GLB or native-runtime tests.
7. **GitHub/binary handoff:** target versioned paths, branch/PR policy, small source/docs to push, big binary `pending_owner_upload` until byte-verified, exact checksums and truthful logging/limitations. Do not force-push, silently overwrite or merge without owner/SA authorization.
8. **Response format:** brief **SA finding → action → evidence**, tools used and zero-cost confirmation, precise new HEAD/PR and file paths, owner tasks, blockers and **explicit acceptance decision requested**.

**Current P0 hold overrides generic parallelism:** until the owner explicitly approves lotus pad + chibi **visuals**, SA prompts must ask AI Visual to iterate **only PR #2** and must say **Codex PR #3/#4, integration, GPU/LIVE Studio and all merges remain paused**. An engineering PASS is **not** owner visual acceptance.

A usable SA prompt must be **copy-pastable as a standalone task** with links, versioned inputs and objective pass/fail gates. Avoid superficial advice such as “make it prettier,” unspecified variants, or unsupported claims of completed uploads/tests. Keep a compact chat handoff if helpful, but the authoritative detailed requirements belong in the assigned versioned `Task/*.md`.

## Merge / review procedure

1. After design sign-off, SA creates `Task/<task-id>.md`, commits it.
2. AI 3D produces approved asset deliverables in a separate asset branch or versioned handoff; Codex executes an assigned code task in a separate V2 branch with unit/E2E/visual evidence and PR. Do not let both modify the same files simultaneously.
3. SA checks out PR in `ReviewPR/<PR-number>/` or separate git worktree (never switches AI Code's own branch/worktree); diff against expected base SHA.
4. SA posts inline PR comments where possible; if blocker, request changes, **keep** review checkout and amend assigned task with blockers; owner/AI Code fixes and updates PR.
5. If no blocker (or only optional nonblocking comments), SA posts summary review; **delete** local review worktree and assigned `Task/<task-id>.md` only after verifying no dependent ongoing work, and commit cleanup. Never delete shared branches or user's working files blindly.

**Important:** web/API GitHub reading is not a local checkout. If runtime cannot clone a PR, do review via GitHub patches/files and explicitly say there is no physical `ReviewPR/` checkout, rather than claim one.

## Code rules

- Small modules for world, avatar model, seat registry, visual router, camera director, renderer boot.
- Typed event protocol; user/key normalization consistent; parse unknown payloads with schemas; no direct DOM insertion of raw comment text.
- Deterministic DEMO with timestamps, seeds, fake names. Avoid production LIVE for development.
- No scene draw call in server I/O path. GPU assets dispose on scene switch. Event burst bounded, LOD/instancing under crowd.
- Adjustable values in config, no magic camera hardcoded values in business logic.
- Prefer testing high-risk components before expanding assets; screenshots/reference compare mandatory.
- Commit every small completed design change and include source SHA/changed file path.

## Owner-runnable checks

When task ready, provide user exact Windows PowerShell commands e.g. `npm.cmd ci`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`, `npm.cmd run test:e2e:live` ONLY when scripts verified in V2's own package.json. V1 script names are reference, not guarantee V2 scripts. Ask user to upload screenshot/log rather than claim testing done.

## Zero-cost asset workflow and PR binaries

[Design/14](14_ZERO_COST_AND_ASSET_PR_POLICY.md) is mandatory. AI 3D uses Blender, free commercial-compatible assets and/or local procedural mesh creation; no paid generations or 3D subscription without user authorization. AI 3D proactively pushes small textual files (review README, manifest, source script, technical/visual notes, pending media list) into their asset PR branch via GitHub connector or local Git. Owner may push large GLB/BLEND/media later to the same branch, then SA verifies exact SHA-256 before final signoff. Missing binaries must be marked pending; text-only PR cannot be accepted as production runtime assets. Codex does not do asset generation.

## Git policy

Commit docs after meaningful design revisions. Do not force push or overwrite other branch heads. User's target repo `nguyenbui5701/OnlinePagodaVer2`. Never upload private TikTok data, raw user avatars from video, production tokens or cookies.


## P1.0-B3 — Owner-approved SA scope rules: viewer presence, chat/gift bubbles, richer ambience, circular lotus pads and lush blessing-tree hero views (2026-11-23)

**Owner direction:** Six supplied 9:16 livestream screenshots #1–#6 and the explicit request to create the complete SA design/task package establish these **new design requirements**, without changing older accepted V2 runtime automatically. Source references are Owner-provided *visual/behavior inspiration only*; do not redistribute their third-party usernames, real avatar photographs, TikTok branded gift icons/UI, copyrighted screenshot pixels or messages as production media. [Design 27](27_P10B3_LIVE_PRESENCE_BUBBLES_AMBIENCE_RING_LAYOUT_TREE.md) is the detailed source of truth.

### 1. Preserve truthful identity and 3-seat authority
- Existing typed `AvatarPresentation.displayName` and optional `avatarUrl` support data for a real seated actor. The V2 Viewer currently displays a **sanitized name**, **not yet a verified real profile photo**; implementing the approved/missing image display is a separate Codex UI gate.
- Names, avatar images, chat bubbles and gift visuals must bind to **Engine-authorized `roomSessionId,actorId,seatId`** and current slot world anchors only; they must never create an actor, invent an online viewer, assign gender from names/photos, increase gift count, or turn a decorative silhouette into a real participant.
- Keep **12 visual positions / only 3 real seat-capable actors** until a separate explicit Event Engine capacity change is reviewed and approved; decorative figures and empty lotus pads must not be counted as joined real users. If Owner later wants more than 3 actual seated guests, SA must create a new capacity/queue/LOD design and owner GPU gate, not silently set `maxAvatars` to 12.

### 2. Comment protocol and chat bubble choreography
- **Current event protocol 0.1.0 lacks chat text.** Codex must implement an explicit versioned, strictly validated chat-content amendment and sanitized engine-owned chat cue; do NOT display raw unverified provider messages or claim LIVE chat is working while `P10B2_PROVIDER_ACCESS_BLOCKED` remains.
- For an authorized seated sender: a readable chat bubble appears by that real seat for **1–2 seconds scaled by displayed grapheme count**, then **shrinks to a small floating bubble rising and fading for ~0.65–1.1s**. Cap length and visible bubbles, protect avatar face, gift, nameplates, 9:16 safe area. Non-seated chat may use a small rate-limited **nonspatial** overlay only; never place it above someone else's pad.
- Keep UTF-8/Unicode/HTML/control+bidi sanitization, fixed size/rate limits, no DOM `innerHTML` from provider data, deterministic traceability, TTL/room/reconnect cleanup. Chat does not override gift FIFO/camera.

### 3. Gift-icon bubble visuals and source-media permission
- Use the **existing confirmed gift FX lifecycle and authoritative room/request/actor/seat keys**, not another gift scheduler or duplicated counters. Only confirmed final gifts create type-specific rise/orbit bubbles; observed/progress is provisional and cannot be counted as final. Duplicate/reconnect/old-room messages cannot replay icon bubbles. No-seat gift remains truthful text-only fallback.
- Map **approved original/licensed local icons** by normalized giftId; unknown or unlicensed gift type receives an original neutral fallback symbol. Never scrape/reuse TikTok rose-in-ring badges/screenshots or generate proprietary replacements by guess. Limit active decorative bubbles per ECO/QUALITY, independent of gift count.
- Remote viewer photo and icon URLs are sensitive: HTTPS and name sanitization alone do NOT grant permission or security; enforce licensed allowlist, referrer protections, decode/size/redirect limits and safe fallback. Do not commit private photos/IDs/tokens.

### 4. Ambience, rings and tree/camera
- Extend original deterministic pool of fireflies/glow motes, falling petals/leaves with **profile-capped emitters around actual visual seat clusters**; add localized subtle trunk mist. Keep ECO/QUALITY draw/overdraw budgets and chat/gift readability priority; never call software SwiftShader FPS an RTX pass.
- Introduce **opt-in** concentric/circular layout of original P02 lotus pads, with three real seat IDs preserved and remaining nine empty/decorative. Prove tree-root/trunk, pad/pad, pad/flower clearance and seated chibi contact. No scene layout teleport during an active LIVE room. Source Viewer default layout remains frozen without Owner visual GO.
- Add **actual animated** HERO_TOP_RING and HERO_WIDE_TREE_REFLECTION camera shots showing concentric pads, lush tree and reflective pond. QA screenshots alone do **not** count as delivered camera routes. Gift focus A→B→C and camera return keep authority and safety; previously accepted camera behavior is unchanged when new options are OFF.
- If Sakura R16 lacks the fuller, more luminous canopy silhouette Owner wants, AI Visual/AI 3D (not Codex) prepares **new R17 original ECO/QUALITY GLBs + editable Blender + manifest + SHA256/bytes + true multi-angle Cycles**, in separate artist branch/gate. **Do not replace/overwrite R16 or generate intricate production mesh through Codex.** Existing R16 accepted art remains immutable until separate SA+Owner R17 Art GO.

### 5. Scoped sequence, hard STOP, old LIVE/hardware gates
- **First active:** [CODEX 14 Track A — Presence/Chat/Gift Bubbles](../Task/CODEX_14_P10B3A_PRESENCE_CHAT_GIFT_BUBBLES.md), new stacked PR from **PR #15 exact HEAD `f22033b5a6f9bc7e34208d0ddcdf40ce2c0c1282`** targeting `feature/v2-p10b2-real-live-pilot`; require same-viewport OFF/ON native WebGL, old Event+Viewer tests, explicit typed protocol version and sanitization. **STOP `P10B3A_SA_REVIEW_REQUIRED`** → SA → Owner UI Visual GO.
- **Prepared but NOT ACTIVE:** [CODEX 15 Track B — Ambience/Rings/Hero Camera](../Task/CODEX_15_P10B3B_AMBIENCE_CIRCULAR_SEATS_HERO_SHOTS.md). SA pins its **future actual input SHA only after CODEX14 SA+Owner GO**; no invented future HEAD, no Codex overlapping modifications. STOP `P10B3B_SA_REVIEW_REQUIRED`.
- **Conditional art:** [AI Visual 16 — R17 Lush Blessing Tree](../Task/AI_VISUAL_16_P10B3C_R17_LUSH_BLESSING_TREE.md) is **PREPARED / OWNER R17 ART-SCOPE GO PENDING**, not authorization to modify art now. Separate asset PR and Cycles proof when commissioned.
- **Independently BLOCKED:** [PR #15](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/15) real TikTok event source is still `P10B2_PROVIDER_ACCESS_BLOCKED`; `source=live` is OFFLINE and cannot be silently populated with demo viewers, comments or gifts. P1.0-A physical RTX benchmark remains `OWNER_DEFERRED_NOT_PASS`. Do not auto Go LIVE, buy API services, handle account credentials, merge upstream PRs, claim current new visuals completed or claim a public LIVE readiness certificate.
- SA updates and commits **Design 27 + these Rules + Task 14/15/AI Visual 16 + coordination ledger**; Codex does not edit Rules/Design and starts **only** the explicitly active isolated Task 14. Technical PASS and Owner Visual GO are separate gates for every phase.


## P1.0-B3A-R1 — Owner UI correction to PR #16 (2026-11-23)

**Superseding Owner direction after PR #16 SA Technical PASS:** The name of every real seated, visible participant must be **persistently visible above that character's head**, not appear only for chat/gifts and not disappear during gift focus. The label must not jump when the camera moves, when chat floats up, or when gift focus/return occurs. **Remove the generic no-seat chat notice “Có lời nhắn mới.”** While no authorized real avatar images exist, keep initial-letter badges, but support a safe viewer-identity-to-avatar resolver for future authorized LIVE data (not face recognition). Approved gift-specific pictures may replace original generic tokens only when usage rights and secure sources are verified.

### Persistent, stable nameplate
- **"Fixed" means fixed relative to the head in 3D/world-anchor space**, not permanently frozen at one pixel coordinate on screen. Project the same calibrated NameplateAnchor above the correct chibi head each frame; when camera pans/zooms, name follows character naturally with stable visual gap/scale. Never use screen-X clamping that detaches the name from its owner. If genuinely outside frame/occluded/unloaded or seat authorization expires, hide the label rather than create a disconnected ghost overlay.
- **Exactly one nameplate visual owner per authorized actor and seat.** Current community-name and gift-name double presentation must be unified or coordinated without duplicates. Gift focus, gift overlay, camera transition, normal cinematic shots, chat bubbles and actor animation must never hide, move or replace the same nameplate. Chat bubble has a separate anchor and motion. Show names for all visible actual seated actors, not only the focused one.
- Default feature-OFF legacy must retain its accepted behavior until explicitly reviewed; opt-in presence ON adopts the Owner's new invariant. Verify all 720×1280 ECO/QUALITY shots, source-mode camera transitions, gift A→B→C handoffs and seat identity reuse.

### No-seat chat must be silent
- A valid ChatCue from a sender with **no authorized actorId+seatId** must not render any visible generic toast, including “Có lời nhắn mới”, nor another person's name or chat. Internal validated cue/rate limiting is allowed. Do not auto-seat no-seat chatters.
- This does **not** remove the existing truthful unseated GIFT acknowledgment (e.g. Duyên · 1 hoa hồng), which remains text-only and cannot cause spatial icon/focus allocation.

### Avatar identity binding and image safety
- Current typed protocol v0.2.0 already carries provider-scoped **viewer.userKey, viewer.name, optional viewer.avatarUrl**; the Engine owns mapping **roomSessionId + userKey → actorId → seatId → displayName/avatar candidate**. Match viewer by stable ID in the same room, never by shared nickname or photographic appearance. No facial recognition, face matching or biometric inference.
- Avatar resolver prefers a licensed, source-authorized, explicitly allowlisted profile photo only if a safe HTTPS/decode/size/redirect/referrer policy passes. Otherwise render the grapheme-based initial fallback. The current real-provider source and photo allowlist are **unavailable/empty**, so initial-letter fallback is the correct visual. Never fetch an arbitrary user-supplied URL or commit third-party avatar portraits.
- Tests must cover two distinct userKeys with the same display name, name/avatar URL updates, out-of-order room events, TTL/seat reuse, disconnect/reconnect, image load failure and fallback; no identity or image leaks to the wrong seat.

### Gift image type and media licensing
- Preserve confirmed GiftFxLifecycle and existing FIFO. Map **giftId → approved local/icon source asset** when rights, stable mapping and sanitization exist; otherwise use original rosette/lantern/neutral fallbacks. Do not reuse TikTok rose-image pixels, reverse engineer account image sources, or infer a real provider's exact icon/catalog from screenshots.

### Review/gates
- Owner's comment is a **required UI correction**, not OWNER_P10B3A_UI_VISUAL_GO. Mark **P10B3A_OWNER_UI_CHANGES_REQUIRED**. Amend active CODEX 14 task and let Codex correct **the existing PR #16 branch**, with a new exact HEAD and formal SA re-review. Keep PR #16 open/unmerged, and retain corrected task/evidence; do not start CODEX 15 until SA re-review + explicit Owner UI Visual GO. The previous technical PASS is specific to the earlier reviewed HEAD, not the new correction.
- Evidence: native ECO/QUALITY name persistence across no-gift cinematic, gift transition, focus and return, real multiple seated actors, pan/zoom and chat float, 12 visual/3 real seat truth, silent no-seat chat and still-visible unseated GIFT fallback, authorized-avatar simulation/local fallback without remote fetch, 54 prior tests plus new regression cases and OFF parity. No LIVE-source/GPU/30fps PASS claim; P10B2 still blocked and P10A still Owner-deferred.


## P1.0-B3A Owner Visual GO → P1.0-B3B activation (2026-11-23)

Following the exact [PR #16 SA R1 Tech PASS #6024504313](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/16#pullrequestreview-6024504313) plus independent [Owner-supplied video SA scope PASS #6024783556](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/16#pullrequestreview-6024783556), Owner instructed **“tiếp tục”**. **Record `OWNER_P10B3A_UI_VISUAL_GO`** at frozen PR #16 HEAD **`ee27355b2b80f847602b0f6d2a3c259e4861fc54`** for currently reviewed 9:16 V2 DEMO UI (names fixed relative to heads, chat float and confirmed gift tokens, initials-only avatar fallback). Former `OWNER_P10B3A_UI_VISUAL_GO_PENDING` and `CODEX15 NOT ACTIVE` wording is retained as historical and superseded **for scheduling only** by this latest Owner approval. Do not infer Owner approval for third-party profile photo/icon rights or live-provider service.

**ACTIVE NEXT TASK:** [CODEX15 — P1.0-B3B](../Task/CODEX_15_P10B3B_AMBIENCE_CIRCULAR_SEATS_HERO_SHOTS.md). Start one clean new worktree/branch `feature/v2-p10b3b-ambient-rings-hero` from exact PR #16 HEAD `ee27355b2b80f847602b0f6d2a3c259e4861fc54`, new stacked PR targeting `feature/v2-p10b3a-presence-bubbles` (PR #16). Verify pinned parent HEAD is still unchanged before branching. **No edits to old PRs, V1, Event Engine, R16/P02/P05f/P07b1/botanical asset bytes, existing actor/gift logic or approved real-user nameplates.** CODEX15 scope is opt-in richer deterministic ECO/QUALITY particles, seat-local emissions, localized low-occlusion trunk mist, 12 concentric P02 pad visuals **3 authoritative Engine seats + 9 empty/decorative**, and TWO in-motion HERO_TOP_RING/HERO_WIDE_TREE_REFLECTION camera routes, with native 9:16 A/B, stability, gift interruption/return, collision and measured performance evidence. Do not replace R16 or create R17 tree binaries; AI Visual16 art is a separate conditional approval.

**STOP `P10B3B_SA_REVIEW_REQUIRED`** upon a new stacked code PR, then Owner World/Camera Visual GO separately. `P10B2_PROVIDER_ACCESS_BLOCKED` (real TikTok events), `P10A_GPU_OWNER_DEFERRED_NOT_PASS` (physical GPUs), TikTok LIVE Studio manual preview, actual gift media rights and public LIVE/merges all remain unresolved. No demo data counted as real, no auto-merge, paid services, account access or go-live.
