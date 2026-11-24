# P1.0-B2 — Pre-LIVE dependency security and local capture

`P10B2_SECURITY_SA_REVIEW_REQUIRED`

- Frozen base `2f08d17d58f6bcd6093ca30ba3bad8f103219335`, PR #19. [SA review](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/19#pullrequestreview-6033755211)
- Capture build `ad91d0b12d0e11e78e9ecbac0717b68ac55c15b8`. The follow-up adds the QA runner, receipts and runbook. The Viewer source, Event Engine, asset manifests and staging scripts, and prior evidence are identical to the baseline.
- Scope and stop point. [CODEX 17](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/3e59142c16bcae3249e60a38f3abd0ee5f9cdee9/Task/CODEX_17_P10B2_PRELIVE_SECURITY_HARDENING.md)

## Dependency selection

Vite `7.2.2` was an affected dev dependency. `7.3.2` fixes the named WebSocket file-read advisory, and `7.3.8` is the first 7.x fix for the later critical advisory. The Viewer pins `7.3.8` exactly. The lock changes Vite, the required esbuild `0.25.12 → 0.28.2`, and its 26 matching platform packages. npm selected esbuild within Vite's new `^0.27.0 || ^0.28.0` requirement. The Three.js, Rollup and other lock entries retain their original versions. [Named advisory](https://github.com/vitejs/vite/security/advisories/GHSA-p9ff-h696-f583) · [Later critical advisory](https://github.com/vitejs/vite/security/advisories/GHSA-p4f5-76q4-ffq7) · [Vite release](https://github.com/vitejs/vite/releases/tag/v7.3.8)

On 2026-11-24, Windows 10 build 19045 x64, Node 24.16.0 and npm 11.13.0, the public npm registry grouped 10 reported advisory entries under a single High-severity Vite dependency in the baseline full audit. The baseline production-only audit had zero findings. The candidate full and production-only audits both returned exit 0 and zero findings after `npm ci` in the new worktree. The later critical advisory was checked against Vite's own published range independently of the npm audit feed. These results describe the checked dependency graph and advisory sources at execution time. [Exact lock hashes, changed entries and registry integrity](evidence/p10b2-security/dependencies.json) · [Before, full](evidence/p10b2-security/audit-before-all.json) · [Before, production](evidence/p10b2-security/audit-before-prod.json) · [After, full](evidence/p10b2-security/audit-after-all.json) · [After, production](evidence/p10b2-security/audit-after-prod.json)

## Local boundary

Both servers listen on HTTP IPv4 loopback `127.0.0.1` with CORS disabled and a strict port. A request's Host must be `127.0.0.1:<actual-port>` or `localhost:<actual-port>`. If present, Origin must match that exact authority and scheme. When Fetch Metadata is present, the server accepts same-origin requests and direct navigation. A foreign Host, Origin or Fetch Metadata context receives HTTP 403 before static files or transforms. Raw local clients may omit browser headers. This boundary allows local capture, and other local processes can still reach the listener. Keep provider credentials outside the dev/public/dist trees. A future provider gateway requires its own authentication and explicit approval.

Dev keeps Vite's strict filesystem policy with Viewer and Event Engine source roots and the built-in deny rules. Dev WebSocket and HMR are disabled, so refresh the page manually after edits. Capture uses static preview on port 5189. Fixtures validated allowlisted files, denied synthetic files, refused development and preview WebSocket handshakes, and checked that preview fails on an occupied port. Actual app checks recorded both loopback listeners and 200 responses with all four exact tree hashes from preview. [Viewer checks](evidence/p10b2-security/viewer-checks.txt) · [Engine checks](evidence/p10b2-security/engine-checks.txt) · [Listener proof](evidence/p10b2-security/listeners.json) · [HTTP and GLB proof](evidence/p10b2-security/http.json) · [Staging receipts](evidence/p10b2-security/staged-assets.jsonl)

## Run on Windows PowerShell

Use Node 24 and Git. Run from the candidate worktree root.

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

Leave the preview running. Open the [local 720 × 1280 DEMO](http://127.0.0.1:5189/?demo=community&profile=eco&seed=9&look=twilight&clean=1&botanicals=on&diversity=on&blessing=on&presence=on&chatbubbles=on&gifticons=on&ambience=rich&seats=rings&shots=hero&tree=r17b). Change `profile=eco` to `profile=quality` to select the other R17B GLB. Omitting `tree` selects R16. Replacing `demo=community` with `source=live` shows the offline state. When port 5189 is occupied, identify the owner with `Get-NetTCPConnection -State Listen -LocalPort 5189` and close the older preview you started before running capture again.

For audit reproduction, run `npm.cmd audit --json` and `npm.cmd audit --json --omit=dev` in the respective Viewer directories. For native A/B, use another PowerShell terminal from the candidate worktree root and build the exact baseline on port 5194.

```powershell
git worktree add --detach ../p10b2-security-baseline 2f08d17d58f6bcd6093ca30ba3bad8f103219335
Set-Location ../p10b2-security-baseline/apps/v2-viewer
npm.cmd ci
npm.cmd run assets:p08
npm.cmd run assets:p012b
npm.cmd run assets:p012d
npm.cmd run assets:r17b
npm.cmd run build
npm.cmd exec --offline -- vite preview --host 127.0.0.1 --port 5194 --strictPort
```

With both previews running, run from the candidate worktree root. Use the exact commit reported by your candidate build, such as the recorded capture commit above. The runner verifies both build revisions before comparing any PNGs.

```powershell
$env:V2_CAPTURE_REVISION = (git rev-parse HEAD)
$env:V2_BASELINE_ORIGIN = 'http://127.0.0.1:5194'
$env:V2_CANDIDATE_ORIGIN = 'http://127.0.0.1:5189'
$env:V2_BROWSER = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
Set-Location apps/v2-viewer
node scripts/evidence-p10b2-security.mjs
```

## Owner-operated Studio preview

1. Start the built capture preview using the PowerShell procedure and open the local DEMO in a dedicated browser window.
2. When authorized to validate Studio, open it manually on the eligible Owner account. Use **Window Capture** for that browser window, set the portrait scene to 720 × 1280 and fit the 9:16 Viewer stage. Confirm the opening shot and a gift DEMO handoff in preview.
3. Keep the preview local. For SA, capture a sanitized preview image containing the scene and viewport with account UI and private data cropped out. Studio preview and the real event provider are separate acceptance steps.

## Results for SA

- **70 tests passed** (58 Viewer, including four new boundary tests, and 12 untouched Event Engine tests). Both builds passed. The Viewer build still reports the existing bundle-size warning.
- **28 exact pixel matches** between built PR #19 and the candidate at 720 × 1280 in Edge 158.0.4370.33 with SwiftShader. The matrix covers ECO/QUALITY, default R16/explicit R17B and seven matched checkpoints per combination. The 58 native PNGs include both sides of each pair and two fallback frames. Camera pose, time, loaded SHA-256, build SHA and PNG SHA-256 are recorded. [Native ledger and gift trace](evidence/p10b2-security/browser.json)
- Gift focus exercised A → B → C and cinematic return with three Engine-authorized seats and nine decorative slots when full. The chat rise and nameplate stayed paired with the expected seat. A missing R17B fell back once to verified R16 in the same profile, and matched its pixels. An aborted load made no R16 request. Both offline checks returned zero real actors and zero gifts. The tested pages attempted no external requests.
- Verification used the official npm registry API over HTTPS, disposable synthetic fixtures and built loopback previews. Cost **0 VND**. Owner Studio evidence, real provider access and hardware acceptance remain pending under `P10B2_STUDIO_CAPTURE_OWNER_EVIDENCE_REQUIRED`, `P10B2_PROVIDER_ACCESS_BLOCKED` and `P10A_GPU_OWNER_DEFERRED_NOT_PASS`.

| Pair | Frozen PR #19 | Candidate |
| --- | --- | --- |
| ECO R16 wide | [PNG](evidence/p10b2-security/eco-r16-wide-baseline.png) | [PNG](evidence/p10b2-security/eco-r16-wide-candidate.png) |
| ECO R17B top | [PNG](evidence/p10b2-security/eco-r17b-top-baseline.png) | [PNG](evidence/p10b2-security/eco-r17b-top-candidate.png) |
| QUALITY R17B under-tree | [PNG](evidence/p10b2-security/quality-r17b-under-baseline.png) | [PNG](evidence/p10b2-security/quality-r17b-under-candidate.png) |
| QUALITY R16 gift return | [PNG](evidence/p10b2-security/quality-r16-return-baseline.png) | [PNG](evidence/p10b2-security/quality-r16-return-candidate.png) |
