# Integration P0-01 — Real Sakura + one pad + one chibi + mock gift focus

**Owner:** SA coordination; AI Visual supplies real GLBs/anchors; Codex integrates runtime. **Status:** GATED / START AFTER INITIAL ART + CODE INTERFACE REVIEWS. This is a review milestone, not permission to merge Sakura PR #1 or publish LIVE.

## Prerequisites

1. Design/16 baseline v0.1.0 acknowledged by both specialists.
2. Exact original R16 GLB QUALITY SHA `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c` verified at canonical runtime import or documented approved copy. ECO available with SHA from Design/16. R16 tree remains art-frozen.
3. `lotus_pad_01` and `meditator_base` real GLB approved by SA with correct seat, head, nameplate and FX anchors; animation `sit_idle` or explicitly documented accepted prototype fallback.
4. Renderer can load GLB in real 3D with true parallax; DEMO Event Engine tests for fake gift progress/final and A/B/C passed.

## First working scenario

- One Sakura R16, one floating pad, one seated chibi, dark pink-violet pond plane with simple reflective/ripple shader, basic dusk lighting/fog. Draw using actual GLBs **not AI-generated screenshots**. 9:16 clean-capture, minimum target 720×1280.
- Cinematic camera continuously moves for **≥45 seconds** without gifts across CLOSE → COMMUNITY → AERIAL → UNDER_TREE and back, no teleports or stalled orbit. At under-tree the dark bark remains visible and not blacked out/overblown.
- DEMO gift A event: if A not spawned, actor A appears on an available pad; transition to correct A actor and anchored readable nameplate/gift FX, hold bounded, return smoothly to cinematic. If A seat fails, honest fallback without wrong identity.
- Then fixtures A/B/C with B and C arriving during A focus: focus **A→B→C** and return; no duplicate streak count, no freezing on progress. For A/B/C multiple seats may be instantiated from the same approved pad/chibi GLB, **not newly modeled unique assets**.

## Verification evidence

| Test | Minimum evidence |
|---|---|
| Native 3D | Deterministic camera walkthrough video or frame sequence showing actual GLB and parallax |
| Visual 9:16 | Clean-capture screenshot with full Sakura, a pad/chibi and correct color/depth; compare owner video reference ~3s/~15s/~33s as initial qualitative checkpoint |
| No gift | Timed ≥45s log/video showing nonstatic camera and all four modes |
| A gift | Trace actorId↔seatId↔focus target, nameplate/FX screenshots, one smooth return |
| A/B/C | Fixed trace of queue order, hold/transition and dedup event counts |
| Performance baseline | Actual renderer FPS/frame-time logs, test hardware/resolution stated; **not a substitute for final 4GB/8GB LIVE Studio test** |
| Integrity | Asset SHA, versioned event schema, renderer commit SHA and separate art PR refs |
| Safety | V1 unaffected, no real TikTok credentials or private user data in fixtures |

## Go / no-go

**GO to scene scale-up** only when the vertical slice passes all mock visual/functional basics and SA signs off review. Otherwise block this milestone with specific visual/code PR comments. **NO production deployment** until six golden-shot comparisons, 10/30/100 actors, target GPU+LIVE Studio profiling, room reconnect tests and a separately approved LIVE adapter.
