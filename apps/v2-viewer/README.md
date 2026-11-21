# Sakura R16 renderer and camera spike

[Design/16](../../Design/16_P0_APPROVAL_AND_HANDOFF.md) at `fcc6ede4cb7a96ba09cb94d2088fbf9e09481766` (Git blob `ca3a34bfac061bdf61f9d9f6d4643677bbd94b21`) and [CODEX_01](../../Task/CODEX_01_RENDERER_CAMERA_SPIKE.md). All code and evidence belong to `apps/v2-viewer/**`. Three.js GLTFLoader is the first candidate under evaluation.

## Run on Windows

Node 24+, npm and a WebGL 2 browser. Get both owner-approved GLBs at the Design/16 canonical paths from the R16 handoff and point the script at their directory. The script verifies both files before copying them into ignored `public/r16/` for local serving. The viewer verifies the selected GLB bytes again before native GLTFLoader import. It reports a missing or corrupt file on screen. Canonical remote GLBs returned 404 at review time on asset PR #1. The evidence uses the local owner files matching both approved digests.

```powershell
Set-Location apps/v2-viewer
npm.cmd ci
npm.cmd run assets -- 'D:/path/to/Assets3D/Review/sakura_hero/r16'
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Open `http://127.0.0.1:5173/` for ECO with diagnostics, `?profile=quality` for QUALITY, or `?clean=1` for clean capture. Asset verification requires a secure browser context such as loopback HTTP. The canvas backing buffer is 720×1280 with a responsive preview, pixel ratio 1, 0.05–500 m clip planes, 44–55° vertical FOV and a provisional 8% inset on each edge for later overlay framing. The scene keeps the asset at its exported orientation. Water is a runtime shader at Y=0. The 40 s closed camera spline samples by distance with smooth FOV changes and repeats. CLOSE and COMMUNITY currently frame the tree and lake while AI Visual supplies the pad/chibi. The seat adapter resolves room session → actor ID → seat transform → supplied local head anchor. Gift scheduling and rendered gift focus are integration work.

## Reproduce the review evidence

Use the same source directory above and the owner Cycles `Blender_Evidence_R16/r16_final` directory. The script opens headless Edge/Chromium with SwiftShader and writes a JSON report, four labeled comparisons and six clean 9:16 frames. Set `V2_EVIDENCE_DIR` to write to a separate output folder.

```powershell
$env:V2_BROWSER = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
npm.cmd run evidence -- 'D:/path/to/r16/Blender_Evidence_R16/r16_final'
```

- [Browser report](evidence/browser-report.json) records actual GLB digests, imported materials and sides, bounds, camera poses, draws, textures, browser/context errors and replay frame times. QUALITY and ECO matched the R16 manifest at 191,288 and 44,412 triangles respectively. Exported +Y bounds match the owner Cycles report for both profiles. The lower ECO bound is −1.026 m at the roots. Material factors and petal culling match the embedded glTF declarations.
- Cycles comparisons for [full 9:16](evidence/pbr-hero_full_9x16.png), [top](evidence/pbr-top.png), [under](evidence/pbr-under.png) and [three-quarter](evidence/pbr-three_quarter.png) use the checksum-verified owner reference frames. Matched inputs are the vertical FOV, pose, up vector, and directions, RGB tints and numeric energies of the three suns aimed at (0,9,0). Comparison mode omits lake and fog. Three.js approximates the Cycles world with ambient fill, uses its AgX tone mapper, and uses one shadow map for QUALITY. Cycles uses finite-angle suns, path-traced bounce and AgX Medium High Contrast. Numeric light energies do not imply radiometric parity between engines.
- The matched silhouettes and placement support the axis and camera check. Native Three.js shows paler, less saturated pink canopy, sharper petal facets, greater local contrast on the dark plum bark and harder shadows under the canopy. Both preserve the dark trunk and gold streaks. Visual parity remains for SA review.
- Clean cinematic frames at [0 s](evidence/cinematic-0s.png), [9 s](evidence/cinematic-9s.png), [15 s](evidence/cinematic-15s.png), [20 s](evidence/cinematic-20s.png), [33 s](evidence/cinematic-33s.png) and [42 s](evidence/cinematic-42s.png) document the running scene. The owner clip `chuav2.mp4` was unavailable in the checkout. Video-golden fidelity and the combined Sakura + lotus pad + chibi + gift slice remain integration gates.
- The replay validates the four camera modes and wrap in a running browser for at least 46 s. Unit tests sample the path at 60 Hz across the wrap and verify actor-to-seat mapping. Browser tests reject both missing and same-size tampered GLBs.
- The browser report is a Windows 10 i5-11400H software-rendering observation at 720×1280 with LIVE Studio closed. RTX 3050 Ti ECO and RTX 3060 QUALITY with LIVE Studio are pending. Compare owner measurements only after the target hardware and clean-capture conditions are in place.
