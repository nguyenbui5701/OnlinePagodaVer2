# 12 — Priority, AI ownership, integration and delivery

**Owner confirmed 2026-11-20:** two AI specialists overseen by SA; greatest priority on **V2 Event Engine** and **3D Scene + Camera**. Codex writes code only. AI 3D creates/reviews production assets, not app code.

## P0 — Two core workstreams, parallel but contract-driven

### P0-A: V2 Event Engine (Codex) — NO GRAPHICS GENERATION

Build typed, deterministic, isolated scene/event domain:
1. `LiveAdapter`: selectively reuse V1 TikTok worker/transport/provider/mapper; no changes to V1 repo.
2. `EventRouter`: validation, room/session scope, timestamps, idempotency, bounded queues, backpressure; joins/chats/gifts/likes; mock fixture source.
3. `AvatarRegistry`: one identity per session, allocation and lifecycle, scene presentation (seat, name, avatar URI) decoupled from GPU meshes. Gift sender can be created/focused even when normal spawn rule doesn't trigger.
4. `GiftFocusScheduler`: FIFO across **people**; coalesce same giver/combo, dedup confirmed gifts, cap queue/hold/TTL, camera target references, fair focus during bursts. Normative behavior Design/09.
5. `EventStateSync`: Socket.IO snapshot/delta revision and resync or equivalent typed protocol, deterministic testable state.
6. `GiftFXIntent`: logical effects with giver ID and position anchor key; renderer later maps to particles and nameplate.
7. Tests: A/B/C gift ordering; A repeated; progress->final; 100 simultaneous viewers; reconnect; stale room; queue overflow; no photo/name fallback.

**P0 acceptance:** engine simulations pass without renderer/GPU/real TikTok LIVE. Event test reproducible from fixed fake clock and seed. Live subscriber never waits for camera transitions. Confirmed gift total is correct; no camera focus assigned to wrong person.

### P0-B: 3D Scene + Cinematic/Gift Camera (AI 3D + Codex IN SEPARATE PARTS)

**AI 3D specialist**:
- deliver original 3D objects `sakura_hero`, `meditator_base`, `lotus_pad`, `lotus_flower`, `island_rock` and distant mountains.
- Blender source, runtime GLB, texture/animation, asset_manifest, six same-scene preview views.
- Ensure close-up chibi and aerial huge cherry tree both faithfully reproduce video; texture/poly/LOD budgets for 4GB and 8GB.

**Codex**:
- integrate renderer (Three.js preferred until spike), GLB loading, object pooling, instanceable many lotus pads, avatar LOD and animated poses.
- program pond water shader, atmospheric fog, particle sakura, lighting and runtime effects.
- choreograph continuous CINEMATIC modes: CLOSE -> COMMUNITY -> AERIAL -> UNDER_TREE -> repeat.
- move to GIFT_FOCUS correct giver with avatar, nameplate, FX; serve A/B/C FIFO from Event Engine; return to cinematic on empty queue with seamless 3D interpolation.
- render in vertical capture, test ECO 3050 Ti 4GB and QUALITY 3060 8GB.

**P0 acceptance:** real 3D parallax and rendering across 6 video-golden frames with consistent assets; >45s gift-free cinematic never stalls; gifts A/B/C camera sequencing correct, latency bounded; profiling run on both owner GPUs with LIVE Studio.

## Integration contracts / handoff gates

1. SA signs off `asset_manifest.json` schema **before** the first asset is produced and renderer code is linked. See 11 and 13.
2. Codex uses stub/demo GLB asset IDs until SA approves final assets; avoids blocking engine development on slow art iterations. **Procedural primitive placeholders are acceptable ONLY as integration/test placeholders**, not final art.
3. Event Engine publishes `AvatarPresentation` and `FocusIntent` semantics; renderer only consumes state/intent and never deduces giver ID from camera coordinates.
4. AI 3D submits **geometry and assets**, not 3D engine code or program architecture; Codex handles all code including scripted water and camera paths, and may provide clear integration bug descriptions for SA.
5. SA reviews both independent deliverables, approves manifest checksum/version and Event Engine contract, then runs integration review with demo.
6. During production, separate branches / handoff channels: `assets/...` for AI 3D artifacts, `feature/...` for Codex code, with SA deciding order and PR feedback. No concurrent edits of one file.

## Priority backlog (deferred)

| Level | Feature | Rule |
|---|---|---|
| **P0** | Event Engine, identity, gift queue, 3D world/assets, cinematic/gift camera, validation | Main implementation |
| **P1** | Nameplates/filtered comment bubble polish, quality autoscaling, richer gift effects, operator diagnostics | After core vertical slice |
| **P2** | Fortune cards, traditional temple rituals, incense, lantern, leaderboard, voice extras, elaborate control panels | Defer until P0 fidelity and reliability approved |
| **Not needed** | Rebuild V1 complete scene or mimic TikTok mobile interface | Explicitly out-of-scope |

TikTok LIVE connectivity is a necessary P0 **adapter**, but V1 connector is reused selectively rather than expanded. Fancy administrative dashboard and less relevant V1 rituals should not delay the two main tracks.

## Suggested stages after owner approves design

- **Stage A — Contracts first (SA):** approve scene coordinate system/asset interface and event types; lock P0 acceptance.
- **Stage B — In parallel (2 AIs):** AI 3D produces initial real assets; Codex creates Event Engine and stub camera/renderer test harness.
- **Stage C — Vertical slice:** one actor on a leaf + large tree + cinematic movement + one simulated gift focus, all real 3D.
- **Stage D — Scale:** many seats/avatars, 6 video shots, A/B/C queued focus, FX, nameplates, reproducible video comparison.
- **Stage E — Profile & live bridge:** ECO vs QUALITY on owner hardware, TikTok LIVE Studio capture, regression to V1 connector semantics, no production impact to V1.

**No `Task/` files until owner signs off Design**, per original SA instructions. This document defines priorities, not executable Codex task tickets.

## Responsibilities matrix

| Artifact or decision | AI 3D | Codex | SA | Owner |
|---|---|---|---|---|
| Original mesh, material, rig, GLB | Produces | Consumes | Reviews | Visual approval |
| Asset manifest/provenance | Produces | Validates | Approves contract | Optional |
| Event identity/gift queue/logic | None | Produces | Reviews algorithms/tests | Approves behavior |
| Camera spline/priority/3D integration | Inputs visual framing | Produces | Reviews video fidelity | Visual approval |
| GPU/VRAM benchmark | LOD revision | Instruments and fixes runtime | Evaluates | Executes local checks |
| PR comments, contract changes | Addresses asset review | Addresses code review | Owns review | Final merge decision |

## Owner-approved P10B4 audio insertion (2026-11-24)

Owner explicitly approved V1 voice reuse, separate V2 AudioManager and Gift Camera synchronization with existing DEMO (2026-11-24). **`OWNER_P10B4_AUDIO_DESIGN_GO / P10B4_AUDIO_IMPLEMENTATION_ACTIVE / MERGE_HOLD`.** [Design28](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/5d97310406fafc734085078074d2df2fdbdd2052/Design/28_P10B4_AUDIO_VOICE_GIFT_SYNC.md) normative; [CODEX19](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/6925fb46bc48f3515ecb9e70b51725d6dfee60ab/Task/CODEX_19_P10B4_AUDIO_VOICE_GIFT_SYNC.md) from immutable PR20 HEAD `fd5dc6655ad6b600c1fe9a3220a1bca193f1d4de`, new stacked branch `feature/v2-p10b4-audio-voice`. Scoped P0 Vietnamese thanks/confirmed gift SFX, camera sync/mixer, P1 ambience/operator controls; prior generic voice deferral superseded only for this phase. Preserve Engine/protocol0.2.0, all camera/scene/asset pins, security boundary; no art or V1 writes. V1 gTTS/FFmpeg reference pin `9ffa2718723b11284dccdf35595c759576672f93`; validate voice rights and external data, offline fallback, optional authorized synthetic DEMO-only TTS, no real names sent, no paid service. Audio OFF default, explicit gesture and single output, matching actor/seat focus, no blocking camera, no progress thanks or replay. Real-time audible evidence required, not fake fixture success. STOP `P10B4_SA_AUDIO_REVIEW_REQUIRED` then Owner listening GO. CODEX18 provider read-only assessment may continue, actual gateway implementation HOLD until audio accepted and Studio/provider gates verified; SA repins baseline at that point. Studio final preview includes video AND audio, GPU deferred not PASS, no public LIVE or merge.
