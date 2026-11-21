# Codex P0-02 — Typed DEMO Event Engine, seat registry and gift FIFO

**Assignee:** Codex / event-domain software. **Status:** ASSIGNED, may run in parallel with AI Visual and renderer spike. **Suggested branch:** `feature/v2-demo-events-p0`, separate PR/worktree and non-overlapping files. **DEMO only; no real TikTok credentials, no V1 writes.**

## Normative references

`Design/16_P0_APPROVAL_AND_HANDOFF.md`, `Design/05_LIVE_INTERACTION.md`, `Design/07_WORK_RULES.md`, **`Design/09_GIFT_CAMERA_DIRECTOR.md`**, `Design/12_CORE_PRIORITIES_AND_AI_ROLES.md`, **`Design/13_3D_EVENT_INTEGRATION_CONTRACT.md`**. Inspect V1 connector contracts only as **read-only reference**, do not import the V1 SceneEngine or mutate V1 deployment.

## Implementation

1. Implement as a self-contained **`packages/v2-events/**`** domain package with its own local `package.json`/tests if required. **Do not create or edit root `package.json`, repo workspace config or renderer-owned `apps/v2-viewer/**`** in this parallel PR. SA resolves root workspace and import wiring at integration. Build **deterministic simulated event source** with fixed fake time and seed; typed normalized chat/member/gift/like/room/session events, scoped actor IDs, validate/sanitize display names & avatar URLs, normalize Unicode, bounded queues and dedup IDs.
2. Build pure-domain `AvatarRegistry` and `SeatRegistry`: exactly one actor per room+user, deterministic unique seats, capacity/TTL/rejoin/reconnect semantics; a valid gift creates or ensures the giver's actor/seat even without chat spawn, or a **truthful name/FX fallback** if no seat possible. Never focus a random other actor.
3. `GiftFocusScheduler`: bounded FIFO **between distinct gifters**, coalesce same sender progress/combos, exactly-once confirmed gift count, fair focus hold, logical events `focusStarted`, `focusEnded`, `focusSkipped(reason)`; successively A→B→C and smooth return intent when empty. Scheduler emits actor/focus **intent**, not camera coordinates.
4. Public state: versioned `AvatarPresentation`, `FocusIntent`, `CameraPresentation` from Design/13 v0.1.0; deterministic snapshot/delta with revision/resync (or clearly documented typed equivalent). No raw TikTok user ID in public-facing debug logs; renderer finds `actorId -> seatId -> transform + anchor`.
5. Expose a **DEMO driver and automated tests** independent of GPU and actual TikTok. Configurable P0 demo defaults for spawnOnChat ON, spawnOnMember OFF, spawnOnGift ON, bounded max avatars/TTL, focus timing; do not claim production defaults owner-approved. Need no external network access.

## Required scenarios and assertions

| Scenario | Expected |
|---|---|
| 45+ seconds without gifts | Empty focus queue; `CINEMATIC` intent persists; renderer may continuously move on its own |
| Gift A from unseen viewer | A actor/seat allocated OR truthful fallback; focus target is A, never B |
| B,C arrive during A focus | Camera intents maintain A→B→C distinct giver FIFO; return after queue drains |
| A 5 progress packets then final | No five repeated focus entries; confirmed count exactly once |
| Repeated/duplicate event | Same actor, same room-scoped dedup; no extra seat or gift |
| Burst >100 sessions / 500 likes | Bounded queue and FX intent; no fictitious actor from likes/viewer totals |
| Room switch/reconnect | Old-room focus ignored; revision/snapshot resync valid; stale event not replayed |
| Seat exhausted / missing avatar | Honest fallback or `focusSkipped` reason, never focus wrong user |
| Vietnamese name & malicious text | Grapheme-safe display; no raw HTML/script execution; no private IDs in logs |

## Outputs / definition of done

- Versioned TypeScript source modules, typed tests and fixtures, comprehensive assertion outputs, reproducible commands **verified against actual package.json**; if scaffold isn't present, isolate packages to minimize merge conflicts.
- A machine-readable event trace with timestamps, focus order, actor/seat bindings and confirmed gift counts to be consumed by integration Task.
- A small API/example for the renderer client; no renderer UI or 3D asset code in this PR.
- SA can rerun all tests without TikTok or GPU and can validate A/B/C, dedup and identity rules. PR stays open until review.

**Out of scope:** live TikTok transport/authentication, payments, actual message fetching, 3D modeling, camera interpolation/lighting, arbitrary production avatar cap. Code only.
