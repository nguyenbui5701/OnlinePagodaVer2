# AI VISUAL 10 — P0.6a Male Chibi Prayer Character (Two Poses, Neat Short Hair)

> **SUCCESSOR AI_VISUAL_11 P0.6b — 2026-11-22:** Owner uploaded P0.6a GLBs and genuine male/female Cycles under PR #2 HEAD `b368444ccb851e88521d97d5be94299fc0f790f7`. SA verified two GLB SHA/meshes/idle/variants and Cycles logs but found **hair ART PARTIAL** (smooth uniform cap/helmet in front, side, back, top). [SA review #6011115553](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6011115553). Only current active [AI_VISUAL_11](AI_VISUAL_11_MALE_SHORT_HAIR_REFINEMENT_P06B.md) authorizes minor hair sculpt in new p6b. Keep p6a original unchanged; existing body/pose/hands and approved female/lotus are frozen. No male owner approval yet, no Codex/merge.


**SA assignment:** 2026-11-22 · **Status:** ASSIGNED — MALE VISUAL ONLY / OWNER ART GATE OPEN · **Owner instruction:** “Ok chốt nhân vật nữ, tiếp tục chuyển sang nhân vật nam giống như vậy với tóc gọn gàng.” 

**MANDATORY SAKURA RULE:** **SA issues a testable task → independent AI Visual creates genuine editable Blender + exported GLBs + real Cycles → SA independently reviews the files on PR → owner visually approves BOTH male poses → only then next stage.** This is the authoritative standalone, versioned production prompt; follow [Design/07_WORK_RULES](../Design/07_WORK_RULES.md) and the evidence-driven task pattern [Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT](../Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md). “Make the male like the female” is NOT an acceptance test.

## 1. Role, objectives, locked scope, hard STOP / GATE

**Your role:** **AI Visual / Blender 3D artist**, NOT Codex. You create true male 3D art, source and proof, not runtime event logic, shader code, TikTok hooks or UI overlays.

**Primary objective:** create **ONE consistent male chibi character identity in TWO fully usable prayer poses** for OnlinePagodaVer2 lotus garden:
- **A — cross-legged prayer:** sitting naturally, both hands gently joined palm-to-palm before the sternum, with believable folded legs, a modestly readable instep/foot and natural body weight supported by the REAL lotus.
- **B — kneeling prayer:** kneeling on BOTH knees, feet tucked plausibly, torso upright and hands joined in the same male prayer gesture, with no hovering or cloth/leaf penetration.

These must clearly belong to the **same visual family** as the **OWNER-APPROVED female set**, but should read as a distinct, gentle **male**: **neat short hair**, subtle male face/eyebrow/hairline differences, and small culturally plausible áo bà ba menswear proportions. Not simply a female mesh with the long hair cut off; not adult-realistic or hypermasculine; no beard/hat/monk robes/modern jeans. Preserve peaceful closed-eye smile, rounded soft stylized chibi geometry, natural hands.

**Owner-specific nonnegotiable hair direction:** tidy short Vietnamese-male hairstyle, with a controlled soft side part or combed crop; hair lies comfortably against head, short at nape, does **not** extend down back/neck, no female ponytail, no angular spiky helmet, exaggerated undercut, floating hair strips or scalp clipping. Hair front, both side profiles AND full back are separately judged; if short side-part conflicts with silhouette, choose one understated alternate and explain why, but deliver **one coherent final candidate**, not a catalog of options.

**Clothing:** Vietnamese **áo bà ba** long-sleeve top with authentic clean button/placket and relaxed trousers; recognizable shared design language and consistent PBR softness with female. Male version may have slightly straighter torso/shoulder shaping and a restrained hair/face difference. Retain **exactly SIX named fabric palette variants** with identical names to female, using one geometry set + glTF material variant mappings, not six duplicated avatars:
\`pastel_lilac\`, \`blush_rose\`, \`sage_green\`, \`sky_blue\`, \`warm_cream\`, \`terracotta\`.
Do not assume pink/lilac are female-only; all six must work on male for different viewers. Ensure top + trousers recolor coherently and buttons/skin/hair do not recolor erroneously.

**FROZEN, absolutely out of scope:** all female GLBs/Blender/evidence; existing P0.2 lotus, Sakura R16 and any scene assets; visual female hair/face/prayer hands/foot/waist/seat art; Event Engine, gift-focus FIFO, camera system code, app renderer, Codex PR #3/#4, V1 source, production LIVE. Do not rename or overwrite female files or older review folders.

**Hard STOP:** After real male A + B assets, Blender Cycles images/animations, validations and GitHub source handoff, **STOP for SA review and explicit owner approval of both male poses and hairstyle**. Do NOT merge PR #2 or start Codex/integration/GPU-LIVE work merely because AI Visual's own tests pass. The owner has approved the **female art direction**, NOT the male or full runtime production.

## 2. Repo, PR, exact reviewed HEAD, immutable female and lotus baselines

- Repository: https://github.com/nguyenbui5701/OnlinePagodaVer2
- **AI Visual working PR #2:** https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2
- Feature branch: **\`assets/lotus-pad-chibi-p0\`**; PR remains DRAFT / unmerged.
- **SA-observed and inspected latest branch HEAD:** \`e80ddc496df461728d3ee4cb6170ce2c3ff4fbfa\` (owner push \`1364eaf..e80ddc4\`). Before work re-fetch PR HEAD; if changed, report divergence and review new files first. **Never force-push, reset owner commits, or directly edit main from AI Visual branch.**
- **Owner art approval record (this task):** owner explicitly says **female character approved**, 2026-11-22. This closes the **female aesthetic decision**, not all technical/runtime gates; current male task is authorized.
- **New isolated version folder:** \`Assets3D/Review/lotus_pad_chibi/p6a/\`. Older \`p5f/\`, \`p5c/\`, \`p5e/\`, \`p5d/\`, \`p5b/\`, \`p5/\`, \`p4/\` and \`p2/\` are immutable references.

**Actual two immutable female GLBs SA independently rehashed from the current PR HEAD:**

| Female visual master | Source relative to \`Assets3D/Review/lotus_pad_chibi/\` | Real SHA-256 | Bytes | Triangles / Meshes / Materials |
|---|---|---|---:|---|
| **FINAL female cross-legged** | \`p5f/meditator_female_cross_prayer_p05f.glb\` | \`3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4\` | **574,608** | **17,752 / 10 / 21** |
| **FINAL female kneeling** | \`p5c/meditator_female_kneel_prayer_p05c.glb\` | \`a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac\` | **439,244** | **17,792 / 9 / 21** |

Both female masters independently parse as real **GLB glTF 2.0**, provide the same six variant names above, named \`SeatRoot\`, \`UpperBodyBreath\`, \`HeadAnchor\`, \`NameplateAnchor\`, \`FXAnchor\`, plus two idle clips per pose: \`sit_idle\` and either \`cross_prayer_idle\` or \`kneel_prayer_idle\`. **Use female cross P0.5f and kneel P0.5c separately**. Do **NOT** use older cross P0.5c, which would reintroduce foot/waist/seat problems.

**Lotus frozen source:** \`lotus_pad_01.glb\` P0.2, **262,108 bytes**, SHA-256 \`80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9\` (available as \`p5f/p02_baseline/lotus_pad_01.glb\`; check actual chosen path/hash). **Never re-export or edit lotus**.

**Source/repro:** p5f/ has genuine owner-uploaded GLB + Blender Cycles PNG and editable .blend projects, versioned p5f canonical exporter/Blender validator/Windows runner compressed as \`P05F_CANONICAL_*.zlib.b64\`, restored with \`restore_p05f_toolchain.py\`. Male AI Visual can use these as reproducible style/mesh reference but must provide its **own actual editable male source**, not solely two modified GLB binaries with no authoring files. P0.5c kneel editable references exist in \`p5c/P05C_Cycles_Evidence/\`.

**World/animation contract (inspect real GLB before claiming exact values):** glTF2 meters; +Y up, local +Z actor forward, origin seat; main actor root and anchor node names above. Female \`sit_idle\` and pose-specific idle span 2 seconds with 17 sample times. Keep male clip names, duration, sample count and anchor hierarchy semantically compatible; do not blindly copy female head height if male hairstyle changes. Scene \`PadSeatAnchor=[0,0.195,0]\` is an integration/placement convention, not proof of physical leaf contact; do NOT add it twice. Record male root/local offsets, foot-to-leaf contact, and anchor matrices separately.

**Available verified real visual references (no image generation required):**
- Female accepted cross FRONT: \`p5f/P05F_Cycles_Evidence/p05f_cross_pair/p05f_cross_pair_pair_front_cycles.png\`
- Female accepted cross SIDE: \`p5f/P05F_Cycles_Evidence/p05f_cross_pair/p05f_cross_pair_pair_side_cycles.png\`
- Female accepted cross 720×1280 medium: \`p5f/P05F_Cycles_Evidence/p05f_cross_pair/p05f_cross_pair_pair_medium_9x16_cycles.png\`
- Female kneel medium: \`p5c/P05C_Cycles_Evidence/p05c_kneel_pair/p05c_kneel_pair_pair_medium_9x16_cycles.png\`
- Camera references: \`p5f/P05F_CAMERA_CONTRACT.json\` for cross; \`p5c/P05_CAMERA_CONTRACT.json\` for kneel. Reuse cameras when making matched male-vs-female style comparisons. New independent male hair diagnostic camera permitted but label and document it.

**Historical video:** \`chuav2.mp4\` can be a style reference ONLY if the AI Visual chat actually contains it; if absent, use committed female images and exact two female GLBs, do not invent video frames or demand unnecessary reupload.

## 3. Required reading (strict order before writing geometry)

1. [Design/07 WORK_RULES](../Design/07_WORK_RULES.md), [Design/15 Sakura task format](../Design/15_AI_VISUAL_SAKURA_NEXT_PROMPT.md), [Design/14 ZERO COST](../Design/14_ZERO_COST_AND_ASSET_PR_POLICY.md).
2. [Design/11 graphics pipeline](../Design/11_3D_ASSET_PRODUCTION_PIPELINE.md), [Design/13 event/GLB integration contract](../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md), [Design/10 graphics profiles](../Design/10_GRAPHICS_PROFILES.md), [Design/16 owner gate](../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Task/00 execution order](00_P0_EXECUTION_ORDER.md).
3. The actually closed female visual work: [Task/AI_VISUAL_09 cross-seat contact](AI_VISUAL_09_FEMALE_CROSS_SEAT_CONTACT.md) and [Task/AI_VISUAL_06 female palms](AI_VISUAL_06_FEMALE_PRAYER_PALM_ORIENTATION.md), [Task/AI_VISUAL_04 two poses](AI_VISUAL_04_FEMALE_PRAYER_POSES.md). Owner explicitly **approved female art** at HEAD \`e80ddc496df461728d3ee4cb6170ce2c3ff4fbfa\` in conversation.
4. Exact female cross/kneel exported **GLB files**, genuine .blend authoring files, variant mappings, manifests, native Cycles outputs and source scripts above. Inspect **3D geometry**, not PNG only. P0.5f contact report \`p5f/P05F_SEAT_CONTACT_REPORT.json\` demonstrates curved-leaf support and camera need; do not treat its proxy statistics as an exact physics certificate.
5. Existing female paired camera contracts, the frozen P02 lotus GLB and committed Sakura R16 references as needed. If a referenced file is unavailable, mark it \`UNAVAILABLE\` with path and continue using exact surviving source; never guess missing hashes or Blender evidence.

## 4. Grounded SA assessment and male-specific issues-to-prevent (P0/P1)

**FEMALE BASELINE:** **OWNER ART PASS** for female cross P0.5f and kneel P0.5c. **TECHNICAL GLB SHA/STRUCTURE PASS** for those two files (SA independently verified). REAL P0.5f Cycles and real P0.5c kneel Cycles images are present and visually inspected. Full Blender/archive SHA + ZIP CRC and LIVE GPU throughput are **NOT asserted as SA-verified** for this new male task. **MALE STATUS: NOT BUILT / NOT REVIEWED**. This is a new asset task, not a defect report alleging a male asset already exists.

| Priority | Male design challenge grounded in female lessons | Required actual 3D solution | Required proof / failure |
|---|---|---|---|
| **P0 art** | New male must feel a distinct partner, not an unrelated 3D style or just a shaved female | Preserve chibi rounded proportions and soft PBR, similar head-to-body and hands-to-face scale, subtle male cheek/eyebrow/hairline/torso cues and modest face expression | **Same-camera, same-exposure male/female side-by-side** cross and kneel, front + 3/4 + side, recorded head/body bounding-box ratios |
| **P0 art** | Hair owner says **“tóc gọn gàng”** | Neat short cap/side-part crop, softly layered hair, unobstructed eyes/ears, short nape, controlled back silhouette; no ponytail spikes/helmet or head intersection | REAL reimported GLB Cycles **HAIR MACROS: front, LEFT/RIGHT side, back, 3/4**, with reference female profile; front/back show actual hair mesh |
| **P0 art** | Previously hands looked like fingers/flat two forward-facing palms | Short, rounded chibi digits with believable two palms **opposing and gently contacting** before chest, soft wrists/cuff transitions, prayer posture readable phone-size | **Cross AND kneel** hand close front/left+right 3/4/side and palm surface normals + near-contact/penetration metric (\`EXACT\` vs \`PROXY_ONLY\`) |
| **P0 art** | Crossed legs originally hid feet or foot looked like pebble | Natural folded trouser/leg shapes with restrained ankle→instep→toe silhouette emerging at plausible cuff; no disconnected tan sphere; knee/foot does not stretch or disappear from side | Matched cross foot macro front/3/4/side + visible at normal 9:16 medium; foot/pants adjacency evidence |
| **P0 contact** | Cross avatar was floating above curved lotus; earlier waist had a breathing gap | Smooth lower áo bà ba waist-to-trouser junction at all five 2s idle stages, proper SeatRoot support on ORIGINAL curved leaf; avoid kneel float/sink too | Both poses TRUE left/right LOW SIDE and under-3/4, body/leaf support patch report, no background waist hole at t=0/.5/1/1.5/2; real triangle/raycast if available |
| **P0 contract** | Runtime needs stable avatar/animation and gifts camera anchors | Male uses same glTF conventions & named anchors, clip keys/duration and palette names; distinct stable \`assetId\` for male cross/kneel | Real GLB node JSON and animation sampler checks, anchor transforms, per-variant material-map audit |
| **P0 art** | Clothing must stay áo bà ba, not generic monk tunic | Recognizable long sleeves, button placket, correct relaxed cloth folds and two-leg trouser silhouette; subtle men's tailoring, color variants | Cloth macro front/back/side, six actual glTF palette renders one geometry, none recolor hair/skin/eyes |
| **P1 cost** | Crowds appear under Sakura: cost/LOD matter | Keep mesh/material/draw calls within sensible female baseline; initial target **≤1.25× female triangle count per matching pose** or justify additional geometry. Reuse shared materials and avoid six geometry copies | Measured bytes/verts/tris/mesh count per pose and variants; if exceeding budget explain P0 art need/possible later ECO LOD. NO fabricated FPS or VRAM numbers |
| **P1 9:16** | Actual audience on TikTok LIVE sees avatar small and during close-up gift focus | Hair, prayer hands, distinctive male face readable in medium and close 720×1280, no clipping by name/FX anchor (test anchor overlay in Blender as diagnostic) | Real Blender Cycles **medium + close 9:16 for both poses** with reference female same framing |

**Explicit hard failures:** missing truly importable GLB; source not editable/reproducible; only generated PNGs; palms not facing; hair long/female ponytail or sharp polygon helmet; disconnected knees/ankles; torso/waist open under breath; floating/penetrating lotus; missing six named variants or animation anchors; evidence falsely labeled Cycles; original female/kneel/pad overwritten.

**Art policy:** create one coherent new male identity, using real female 3D meshes/Blender as style and topology reference where lawful; **do not clone female head unchanged and hide hair**. A restrained male scalp/short-hair silhouette, subtle facial features and mild tailoring difference suffice. No new identity of real people. Zero-cost Blender and open-source Python, no paid 3D generator without owner authorization.

## 5. Mandatory four phases (Sakura style)

### Phase 1 — Compare female references, propose actual male form and invariants (NO production PASS yet)
- Fetch PR #2 at actual HEAD, independently verify both female reference GLB SHA/bytes and chosen real P02 pad; load p5f female cross and p5c female kneel in Blender/gltf inspector and study exact meshes, anchor hierarchy, 2s clips and color variants. Reuse known same-camera girl reference PNGs; DO NOT rerender all already verified female Cycles without necessity.
- Measure female head/body/face/hair/shoulder/clothing/hand silhouette ratios and root/anchor transforms; define a **male target ratio table** (measured values not guessed numbers). Proposed hair shape: short neat side-part/crop with scalp/ear/nape clearance; create a readable hair silhouette plan from FRONT/LEFT/RIGHT/BACK. Define modest male face / shoulder / blouse tailoring differences and true cross/kneel foot support.
- Write \`p6a/P06A_PHASE_A_FINDINGS.md\` with **SA issue / female reference / planned actual male geometric modification / unchanged contract / proof camera / expected cost**, compare the two accepted female poses, and exact file hashes. Record unavailable source/binary as \`BLOCKED\` (do not pretend a concept is a GLB).
- No need to ask owner a new ungrounded design question; use conservative style choice and hand off both real poses for SA and owner gate.

### Phase 2 — Create TWO real male poses with editable Blender sources
- Produce independently usable:
  - \`p6a/meditator_male_cross_prayer_p06a.glb\`
  - \`p6a/meditator_male_kneel_prayer_p06a.glb\`
- Both GLBs share **one male identity** (same face/head, hair material/style, clothes and skin definition) and differ ONLY where necessary for torso-to-leg pose, waist/seat contact and pose-specific idle. No haphazard change of face or hair between kneel and cross. Provide genuine \`.blend\` actor sources and deterministic Blender/Python exporter + SHA-locked original inputs.
- Use original frozen lotus without editing it. For cross pose, apply lessons from P0.5f: 2+ legitimate underside trouser/leg support regions, a modest visible foot, and a believable lowered garment seam throughout 0..16mm upper-body breathing. For kneel pose, knees and folded shins/feet naturally support weight; no gap through 5 stages. Do NOT bake arbitrary whole-model downward Y that silently changes runtime anchors.
- Hair: genuinely sculpted/retopologized short clean shape, softened partition where appropriate, short back; avoid duplicate long hair polygons hidden under the new cap (remove/correct source hair mesh cleanly).
- Clothing: six exact named \`KHR_materials_variants\`, one geometry set; preserve conventional local +Y/+Z and anchor names. Clip names must be \`sit_idle\` and \`cross_prayer_idle\` (cross) or \`sit_idle\` and \`kneel_prayer_idle\` (kneel); each 2s with 17 samples as female-compatible, same meaning of gentle breathing and stable seat. If tiny pose changes require authored keyframe transfer, document and validate.
- Use reusable mesh materials and appropriate versioned **assetId** \`chibi_male_cross_prayer_p06a\` and \`chibi_male_kneel_prayer_p06a\` (or exact contract-compatible identifiers, record chosen names). Provide anchor pose-space coordinates, world placement and rationale for male head/FX offsets.
- Do NOT spend credits on Meshy/Tripo/fal or paid stock; any external reference material must be documented with actual commercial-streaming license in \`LICENSE_AND_PROVENANCE.md\`.

### Phase 3 — Real exported GLB → Blender Cycles + objective tests (BOTH poses)
- **Re-import the ACTUALLY EXPORTED male GLBs into Blender** (not render of only in-memory procedural scene). Import real unmodified original lotus GLB with recorded actor-to-pad placement and rig; also import the exact two frozen female GLBs for same-camera style A/B. Render with same light/world, material, AgX 0EV and ~32 samples as female Cycles baseline (record any necessary version differences).
- **Male A and B actor-only core shots:** front; left/right 3/4; left/right true side; back; torso front/3/4; 9:16 medium and close.
- **Hair art evidence for BOTH pose variants:** front close, left side close, right side close, **full back close** and quarter, plus hair/no-head-clipping diagnostic from above. Demonstrate **short neat** appearance consistently; do not substitute unchanged female image.
- **Prayer hands BOTH:** hands macro front, left+right 3/4, true side + one labeled inner-palm geometry diagnostic; palm-facing normals/contact region/gap, hand vs chest/shirt/chin and cuff checks. Show actual five finger silhouette if readable and no fused rod fingers.
- **Leg/lotus BOTH:** cross knee/ankle/visible instep front/3/4/side, kneel both knee/foot/heel back/side; pair front, both 3/4, **TRUE low-side from both left/right**, under-3/4 and on frozen lotus. Check actual folded pant/knee foot-to-pad clearance and garment waist seam.
- **Phone evidence BOTH:** 720×1280 9:16 pair medium and close, front/3/4; one **same-camera side-by-side male vs female** for cross and kneel and one scale/anchor overlay diagnostic. Style must be family-matched, male must be distinguishable, not duplicate girl.
- **Idle** t=0, 0.5, 1.0, 1.5, 2.0 seconds on BOTH poses; at each, show close hands/hair side and waist seat contacts (low-side on lotus), verify gentle original breath (~0/8/16/8/0mm) without clipping, hand separation, torso float, foot penetration or garment popping.
- **Machine-verifiable reports:** GLB2 header/import; exact SHA256/bytes/triangles/vertices/meshes/materials/assetId/6 variant maps and changed parts vs female; animation names/2s+17 samples, named anchors and source GLB SHA; actual foot/palm/seat contact numbers using real triangles/raycast (or mark \`PROXY_ONLY\` for finite-vertex/screen comparisons); no confident "exact collision PASS" from approximate proxies.
- **Evidence package:** per-case \`case_report.json\` with source GLB SHA256, Blender version/engine Cycles settings, cameras/lighting/FOV, actual PNG bytes+SHA, actor and pair \`.blend\` bytes+SHA, stdout+stderr logs, real matched contact sheets, \`FILE_HASHES_SHA256.txt\`, valid archive ZIP with CRC test. Blender actual project/GLB must be editable. If Windows owner runs Cycles, document exact PowerShell commands (Blender \`--python-exit-code\` and exit propagation); mark cases \`PENDING_OWNER_RUN\` until true generated evidence uploaded.
- Do not claim native Three.js loading, 3050Ti 4GB / 3060 8GB FPS, LIVE Studio performance or measured crowd scale unless tested; mark \`NOT_RUN\`. High-quality hair should still anticipate many crowd avatars, but no GPU benchmarking in this art task.

### Phase 4 — Versioned PR #2 delivery, small-file push / owner-large-binary handoff, STOP
- **All new work in** \`Assets3D/Review/lotus_pad_chibi/p6a/\` on \`assets/lotus-pad-chibi-p0\` / PR #2 (no new PR needed unless owner/SA requests). Do not touch main directly from AI Visual.
- Deliver: \`README.md\`, \`P06A_PHASE_A_FINDINGS.md\`, \`P06A_STYLE_MATCH_REPORT.md\`, \`P06A_CAMERA_CONTRACT.json\`, \`P06A_VALIDATION.json\`, \`P06A_CONTACT_REPORT.json\`, \`P06A_CYCLES_AUDIT.md\`, \`asset_manifest.json\`, \`LICENSE_AND_PROVENANCE.md\`, \`BINARY_HANDOFF.md\`, deterministic Blender/Python sources and Windows runner; true male GLB x2, editable .blend actor+pair, Cycles PNGs + per-case reports and ZIP where available.
- **Commit and push small source/metadata/scripts**. Owner can push large binary \`.glb\`, \`.blend\`, PNG, ZIP afterward if necessary. Each pending binary must have exact intended path, real measured SHA-256, bytes, size/triangle stats, an owner PowerShell \`Get-FileHash -Algorithm SHA256\` command and \`pending_owner_upload\` status until remote bytes are actually checked. **Never claim a placeholder filename was uploaded/tested**.
- Preserve P0.5f cross female and P0.5c kneel originals, old task files and evidence. PR #2 remains DRAFT. Provide concise readable PR comment/table plus **exact new HEAD** and all changed paths. No force push, no cleanup of owner assets.
- After source+GLB+Cycles handoff, **STOP**: SA independently verifies, posts review, then owner explicitly approves both male cross and kneel separately. No merge or Codex/integration initiation based solely on AI Visual self-checks.

## 6. Explicit SA acceptance checklist (GO / NO-GO)

- [ ] Male has **neat short tidy hair** that reads front/3/4/both sides/back, no floating piece or hidden long female hair; consistent single male identity between two poses.
- [ ] Male matches female P0.5f/P0.5c in soft chibi style, scale and peaceful Buddhist prayer mood, yet differs meaningfully in hairstyle/face/blouse fit; same-camera female/male paired visual evidence.
- [ ] BOTH cross-legged and kneeling GLBs have genuine natural, inward-facing **palms touching gently**, rounded non-rod fingertips, wrists/cuffs soft, no clipping with chin or front garment.
- [ ] Male cross sits visibly on true lotus with natural instep and stable waist seam even at breath peak; kneel both knees/feet physically credible; no foot float/penetration. Low-side + underside shots supplied for BOTH.
- [ ] Vietnamese áo bà ba with recognizable buttons/top/trousers, exact six named glTF color variants without hair/skin recoloring or duplicating six actor meshes.
- [ ] Two real GLB glTF2 files and editable Blender/source; world/scale/+Y/+Z, SeatRoot/Head/Nameplate/FX/UpperBodyBreath anchors, sit_idle + pose-specific idle (2s, 17 keys); distinct stable male assetIds, valid materials.
- [ ] Full Cycles A/B matched cameras (male vs female) + 9:16 + hair macro front/left/right/back + five idle stages, PNG/GLB/blend hashes/bytes and truthful ZIP CRC/logs.
- [ ] SA can independently repeat checks using committed source or accurately identified owner-local binary prerequisites. All unsupported collision assertions marked \`PROXY_ONLY\`; unrun native Three/GPU/LIVE marked \`NOT_RUN\`.
- [ ] Original owner-approved female binaries and lotus not changed; PR #2 remains Draft, no male self-approval, Codex, integration, merge.
- [ ] **Final required code:** \`P06A_MALE_TWO_POSE_OWNER_REVIEW_REQUIRED\` until SA review and explicit OWNER approval of both male poses.

If any owner-visible issue is still present, mark \`ART_PARTIAL\` and request one focused subsequent revision (never claim the owner approved it). **One asset workstream, two male poses, one owner gate.**

## 7. Mandatory AI Visual return (Sakura format)

1. **SA requirement → actual geometry/pose/hair modification → independent test → REAL Cycles evidence → PASS/PARTIAL/BLOCKED/NOT_RUN** table, cross and kneel separately.
2. Tools/Blender versions, licenses/source provenance, genuinely zero paid cost if true.
3. Two male GLB paths, exact SHA256/bytes/triangles/vertices/mesh/material counts, animation+anchor/6-color maps and actual seat/palm/hair validation; female frozen SHA references.
4. Original/new matched Cycles male/female contact sheets at same camera, male front/side/back short hair macros, both 720×1280 9:16, 5-stage idle, actual editable .blend, per-case PNG SHA/logs/ZIP CRC.
5. Exact working feature branch, **new HEAD**, PR #2 URL, small file commits, exact owner large-binary pending list and reproducible Windows PowerShell commands.
6. Known limits (NOT_RUN / PROXY_ONLY), SA/owner decision requested and **STOP at \`P06A_MALE_TWO_POSE_OWNER_REVIEW_REQUIRED\`**. **No Codex, integration, runtime GPU/LIVE or merge.**