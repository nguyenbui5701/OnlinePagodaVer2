# CODEX 17 — P1.0-B2 Pre-LIVE security prerequisite (ACTIVE)

## 1. Role, scope and STOP
AI Code (Codex) only. Owner has approved PR19 visual/runtime baseline and requested continuation under Rules. Implement the existing CODEX13 §10 item 4 mandatory security/dependency follow-up, now isolated on the current Viewer. This is NOT a provider integration, GPU acceptance, Studio operation or public LIVE task. Preserve all accepted scene behavior, R17B opt-in and verified same-profile R16 default/fallback. No Engine, V1, assets, geometry, materials, camera, FX, layout, capacity or paid-service edits. Only `apps/v2-viewer/**` scoped dependency/lock/config/security tests/runbook/evidence changes. STOP `P10B2_SECURITY_SA_REVIEW_REQUIRED`.

## 2. Repository and immutable pins
- Repo https://github.com/nguyenbui5701/OnlinePagodaVer2; [PR #19](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/19) exact accepted HEAD `2f08d17d58f6bcd6093ca30ba3bad8f103219335`, branch `feature/v2-p10b3d-r17b-integration`, base PR17 `1201369e019f6ba04f7437c7dac347e56894ba2a`. [SA review](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/19#pullrequestreview-6033755211). Owner runtime visual GO recorded on main in Design26 §5 and Design27 §13.
- Create fresh isolated worktree, branch `feature/v2-p10b2-prelive-security` from exact PR19 pin; new stacked PR targeting PR19 branch. Verify target HEAD and STOP on drift, do not alter previous PRs or merge.
- R17B art source PR18 `07f57cb35ba3ec68184abbd2c173e29a3fcc4788`, QUALITY SHA256 `1ed05dd2c0451364122e20999955dedb3be213305a59a45c61853013495f0267`, ECO `3b7e87f61ed120a2c938e572e0d0fe2c858c6fbc8027657efe16c232906de770`. R16 QUALITY `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c`, ECO `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`. Keep manifests/staging unchanged; stage assets before Viewer tests.
- Read main Design07, 10, 13, 14, 16, 24 §6, 26 §5, 27 §12–13, CODEX13 §10 and completed CODEX16. Read exact PR19 package.json, package-lock.json, vite.config.ts, P10B2.md, P10B3D.md, src/main.ts, src/asset.ts, src/verified-glb.ts and evidence runner. Use existing native screenshots as accepted visual baseline, no new owner video requirement.

## 3. Grounded assessment
- Current Viewer pins Vite 7.2.2 in both manifest and lock. [GHSA-p9ff-h696-f583 / CVE-2026-39363](https://github.com/advisories/GHSA-p9ff-h696-f583) checked 2026-11-24: 7.0.0–7.3.1 affected, 7.3.2 patches this particular dev-server WebSocket file-read issue. Existing build preview on 127.0.0.1 and CORS disabled are mitigations, not evidence of compromise or a complete security review.
- PR19 SA technical PASS + Owner runtime GO, 54 Viewer/12 Engine tests and both builds submitted, R17B asset/camera/ring/fallback verified. No additional art/visual work. Current Vite version is the pre-LIVE dependency risk; provider and hardware statuses remain separate.
- P0: patched reproducible dependency and local-only server boundary. P1: targeted regression and operational runbook. No blanket audit-force, version-major upgrade or broad dependency refresh without separately approved scope. No secret acquisition or external network exposure.

## 4. Implementation
### Phase A — audit and select minimal patch
- Record Node/npm/platform, exact baseline package-lock, advisory and current `npm audit --json` (including dev) and production-only report. Audit may require registry access; if blocked, label unknown and do not claim audit PASS. Review direct/transitive findings and applicable paths. Select exact compatible patched 7.x release >=7.3.2, verify official registry/release/advisories at execution time; 7.3.2 is minimum for named advisory, not guaranteed secure today. If no suitable compatible 7.x, STOP for SA decision. Prefer smallest safe tested change, pin exact version. Regenerate lock via normal npm tooling; no `npm audit fix --force`, unpinned upgrades, arbitrary external registries, or unrelated dependency changes. Compare lock diff, report required transitives and justify each. No new provider package.
- Verify `npm ci` reproducibility in isolated clean directory. Confirm resolved Vite version and integrity; run after audit. Report residual findings, applicability and mitigation; do not hide unresolved high/critical issues or call all security PASS when a finding is unassessed.
### Phase B — local boundary and negative tests
- Retain 127.0.0.1 as default bind, explicit port/strictPort for operator preview, CORS disabled; ensure dev server and preview configuration fail closed for normal project commands, no accidental wildcard/LAN/public host or permissive allowedHosts/CORS. Avoid relying solely on CORS to authorize local access. Validate trusted local Host/Origin and Vite supported fs allow/deny / WebSocket policy as applicable, use patched documented config only. Do not introduce a custom authentication gateway for this task. Document that localhost is not a credential vault; production gateway needs separate auth. No cookies, real file secrets or tokens in test or evidence. Use isolated temporary fixture directories and harmless canary contents to prove out-of-root file access denied and unauthorized origins/hosts rejected/no permissive CORS; include applicable WebSocket negative coverage on local disposable fixture only, no exploit tooling against real systems. Dev-only test vs built preview checks clearly separated. Test normal same-origin GLB fetch and clean 9:16 capture; verify listener actual address. If an unsupported boundary cannot be tested, report exactly what is not verified. Keep development ergonomics where safe; no public server.
### Phase C — targeted regression
- Stage existing exact GLBs using existing scripts; both package tests/builds, baseline 54 Viewer +12 Engine, add focused security tests. Verify source GLBs, Event Engine, all existing scene modules, art manifests and prior evidence unchanged. Do not repeat Blender or 218 historical screenshots. Use matched native 720x1280 screenshots from exact PR19 built baseline and candidate, both ECO/QUALITY, R16 default and R17B opt-in at representative identical wide/top/under-tree/actor/gift-return checkpoints (at least six actual camera shots overall, include both profiles); report actual pixel equality or explain any difference. Confirm R17B same-profile fallback (missing or hash mismatch), abort, R16 unchanged behavior, 3 authorized +9 decorative, gift FIFO/return and name/chat, `source=live` OFFLINE zero real actors/gifts, no external requests. Use existing inspect seams and tests, no artificial performance claims. If rendering dependency update changes visual behavior materially, STOP and report, no unrelated fixes.
- Document capture command using built preview, not dev server for Studio; current script `capture:p10b2` uses port 5189. Keep R17B explicitly selected, all existing flags opt-in. No automatic Studio login/start/Go LIVE. Hardware and provider remain unverified.
### Phase D — deliverables
- New `apps/v2-viewer/P10B2_SECURITY.md`, targeted security test(s) and sanitized evidence under `evidence/p10b2-security/` (actual versions, advisory IDs, audit before/after, lock diff summary, bind/Host/Origin/fs tests with synthetic data, test/build output, native matched frames and exact source/hash ledger). Log actual commands, exact source and capture SHA, date, costs 0 VND, remaining limitations. Never commit private paths, credentials, account identifiers, cookies or raw live events. No unverified vulnerability claims. 
- Windows PowerShell baseline (existing scripts verified):
```powershell
Set-Location packages/v2-events
npm.cmd ci
npm.cmd test
npm.cmd run build
Set-Location ../../apps/v2-viewer
npm.cmd ci
npm.cmd run assets:p08
npm.cmd run assets:p012b
npm.cmd run assets:p012d
npm.cmd run assets:r17b
npm.cmd test
npm.cmd run build
npm.cmd run capture:p10b2
```
Use `http://127.0.0.1:5189/?demo=community&profile=eco&seed=9&look=twilight&clean=1&botanicals=on&diversity=on&blessing=on&presence=on&chatbubbles=on&gifticons=on&ambience=rich&seats=rings&shots=hero&tree=r17b` for DEMO only. For offline check change demo to source=live, expected OFFLINE; no real provider. Record actual new scripts, no invented commands. Provide separate runbook for Owner manual Studio preview when ready, not a completed Studio test.

## 5. PR handoff and acceptance
Create new stacked PR title `[P1.0-B2][SA REVIEW] Pre-LIVE dependency security and local capture boundary`, exact base pin, only allowed scope. Report finding→action→evidence, exact HEAD, installed versions, advisory closure/residual findings, test/build and native regression results, local-boundary proof and remaining blockers. If registry/build/browser unavailable, report partial and stop, don't invent results. No merge.
**STOP `P10B2_SECURITY_SA_REVIEW_REQUIRED`.** Security preflight acceptance is not provider or public LIVE approval. CODEX11 GPU remains deferred until separate explicit Owner resume; CODEX13 real event access remains blocked until approved/reachable source and Owner Studio evidence. No real event worker, offline replay project, production broadcast, default asset switch or additional art iteration.
