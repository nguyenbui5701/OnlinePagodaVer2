# CODEX 19 / SA R1 evidence

`P10B4_SA_AUDIO_REVIEW_REQUIRED`

- Reviewed HEAD `0f158bf9e5b79c56c3a5cc8c18dadf97a99eea03`. [SA R1](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/21#pullrequestreview-6034571648)
- Corrected runtime `f3b719323324a9a85b48ce7c1f75a86e89f974b0`. The evidence commit adds this report, the test runner and results.
- Previously reviewed 64.20-second recording, pictures and original camera timeline remain in the parent evidence directory, captured at `c7b79c89e0f4904bdae5b3589885f92147fa0d99`. [Original runbook](../../../P10B4.md) · [Original WAV](../demo-capacity-mix.wav) · [Original ledger](../browser.json)

## P1-01 — Session effective output

The operator's existing gesture and mute choice control whether audio is armed. Output also requires a connected room, visible document and running audio context. A session boundary clears pending work, cuts voice and chimes, stops the ambience bed and disables the test chime while disconnected. Reconnect can restore the bed when the operator is still armed. The boundary frame is the resume watermark, so even a disconnect and reconnect processed in one frame cannot play earlier cues from that batch. The consumed-request ledger persists within a room and resets on a room change.

The built community DEMO was observed in real time at the existing 12.5–12.8 s disconnect. An analyser attached to the native post-mix node also checked sustained output while a synthetic fixture held the disconnected Engine snapshot with a gift still in focus. The same fixture tested an epoch change spanning both session events in one Viewer update, a mute made during disconnection and a room reset. It uses the existing SliceDriver and AudioManager from the loopback dev server with a disposable HTML response and two local DEMO gift records. [Browser observations](browser.json)

## P1-02 — Voice readiness

The panel distinguishes voice loading, partial availability and zero playable voice files. The unlocked mixer still exposes available chimes and ambience separately. A mixer preloads each fixed voice file at most once, including when the operator mutes and re-enables it. The all-failed browser case used three 404 responses and one same-length payload with a corrupt hash. Chimes stayed usable, and the built community DEMO reached three accepted gifts and `GIFT_FOCUS` on seat-1 with zero voice starts. A partial failure retained the generic offline fallback. [Browser observations](browser.json)

## Reproduce

From the prepared corrected Viewer directory, run `npm.cmd test` and `npm.cmd run build`, then serve `npm.cmd run capture:p10b2` on port 5189. Serve the same directory for the disposable fixture using `npm.cmd run dev -- --port 5201`. In a separate worktree at the reviewed HEAD, stage the four pinned asset sets as in the runbook and build the Viewer. Serve that baseline with `npm.cmd exec --offline -- vite preview --host 127.0.0.1 --port 5198 --strictPort`.

```powershell
$env:V2_CAPTURE_REVISION = (git rev-parse HEAD)
node scripts/evidence-p10b4-r1.mjs
```

Uses native Edge and SwiftShader at 720 × 1280. The analyser reports normalized post-mix PCM peaks from 256-sample windows. This is browser output evidence. [Viewer tests/build](viewer-checks.txt) · [Event Engine tests/build](engine-checks.txt)

## Results

- Real-time built community DEMO recorded 20 analyser windows reported as disconnected. Nineteen windows were exactly zero after the initial edge, and the audible ambience returned after reconnection. The focused sustained fixture remained disconnected for 775 ms of wall time with all five sampled peaks at exactly zero. It cut the active voice, cleared the queue and suppressed the test chime. Explicit mute survived reconnect. The same-frame fixture cut the old voice and suppressed the boundary-batch final before the resume watermark.
- The all-failed fixture settled at zero ready and zero loading voice files, issued exactly four requests across mute/re-enable and recorded zero voice starts. The partial fixture played the verified generic fallback. [Measured results](browser.json)
- Both package builds passed and all 76 package tests passed (64 Viewer, 12 Engine). Two targeted audio-OFF 720 × 1280 pairs matched the reviewed HEAD byte-for-byte, ECO R16 wide and QUALITY R17B gift focus. [Pair hashes and native capture metadata](browser.json)
