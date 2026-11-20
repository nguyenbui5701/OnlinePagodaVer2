# 07 — Rules for SA, AI Visual, AI Code, PR review

## Responsibility & boundaries

**SA (this assistant):** analyze video/source, create and version `Design/**`, resolve tradeoffs and architecture; wait for owner to approve design; then write isolated `Task/*.md` with reading order, scope, acceptance, tests, and PR instructions. During design phase, do not mutate runtime source, package manifests, workflow config or `Task/**`.

**AI Visual:** read 01–04 & 02 acceptance. Provide world screenshot/board, GLB/mesh specs and model list with license/provenance. Maintain same 3D geography and proportions across shots; no platform UI baked in, no direct copy of branded avatars. Need explicitly flag image-only outputs as concepts not actual 3D scene meshes.

**AI Code:** read all `Design/**`, only `Task/<assigned>.md`, source files named there, and tests. Commit on isolated branch; PR includes screenshot of 6 camera shots, log and commands run by owner. No additional feature scope without SA/owner approval. No developer edits to V1 production repo.

## Merge / review procedure

1. After design sign-off, SA creates `Task/<task-id>.md`, commits it.
2. AI Code executes a single defined task in V2 branch, with unit/E2E/visual evidence and PR.
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

## Git policy

Commit docs after meaningful design revisions. Do not force push or overwrite other branch heads. User's target repo `nguyenbui5701/OnlinePagodaVer2`. Never upload private TikTok data, raw user avatars from video, production tokens or cookies.
