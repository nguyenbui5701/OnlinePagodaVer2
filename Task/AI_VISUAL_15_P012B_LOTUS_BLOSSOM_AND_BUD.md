# AI VISUAL 15 — P0.12-B Original Lotus Blossom + Closed Bud (ECO/QUALITY)

> **SA ASSIGNED / 2026-11-23.** One focused **AI Visual / Blender asset** workstream for two genuinely missing botanical props. Owner has approved P0.12-A 12-position chibi community after SA [TECH PASS PR #9](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/9#pullrequestreview-6016205924), and authorized continuation with the missing-art audit. **STOP at `P012B_SA_ART_REVIEW_REQUIRED`**, SA checks actual binary/source/Cycles → Owner Botanical Art GO. **This task does not approve merge or runtime integration.**

## 1. Role / objective / scope / STOP first

**Role:** independent **AI Visual / AI 3D** responsible for original mesh authoring, Blender/source, GLB exports, material/LOD/provenance, exact binary metadata, authentic Blender Cycles evidence and asset-branch handoff. **SA** is reviewer; **Codex** is viewer and Event Engine developer **only after this art passes separate gates**.

**One visual outcome:** create a harmonious, **original low-poly open lotus flower + closed lotus bud** as small lake botanical accents that can later sit among 12 avatar pads without competing with the approved Sakura R16 and meditating chibis. Video-inspired: pale warm white/blush petals, readable layered petal silhouette, softly golden center, restrained muted green sepals/stem; distinguish the open radial flower and the upright tapered bud at both close and aerial 9:16 shots. Model genuine geometry, not flat 2D planes falsely sold as 3D.

**No other assignment:** Do NOT revise existing Sakura R16, lotus pad P02, male P07b1 or other hairs, female P05f/P05c, clothing palettes, avatar identity, default seat capacity, gifts, camera, shader water/fog/particles, livestream UI, mountains/horizon/rocks, new character variants, V1 or `apps/**`/`packages/**` code. **No TikTok LIVE, no GPU benchmark claims, no expensive post-FX, no paid service, no merge**. Any new landscape or crowd-renderer work requires another task. **Do not rerun all old P05/P07/Sakura Blender cases**: only the **new botanical GLB** and its actual P02-scale context need Cycles evidence.

**STOP and report** if an actually approved, importable, commercially usable open lotus and bud asset already exists with exact canonical file path/hash/license; SA will choose reuse before commissioning redundant art. The repo audit found neither in PR #1/#2, but it did not inspect a separate Owner art library.

## 2. Repository, separate asset branch, exact immutable input

Repo: https://github.com/nguyenbui5701/OnlinePagodaVer2

- **Asset authoring reference:** [PR #2 — existing approved lotus/chibi family](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2), `assets/lotus-pad-chibi-p0`, pinned exact **HEAD `ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced`**. **Create a fresh branch from that exact SHA**: suggested `assets/p012b-lotus-blossom-bud`, with a **new stacked PR targeting `assets/lotus-pad-chibi-p0`**. This is NOT permission to push to PR #2's branch, to rebase/force push, or to merge it.
- **Scene/look reference:** [PR #9 P0.12-A Viewer](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/9) HEAD `0a5d060d0ec4eeda19d62cfcd4a58a29f58c38bf`, **SA TECH PASS + Owner P0.12-A Visual GO**, stacked on accepted [PR #8 P0.11 twilight](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/8) HEAD `9f15513c451eacc5f52a62c47ebd17085beea15e`. **Read-only reference**. Do NOT put art files into PR #9 or change its production viewer until separate SA+Owner art approval and a later Codex task.
- **Versioned target directory:** `Assets3D/Review/lotus_botanicals/p012b/` **new files only**. Never overwrite old PR #2 P02/P05f/P07b1 or PR #1 R16 GLBs, Blender sources, manifest, evidence or ZIPs.
- **Pad scale reference:** real P02 `Assets3D/Review/lotus_pad_chibi/p0.2/lotus_pad_01.glb`, **262,108 bytes, SHA-256 `80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9`**, P02 mesh width ~2.08 m and `PadSeatAnchor` at [0, .195, 0]. Use this file ONLY as frozen scale and optional render-context reference; **do not modify or bundle its geometry in the new flower/bud GLBs**.
- **Other original GLBs protected:** R16 QUALITY `c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c`, ECO `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`; male P07b1 `4e8c8d082352d67d0eaf637df7973931442c724a0f7db598ea8fde8de3873097`. Retain originals byte-for-byte.

**Branch safety:** verify PR #2 HEAD remains pinned before branching; if it advances, stop and request SA re-pin rather than silently building on changed data. Open one independent art PR only after placing actual small source/doc files and clearly recording where large binaries will be uploaded.

## 3. Mandatory reading order

1. [Design/07_WORK_RULES.md](../Design/07_WORK_RULES.md); [Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md); [Design/11_3D_ASSET_MANIFEST.md](../Design/11_3D_ASSET_MANIFEST.md); [Design/13_3D_EVENT_INTEGRATION_CONTRACT.md](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md).
2. **Authoritative evidence-based asset audit** [Design/19_P012B_BOTANICAL_ASSET_AUDIT_AND_SCOPE.md](../Design/19_P012B_BOTANICAL_ASSET_AUDIT_AND_SCOPE.md), plus [Design/18 P0.12 community contract](../Design/18_P012_LOTUS_COMMUNITY_SCOPE_AND_GATES.md) and [Design/17 reference-video visual milestones](../Design/17_CHUAV2_VIDEO_FIDELITY_ROADMAP_P011_PLUS.md). Read [Design/10_GRAPHICS_PROFILES.md](../Design/10_GRAPHICS_PROFILES.md), [Design/12_CORE_PRIORITIES_AND_AI_ROLES.md](../Design/12_CORE_PRIORITIES_AND_AI_ROLES.md).
3. [PR #9 formal SA review](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/9#pullrequestreview-6016205924), actual 720×1280 [P012A screenshots/runbook](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/0a5d060d0ec4eeda19d62cfcd4a58a29f58c38bf/apps/v2-viewer/P012A.md), existing P02 [manifest](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced/Assets3D/Review/lotus_pad_chibi/p0.2/asset_manifest.json). Read the relevant **SA comments in PR #2**; do not assume a historic `pending_owner_upload` field describes the latest remote binary truth.
4. The original user video `chuav2(1).mp4` was inspected by SA in a separate conversation and **is NOT on GitHub**. Unless Owner explicitly supplies it to this AI Visual session, mark **`REFERENCE_VIDEO_NOT_AVAILABLE_TO_AI_VISUAL`** and use the grounded timestamp notes in Design 17: **0–5s, 6–10s, 26–29s, 40–43s**. Never claim an unseen frame was inspected. Reproduce the botanical **aesthetic**, not stream UI or branded content.

## 4. Grounded SA assessment and target composition

**PASS and freeze:** P0.12-A stable 12 seeded positions (3 real hero seats plus 9 cosmetic seats), dark blue-purple dusk/gold-water, Sakura R16, original P02 sitting pad, P07b1 chibi, camera and confirmed gift A/B/C. Asset audit has identified **real existing female P05f and male hair alternatives**; those are **NOT** to be remade in this assignment.

**MISSING and justified:** No dedicated open lotus flower or bud GLB in complete changed-path lists of the reviewed PR #1/#2 and no such production art in PR #9. Therefore produce **only two canonical botanical subjects**:
- **P012B BLOOM:** open pale blush/pink lotus with readable concentric or staggered petal rings, shallow concave petals, warm subtle center, restrained foliage/sepal and small unobtrusive stem; convincing from water-level side, 3/4 and aerial. No neon plastic or oversized peony.
- **P012B BUD:** upright, closed tapered lotus bud with clearly pointed layered petal tips and green under-calyx, proportionally smaller and taller; should not read as a recolored bloom or a Sakura blossom.

**Measured P02 comparison:** P02 pad is ~2.08 m wide. **Suggested target world scale** (not claimed dimensions of an existing model): Bloom petal span **0.55–0.85 m**; bud maximum width **0.22–0.40 m**, visible crown height **0.35–0.75 m above water**. A slender stem may begin at the water surface at **local (0,0,0)** with +Y up, and flower/bud material above Y=0 as needed. Do NOT reuse or embed P02 sitting pad geometry; the new assets are independent environmental flora. All actual bounds, pivot and above-water offsets must be measured and written to the manifest.

**Requested LOD caps** (art production budgets, adjust only with SA justification):
| Asset | QUALITY max tris | ECO max tris | Preferred materials / textures |
|---|---:|---:|---|
| `lotus_bloom_p012b` | **2,400** | **800** | 1–3 materials, 0 external textures |
| `lotus_bud_p012b` | **1,000** | **350** | 1–3 materials, 0 external textures |

Visual acceptance is more important than claiming a fake polygon count. If a credible curved petal requires a few more tris, submit a tradeoff analysis **before** increasing the budget. Account for petal backs/normals and waterline shadow, avoid excessive transparency/sorted alpha or billboard tricks that fail close side views. Instancing is a later Codex responsibility; keep materials shareable and geometry memory small.

**Reference-inspired scene:** open blossoms/buds are visual accents in foreground and mid-distance around the 12 pads, not guaranteed at every shot. They must preserve actor/leaf contact, camera-safe corridors and dark-water reflection legibility. No character/seat/gift binding on botanical objects.

## 5. Phased execution — independent AI Visual only

### Phase 1 — Audit actual art and document design BEFORE modeling
1. Check PR #2 current exact HEAD, existing GLBs/Blend and the existing approved Pad P02. Search for **actual valid flower/bud** in art sources available to this worker and explicitly declare whether one exists. If both exist with Owner-art approved provenance, **STOP** and report, do not rebuild. If only one exists, propose reuse and request SA clarification instead of duplicate.
2. Lock +Y meters/world Y=0 waterline; measure P02 world bounds and align the bloom/bud scale. Draft a **two-item table** of target dimensions/polygon/material count and image checkpoints. Show a simple visual study clearly marked **CONCEPT** if necessary, never use concept PNG as accepted GLB evidence.
3. Record SHA of exact P02 reference file; do not alter any original. Explain any deviation from P0.11's twilight color scheme and avoid producing many uncontrolled color variants.

### Phase 2 — Build true ECO/QUALITY floral geometry
1. Use **Blender** or Blender Python at 0 VND, creating **one editable source .blend** (or two if substantially easier) with clearly named collections `Bloom`, `Bud`, LOD collections, measured pivots, visible original mesh surfaces; no hidden paid generation. Local Python/trimesh is allowed fallback for original mesh modeling, **but does not waive actual Blender import/Cycles gate**.
2. Export **four original real glTF2 GLBs** (separately standalone): `lotus_bloom_p012b_quality.glb`, `lotus_bloom_p012b_eco.glb`, `lotus_bud_p012b_quality.glb`, `lotus_bud_p012b_eco.glb`. Keep both ECO/QUALITY comparable in dimensions and origin/axis; avoid exporting Blender cameras, lights or hidden historical P02 geometry.
3. Make petals readable in both LODs: geometric thickness or appropriately documented `doubleSided` + normals, no jagged/inverted backs, no Z-fighting, no accidental mesh holes, no material surprises under tinted dusk lights. Petals must be visibly lotus-shaped, not a floating polyhedron. Stem/root should not penetrate decor pads/camera. Static flower/bud clips are acceptable (no animations required).
4. Preserve original authoring source and exported repeatability. Use only original project-authored meshes/materials or identify every third-party reference/license granting livestream commercial use. Costs **0 VND** with free local tools; do not use paid fal/Meshy/Tripo or hidden credits.

### Phase 3 — Import, geometry audit and genuine Cycles evidence
1. For **each** of 4 actual GLBs: independently parse GLB2 header and glTF2 JSON; import into Blender (and GLTF preview where available) and verify finite vertex positions, UV/normals, bounding box, scale, pivot, upright +Y, triangle/vertex count, mesh/material/texture count, color space/PBR and zero missing external texture dependencies. Compute **actual SHA-256 and bytes** from the exported binary; record names and reproducible command/test stdout.
2. Required **real Blender Cycles** renders from the exact exported GLBs, for **both ECO and QUALITY**, at least **front, side, 3/4, slightly elevated/top** for bloom and bud. Use matching camera/light/exposure across each ECO vs QUALITY pair. Include at least **two 720×1280 9:16 scene-context renders** with the unchanged P02 pad as size reference and dusk-like warm/cool lights; context renders must clearly label source. No need to rerun old chibi/Pad Cycles scenes.
3. Test at least **one water-level low side** view with bloom and bud together and a **higher aerial** view. Evaluate silhouette, petal overlaps, bright core readability and shadows; document small defects. The new botanical models must not be wildly larger than the existing P02 pad or over-bright against P0.11 dusk.
4. Blender unavailable? Then **do not claim Cycles PASS**. Commit real source/small reports and mark **`BLENDER_CYCLES_PENDING_OWNER_RUN`** with a Windows PowerShell runner (only commands/scripts actually present), exact required files and expected outputs. SA cannot grant final Art GO until the new Cycles + source GLB are genuinely supplied and reviewed.
5. Native Three.js 720×1280 and RTX FPS are **Codex/hardware gates later**; do not invent live viewer screenshots from Blender, nor assert RTX optimization from just triangle counts.

### Phase 4 — GitHub small-file PR + binary and art handoff
1. New versioned directory:
   - `Assets3D/Review/lotus_botanicals/p012b/README.md`
   - `asset_manifest.json` with kind, accurate `assetId`, revision, LOD relationships, exact local root coordinates, bounds, triangle/mesh/material counts, normals/doubleSided, textures, GLB SHA256/bytes, provenance/license, actual GitHub file state and Cycles status
   - `PHASE_A_VISUAL_ANALYSIS.md`, `LICENSE_AND_PROVENANCE.md`, `BINARY_HANDOFF.md` with expected target paths and uploaded/pending statuses; original generator / Blender build / render scripts only where actually created
   - True editable `.blend` and four binary `.glb` if small enough and truly available; actual Cycles PNG + source logs/hashes where available, or explicitly `pending_owner_upload`. Never synthesize screenshots.
2. **Proactively commit small docs/code first** to own new branch and open a new asset PR stacked on PR #2. If asset files are large, supply the Owner exact byte and SHA-256 inventory and let them upload to the **same** new asset branch and file paths; do not mark them as present until remote fetch confirms.
3. New PR summary must include pin `ce0db947...`, file list, matched ECO/QUALITY images, actual reproducibility and GLB structure, 0 VND cost, art gap vs Design 17 and owner decisions. Do not touch PR #2 HEAD, PR #9 branch, code, old R16/P02/P07b1 or main other than the official task docs committed by SA.

## 6. SA / Owner acceptance table

| Gate | PASS | BLOCKER |
|---|---|---|
| ART1 shape | Recognizable **open lotus** vs **closed bud**, tasteful blush/white petals and green stem under dusk-like lighting | Generic pink ball, opaque peony, flat plane, bright neon core |
| ART2 independent models | Four actual importable GLB2 binaries ECO/QUALITY, exact hashes, measured origin/waterline, no appended camera/light/hero pad geometry | Concept-only PNG, missing GLBs, guessed LOD or incorrect world scale |
| ART3 renderer compatibility | Shared +Y meters and deterministic named models, clear low-poly surfaces and honest material/texture budget; P02 held byte-identical | Misaligned pivot, accidental P02 editing, unverified collision |
| ART4 Cycles | Actual same-GLB Blender Cycles front/side/3Q/top + 9:16 water/pad context, exact files with SHA and truthful logs | VTK/AI image represented as Cycles or missing editable source claimed present |
| POLICY | Versioned own PR, zero paid costs, no runtime/V1/LIVE/merges, licenses | Self-approved asset, unlicensed third-party mesh, old approved bytes overwritten |

**Pass levels:** `P012B_GEOMETRY_READY` is not `P012B_SA_ART_PASS`; `P012B_SA_ART_PASS` is not `OWNER_P012B_BOTANICAL_ART_GO`. After genuine asset gates, SA may write a **distinct Codex** viewer integration task stacked on PR #9; no automatic implementation or broader P0.13.

## 7. Git commands/PowerShell checks (only after creating actual branch)

Use local Git/Blender when available. These are **illustrative** branch and checksum commands, not claims of having run Blender or produced art:

```powershell
git rev-parse HEAD
git status --short
# Verify branch pins before work; create a NEW worktree, never switch an active Codex/AI Visual worktree:
git worktree add -b assets/p012b-lotus-blossom-bud .\ReviewPR\P012B ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced
# After generating a REAL file:
Get-FileHash .\Assets3D\Review\lotus_botanicals\p012b\lotus_bloom_p012b_quality.glb -Algorithm SHA256
# Verify the final asset manifest matches ALL four actual binary checksums.
```

If running without Windows, adapt syntax; report actual paths and commands. Do not force-push or auto-merge.

## 8. AI Visual final response format (copy/paste to SA)

**SA finding → action → native evidence → PASS/PARTIAL/BLOCKED**, exact new PR URL/branch/commit SHA, measured four GLB SHA256+bytes+triangles/axes/pivots/LOD status, original Blender source status, original uncompressed Cycles filenames and comparisons, `BINARY_HANDOFF` pending vs uploaded truth, licensing/0 VND, exact source P02 unchanged and the Owner's next art decision.

**STOP at `P012B_SA_ART_REVIEW_REQUIRED` and wait for SA/Owner before any Codex runtime integration, hill models, clothing variants, performance GPU or LIVE.**


## 9. SA PR #10 review blocker — 2026-11-23

**Exact reviewed PR #10 HEAD:** `3d7d86d589f9a309d03cd9862ba0041795395ddf`, source asset baseline PR #2 remains `ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced`. Formal [SA review #6016725385](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/10#pullrequestreview-6016725385), including two inline evidence findings.

**Gate update:** `P012B_GLB_TECH_PASS` (all four exact GitHub GLB SHA256 and bytes independently rechecked); `P012B_BLENDER_CYCLES_EXECUTION_PASS` (native Blender 4.5.16 log, all twenty 32-sample Cycles PNGs and a real Git blob for `.blend` found); **`P012B_ART_CONTEXT_EVIDENCE_HOLD`** (no `SA_ART_PASS` or Owner Botanical Art GO yet). Historic `blender_stderr.log` AgX enum traceback is from a failed earlier attempt; later successful `blender_cycles_stderr.log` is empty with exit 0 and marker `P012B_BLENDER_CYCLES_FINISHED 20 PNG`. SA only read Github and visually inspected remote PNGs; large `.blend` could not be independently decoded/loaded through GitHub connector.

**Minimum AI Visual correction on the EXISTING PR #10 branch:**

1. In `blender_cycles_p012b.py` context scene, frame actual original P02, **an unobstructed open bloom AND distinct closed bud** simultaneously in at least the water-level low and aerial **720×1280** original Blender Cycles images. Current P02-context / low / aerial frames do not visibly show the bud despite context script enabling it; likely placement or crop. Solve by revising **render-only camera/positions**, not changing GLB geometry or the original P02. Keep measured scale honest. If helpful add two new targeted proof frames rather than rerender 16 already passed individual ECO+QUALITY view images. Save accurate PNG SHA metadata and describe camera/transform proof.
2. Reconcile **stale project evidence metadata**: `asset_manifest.json` `blenderEditableSourceStatus`, `cyclesStatus`, and per-asset `sourceEditableBlenderStatus/cyclesEvidenceStatus` should reflect actual uploaded Cycles and `.blend`, not prior `pending_owner_blender_run`. Update current README/BINARY_HANDOFF/PR body while retaining earlier failed-run logs/audit history. Do not assert Owner acceptance or SA independent file-open of the large editable `.blend`. Commit exact file SHA/bytes for updated artifacts.
3. Recheck 4 frozen GLB bytes/hashes **without re-exporting** and PR #2 unchanged baseline. Keep new commits restricted to `Assets3D/Review/lotus_botanicals/p012b/**`. No Sakura/character/pad edit, runtime integration, V1, LIVE, RTX, new mountain/rose/chibi work, paid tools or merge.
4. Return **new exact PR #10 HEAD**, corrected context original PNGs, current manifest and Cycles completion/sha log. **STOP again at `P012B_SA_ART_REVIEW_REQUIRED`** for SA re-review and separate Owner Botanical Art GO. Blossom's pale/flat appearance and bud's smooth shell are **nonblocking visual observations for Owner**, not a request for an unsolicited whole-asset rebuild.

**Do not delete this task while PR #10 art gate is unresolved.**


## 10. SA PR #10 context-only re-review — 2026-11-23

**Exact reviewed delta:** `fa8e7de0409d95b197f2c6e221a0c33b34db23b3..b7427e0b8606050da933608788f9d40526906d32` on `assets/p012b-lotus-blossom-bud`; PR #10 remains DRAFT, base PR #2 `ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced`. Formal [SA re-review #6017094097](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/10#pullrequestreview-6017094097) + inline comment. **The prior Context Evidence HOLD in Section 9 is RESOLVED.**

**Objective results:** One commit, nine changes entirely within P012B folder: **4 real 720×1280 original Cycles context PNGs**, revised `.blend`, revised success logs and hash manifests. Four real context images independently opened by SA. All **P02 pad, distinct open bloom and closed bud** now clearly visible together in ECO/QUALITY context, low water-level QUALITY, and aerial QUALITY. All **four changed PNG SHA256/byte counts independently recomputed and match** `P012B_Cycles_Evidence/cycles_manifest.json`. Blender 4.5.16 success log exit 0 / four projected-three-subject PASS / 16 original isolated Cycles SHA preserved / total evidence 20. The original 4 ECO/QUALITY GLBs, their previously verified SHA-256, original P02 and other branches did not change. The new `.blend` is a real uploaded Git blob but its independent Blender open/hash verification was not performed by SA.

**Review outcome:** `P012B_GLB_TECH_PASS`; `P012B_BLENDER_CYCLES_RUN_PASS`; **`P012B_ART_CONTEXT_EVIDENCE_PASS`**. Full `P012B_SA_ART_PASS` is **awaiting exactly one narrow metadata consistency fix**. This is **not** a request to rerender or resculpt.

**Remaining action on EXISTING PR #10 branch ONLY:** `asset_manifest.json` still says `cyclesStatus=...CONTEXT_FRAMING_HOLD` and individual `cyclesEvidenceStatus=...CONTEXT_FRAMING_CORRECTION_PENDING`. `README.md`, `BINARY_HANDOFF.md` and PR #10 description also still describe those four updated context frames as unrendered. Correct those **documentation statuses only**, referencing four **actual** new PNG hashes from current Cycles manifest, Blender 4.5.16 exit 0, preserved 16 isolated shots, 20 total, and the revised editable `.blend` uploaded (not independently opened by SA). Keep `OWNER_BOTANICAL_ART_GO_PENDING`, no claim of SA GLB→Three.js integration or RTX/LIVE. No changes to source geometry, GLBs, Cycles images, `.blend`, original P02, PR #2/#9, V1, paid tools or merge.

**Next:** AI Visual commit docs-only correction, provide exact new PR #10 HEAD → SA checks quickly → Owner Botanical Art GO decision → only then authorize later independent Codex viewer integration task. Until that, **STOP `P012B_SA_ART_REVIEW_REQUIRED`**, `MERGE_INTEGRATION_HOLD`. Section 9 retained as audit history.
