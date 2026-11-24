# CODEX 20 — P1-01A/B correction and local spoken review

`P10B4B_SA_VOICE_IDLE_REVIEW_REQUIRED`

Reviewed PR #22 HEAD `e4422706bfc35285fbe77cc905af3374a7ca99c7`. Corrected runtime `3141e6e24e290642389f536302411f32a3a8d742`. The existing R1 recording, camera parity and worker evidence remain at their original capture pins. [Task §§7–8](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/690f5d0/Task/CODEX_20_P10B4B_DYNAMIC_VOICE_IDLE_BLESSINGS.md) · [SA R1](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/22#pullrequestreview-6035085768)

## P1-01A/B

The director stores the exact accepted display-name snapshot and checks it against the current visible actor and seat. When the current name changes, it aborts the queued named generation and preserves the nameless fixed fallback. Renaming from a chat update cannot trigger synthesis. A newer accepted final can supersede a still-waiting generation with its own template and exact count. The focus retains its original 350 ms absolute deadline and one chime. Once a voice attempt is terminal, the existing consumed-request ledger suppresses later finals for that playback slot.

Focused tests use the actual SliceDriver, Event Engine, AudioDirector and NamedVoice. They cover a change to another allowlisted name and an unapproved name, late completion of a canceled generation, and timely versus expired completion of its replacement. In the supersession case the Engine count is five while the replacement template carries the exact accepted count of three. One chime and one voice outcome are verified. [Tests](../../../test/named-correction.test.ts)

## Actual speech and provenance

Section 8 establishes `V1_REAL_GTTS_OWNER_HOST_TECH_PASS` for the supplied V1 sample, with 915 ms reported synthesis and independently measured 2.793 s, PCM16 mono 24 kHz and zero clipping. That is the Owner host's technical receipt. Section 8 still leaves service automation and output-use rights unresolved. The V2 worker's existing gTTS network gate remains `DYNAMIC_TTS_BLOCKED`. The V1-style gTTS/FFmpeg adapter and fixed-voice fallback remain available under their existing gates. [gTTS upstream disclaimer](https://github.com/pndurette/gTTS#disclaimer) · [Google Terms](https://policies.google.com/terms?hl=vi)

This review includes **15 actual speech WAVs** using the separately labeled offline eSpeak NG option. Three use the synthetic donor names and twelve are original idle wishes. These listening candidates are used only by the disposable browser review, through the existing AudioManager interfaces. They never replace the approved product voice assets. Product idle speech remains `IDLE_SPEECH_LIBRARY_PENDING` until corpus approval. Only original text goes into the local Vietnamese formant synthesizer. No account or external synthesis request is involved. The GPL license applies to the generator, and the generator package is kept out of the repository. The applicable GPL output clause covers output only when the output itself constitutes a covered work. [eSpeak NG license](https://github.com/espeak-ng/espeak-ng#license-information) · [GPL text, §2](https://www.gnu.org/licenses/gpl-3.0.en.html#section2) · [Review corpus manifest](voice/manifest.json)

## Reproduce on Windows PowerShell

Use the prepared Viewer worktree with Node 24, FFmpeg, Edge and the previously staged assets. The evidence runner starts and stops Vite through the project's existing strict loopback configuration on port 5221. Its disposable page uses the existing capacity DEMO, camera-state clock and native AudioManager. Audio is captured from the Web Audio destination graph. It is audio evidence with a camera-state timeline.

```powershell
Set-Location apps/v2-viewer
npm.cmd test
npm.cmd run build
node scripts/evidence-p10b4b-r2.mjs
```

To regenerate the separately labeled listening corpus, use a temporary extraction directory and the pinned `espeak-ng@1.0.2` npm archive. The generation script operates offline after extraction and does not install anything into the Viewer tree. The archive SHA-512 integrity in Base64 is `Xe4YC7d/+O06zYpsqrJ3LpbETdL/IO8JrnAmWcQEMoRFmMLWU+2y2HnpEkOCnqZfb40MBDVyP4ppfusKdWbPcQ==`.

```powershell
$pagodaEspeak = Join-Path $env:TEMP 'pagoda-r2-espeak-wasm'
New-Item -ItemType Directory -Force $pagodaEspeak | Out-Null
npm.cmd pack espeak-ng@1.0.2 --pack-destination $pagodaEspeak
tar.exe -xf (Join-Path $pagodaEspeak 'espeak-ng-1.0.2.tgz') -C $pagodaEspeak
$env:V2_ESPEAK_JS = Join-Path $pagodaEspeak 'package/dist/espeak-ng.js'
node scripts/render-p10b4b-r2-voice.mjs
```

Cost **0 VND**. [Viewer tests and build](viewer-checks.txt) · [Engine tests and build](engine-checks.txt) · [Worker tests](worker-checks.txt)

## Measured results

- **92 tests passed** (74 Viewer, 12 Engine, 6 worker). Viewer and Engine builds passed. The four additional focused cases directly exercise the renamed identity and supersession fixes.
- **78.36 s native browser mix**, −4.68 dBFS peak, zero clipped samples and zero external requests. Named offline playback started at scene 47.053, 52.900 and 58.754 s, aligned to the respective 47.050, 52.900 and 58.750 s confirmed focus starts. Three voices ended with zero overlap. The original capacity DEMO ended in cinematic mode with eight confirmed gifts.
- The actual spoken idle cues started at 10.415, 22.644, 45.213 and 75.066 s. A gift interrupted the third at 46.004 s, with the 30 ms release and an observed cut-end at scene 46.039 s. The scheduler waited another quiet interval after the camera returned. The review corpus is 24 kHz mono PCM16 with durations 1.677–2.615 s.
- The corrected mix, all 15 clip digests, and source and timing receipts are included. [Native review WAV](offline-espeak-review.wav) · [Camera/audio timeline](timeline.json) · [Individual clips and hashes](voice/manifest.json)
