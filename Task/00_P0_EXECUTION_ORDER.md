# P0 execution order — OnlinePagodaVer2

> **LATEST OWNER ART PRIORITY — 2026-11-21:** P0.3 lotus+chibi overall is an accepted working direction, **female apparel/hair not final approved**. Active work moves to [AI_VISUAL_03 P0.4 FEMALE](AI_VISUAL_03_FEMALE_AO_BA_BA_LONG_HAIR.md): Vietnamese áo bà ba in reusable color variants and loose hair to waist, Cycles A/B, SA review and **owner approval**. Only after explicit `OK female` is a separate male task allowed. All Codex and integration paths below remain paused. No male modeling in P0.4.

> **OWNER PRIORITY OVERRIDE — 2026-11-21:** Owner requests **visual-only AI Visual focus on lotus pad + chibi until owner explicitly says OK**. Previous parallel starts are now PAUSED. **Do not start/continue Codex renderer, Event Engine or vertical-slice integration**, do not merge PR #3/#4, and do not require Sakura R16 binary upload for this art review. Active work: [AI_VISUAL_02](AI_VISUAL_02_ART_REFINEMENT_AND_OWNER_GATE.md), on PR #2. Resume implementation only after owner aesthetic approval, then SA reopens Codex tasks. Existing PR code and tests are preserved; not rejected.


**Status:** ASSIGNED AFTER OWNER P0 DESIGN SIGN-OFF (2026-11-21). **Baseline:** [Design/16](../Design/16_P0_APPROVAL_AND_HANDOFF.md). Deliver on V2 repository only. **Do not alter OnlinePagoda V1.**

## Objective

Build the first working, **true-3D** lotus meditation vertical slice from owner-approved Sakura R16, an original seated chibi and a lotus pad, with continuous cinematic and DEMO gift focusing the correct avatar. Target capture 720×1280, first without real TikTok and without claiming measured GPU performance.

## Execution graph

1. **Owner/SA binary handshake:** Before Codex can claim a real R16 renderer PASS, owner uploads exact `sakura_hero.glb` and `sakura_hero_eco.glb` on existing PR #1 branch at paths in Design/16. Verify `Get-FileHash` and GitHub remote SHA; **QUALITY** `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c`, **ECO** `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`. Sakura art frozen; record remaining known secondary-contact risks. No merge now.
2. **Parallel starts:** AI Visual reads [AI_VISUAL_01](AI_VISUAL_01_LOTUS_PAD_CHIBI.md); Codex can start [CODEX_02](CODEX_02_DEMO_EVENT_ENGINE.md) against mock asset IDs immediately. Codex starts [CODEX_01](CODEX_01_RENDERER_CAMERA_SPIKE.md) scaffold/camera with explicitly marked placeholders until the real Sakura GLB is available, then must validate actual GLB before PBR PASS. AI Visual/Codex use distinct feature branches and PRs.
3. **SA interface checkpoint:** Both specialists adhere to Design/13 baseline v0.1.0 `seatId,actorId` and measured asset anchors; SA validates pad/chibi GLB import and event/camera API before connecting.
4. **[INTEGRATION_01](INTEGRATION_01_VERTICAL_SLICE.md):** real R16 Sakura + one real chibi on one real pad + water/lighting, continuously moving cinematic ≥45 s; fake gift A focuses A then returns; A/B/C FIFO, progress-confirm dedup, correct name, no teleport.
5. **Scale and profile separately** after vertical slice: 10/30/100 actors, 6 real golden shots from `chuav2.mp4`, 3050 Ti ECO and 3060 QUALITY concurrently with LIVE Studio. Owner performs local benchmark; no unmeasured FPS claims.

## Ownership / rule of engagement

| Role | Owns | Does not own |
|---|---|---|
| AI Visual | Original mesh, rig, animations, pad/chibi source Blender/GLB, measured anchors, previews, provenance | Runtime, shaders, Event Engine, camera software |
| Codex | TypeScript/Node application renderer, shaders, camera director, typed Event Engine and tests | Production character/leaf/tree modeling, rewriting Sakura geometry |
| SA | Design baseline, checksum/gate review, PR feedback, integration contract, blocker decisions | Silent production merge, unverified claims |
| Owner | Art approval, binary push when required, Windows/GPU/LIVE Studio tests, final release/merge | Dependency on paid tools unless explicitly authorized |

## Independent PR rule

- AI Visual: new `assets/lotus-pad-chibi-p0` or similar branch and PR. Sakura PR #1 remains separate and Draft.
- Codex: separate `feature/v2-renderer-camera-p0` and `feature/v2-demo-events-p0` branches/PRs. **Path ownership until integration:** renderer owns `apps/v2-viewer/**`; Event Engine owns `packages/v2-events/**`. Each may keep a local scoped `package.json` under its own directory, but **neither edits/creates root `package.json`, workspace config or shared `packages/**` outside its assigned prefix** without SA's explicit coordination. SA integrates root workspace/scripts later in a dedicated PR. No shared file edits in parallel.
- Every PR includes exact changed paths, baseline SHA, runnable commands **derived from actual package/scripts**, test outputs, actual screenshots and unresolved issues. If runtime skeleton doesn't exist, Codex must create an isolated V2 scaffold and document setup; never invent an npm script as if already present.
- All 3D-generation/tooling stays **zero-cost** under Design/14. No secret tokens, private viewer data or production TikTok session content.
- Keep `Task/` docs as living acceptance contracts while active; SA closes/removes only after integration is reviewed and no one depends on them.

## First check-in definition

The first independently reviewable handoffs are **AI Visual's real `lotus_pad_01.glb` + `meditator_base.glb`** and **Codex's passing DEMO Event Engine tests / GLTFLoader proof for Sakura**. A still mockup or 2D bitmap is not a substitute.
