# P0.4 — Female Vietnamese Áo Bà Ba & Long Loose Hair

Task: [AI_VISUAL_03](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/main/Task/AI_VISUAL_03_FEMALE_AO_BA_BA_LONG_HAIR.md). PR #2 **DRAFT**, branch `assets/lotus-pad-chibi-p0`. Immutable baseline HEAD `dff58dde2d71467cb17916f6b4016e71b2ef4158`. Versioned folder `Assets3D/Review/lotus_pad_chibi/p4/`. **FEMALE ONLY; STOP before male, Codex, runtime or merge.**

## SA finding → change → evidence
| Finding | Change | Verification |
|---|---|---|
| P0.3 generic robe | Original collarless, rounded-neck Vietnamese áo bà ba; five front buttons/placket, two small pockets, long sleeves, short hip-length side-slitted flaps and loose pants | Actual exported GLB front and 3/4 VTK PBR, placket closeup; Cycles owner run PENDING |
| Short/stiff P0.3 hair | Three flowing closed volumetric tapered back sections to waist Y≈0.32, small side locks, integrated back cap (no bun) | Back/profile/close VTK PBR + five idle sampled front/back; exact contact pending |
| Six colors for multiple viewers | Single mesh with glTF KHR_materials_variants for two named slots `ao_ba_ba_top`/`ao_ba_ba_pants` | 6 variant mappings on each primitive, actual six-color PBR render, no geometry duplication |
| Preserve face/pose and sit_idle anchors | Reconstructed P0.3 face proportions/crossed-leg paths, stable SeatRoot/Head/Nameplate/FX nodes, 2s 17-frame original idle formula | Actual GLB JSON and imported mesh check PASS; P0.3 original binary **not read locally**, cannot claim bitwise geometry parity |
| Freeze P0.2 leaf | Never re-exported in p4; reference owner original GLB `p3/lotus_pad_01.glb` | SHA pinned, true P0.3/P0.4 pairs with leaf await owner Windows Cycles |

## Real binary measurements
`meditator_female_ao_ba_ba_p04.glb`: 244,348 bytes, SHA256 `586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09`, 9,718 tris, 5,063 verts, 9 meshes, 21 material definitions (12 extra variant alternatives), 0 textures. Versus p03: +994 tris, +32,308 bytes, **−2 mesh nodes**; not a measured GPU/FPS result.

Pad remains unchanged from P0.2 SHA256 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`. Actors +Y up, +Z forward, origin SeatRoot, Y=.195 placement once; same local anchors Head [0,.835,.04], Nameplate [0,1.335,.03], FX [.37,.805,.16]. Motion `sit_idle` 0–2s/17 keys from same mathematical formula.

## Evidence classification
**Executed locally:** actual exported GLB parsed independently, zero degenerate faces, real imported native VTK glTF PBR front/side/3⁄4/back, placket/back hair close, medium/close 9:16, six palette swatches from same GLB and ten idle still frames. Sampled nearest-vertex distance hair to pants at five idle times min .159m. **This is NOT an exact mesh-mesh penetration proof**.

**Not executed:** AI container has no Blender executable; actual P0.4 Cycles, editable `.blend`, same-rig P0.3/P0.4 Cycles pair A/B with original frozen leaf, native Three.js and target GPU/Live Studio are **PENDING**. P0.3 28/28 owner Cycles PNG SHA were previously independently checked by SA. Do not conflate that with P0.4 results.

Original complete source Python, Windows Blender script/PowerShell, GLB, manifest and 31 visual evidence files are in ChatGPT download ZIPs provided with handoff. Files not verified on GitHub are `pending_owner_upload`, including original generator script and new binary. No paid tools; external cost **0 VND**.

**Owner gate:** `P04_FEMALE_OWNER_VISUAL_REVIEW_REQUIRED`. SA reviews PR #2 → owner views authentic Cycles → says **OK female** or requests female corrections → only afterward SA may create a separate male task. Do not merge or resume Codex.
