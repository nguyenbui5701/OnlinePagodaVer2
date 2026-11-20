# 07 — Rules for SA, AI Visual, AI Code, PR review

## Responsibility & boundaries

**SA (this assistant):** analyze video/source, create and version `Design/**`, resolve tradeoffs and architecture; wait for owner to approve design; then write isolated `Task/*.md` with reading order, scope, acceptance, tests, and PR instructions. During design phase, do not mutate runtime source, package manifests, workflow config or `Task/**`.

**AI 3D (independent ChatGPT specialist):** read 01–04, 10–13; owns production 3D meshes, editable Blender source, low-poly variants/LODs, materials, UV, rig, animations, GLB exports, art provenance, asset_manifest and true multi-angle GLB renders. May use 3D generation service (including connected fal **when actual mesh capability is verified**) and Blender; must flag conceptual images as concept only and never claim a PNG is game-ready GLB. Focus on giant sakura, seated chibi, lotus pads/flowers and minimal lake terrain. Do not implement the app's renderer or LIVE business logic.

**AI Code (Codex):** code only. Read all `Design/**` and assigned future `Task/<assigned>.md`; own V2 Event Engine, event queue, client/server, shader water/fog/particles, renderer integration (load approved GLBs), animation player, camera, test harness. **Codex MUST NOT spend tokens generating images or 3D models, text-to-3D/image-to-3D calls, and must not manually compose production meshes from thousands of vertices.** Temporary debug primitives are allowed, clearly marked placeholders. PR requires engine tests and six actual 3D camera screenshots. No additional scope without SA/owner approval and no edits to V1 production repo.

## Primary priority / coordination

**Highest priority P0:** (1) V2 Event Engine, (2) real 3D Scene + camera. AI 3D and Codex can work concurrently **only after** SA locks asset manifest (11/13) and event-to-camera protocol (09/13). Test mocks decouple Event Engine development from asset delivery. Gift camera FIFO and no-gift cinematic are owner-confirmed hard requirements. Secondary polish, rituals, expanded dashboard, fortune, voice and unrelated V1 modules remain deferred (12).

**SA review gate for AI 3D:** asset files must genuinely open as GLB, meshes/animations/materials correct, manifest/LOD/provenance present and video reference shots match. If assets fail, AI 3D revises; don't ask Codex to disguise a broken model in code.

**SA review gate for Codex:** architecture boundary, deterministic engine tests, focus correct actor, queue fairness, 3D camera, measured ECO/QUALITY on owner GPUs; ask Codex to fix code defects, not to generate art.

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
