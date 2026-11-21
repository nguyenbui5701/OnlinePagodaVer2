# Sakura Hero R12 — owner Cycles evidence, SA independently reviewed 2026-11-21

Source: [SA R12 independent review #6004186709](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/1#pullrequestreview-6004186709). **Owner-executed Blender/Cycles R12 import/render PASS, asset ART PARTIAL, production NOT APPROVED.** This note records independent reviewer conclusions; the original owner's evidence ZIP/.blend files were not uploaded to this PR by this update.

## Direct evidence SA inspected

- Original owner `Sakura_R12_Blender_Evidence_Cycles.zip`: **16,152,983 bytes**, SHA-256 **`006984dd319f75389c73bfa92b63fb51366603eb43833af33044dc450f117647`**; ZIP CRC PASS; **34/34 physical members** matched their SHA-256 list.
- Four Cycles cases `r10_palette_only`, `r11_final`, `r12_final`, `eco`: **4/4 completed**; **20/20 rendered PNG** file size/hash matches case JSON. Four stdout logs (UTF-16) include `[R12_CYCLES_COMPLETED]`; four stderr logs empty.
- Blender **4.5.16 LTS**, **Cycles CPU**, **32 samples**, **AgX**, exposure **0 EV**, World strength **0.65**, **three fixed SUN lamps** (KEY 2.10 / RIM 1.05 / LOWER 0.72), glTF +Y to Blender +Z camera transform, fixed FOV and 5 poses/case (including cropped 9:16 aerial).
- Original QUALITY editable `sakura_hero_r12_quality.blend`: **12,890,180 bytes**, SHA `c74f9f9d5a0b7722c080f0bdd33eeca3d36f513dba7b9739ee9ac33a8ac7da83`. ECO `sakura_hero_r12_eco.blend`: **3,936,772 bytes**, SHA `8a4c73638aeab834fd1a1432b85960f0f04b2f09cf1730889318373a3985a7c7`. Both matched corresponding case JSON and internal ZIP bytes.
- SA separately parsed full `BLENDER-v405` binary block streams (QUALITY 2250 blocks/11 meshes/16 objects; ECO 2155 blocks/10 meshes/15 objects), valid `DNA1` + `ENDB`, no trailing bytes; **not** a second actual GUI rerender by SA.
- Actual GLB source SHA referenced by owner JSON: QUALITY `0e1f656c74a3f7860cb640395d95cebdb852d7e1269f1463e04408aa6bc8bb25`, ECO `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`.
- SA visual finding: R12 soft/irregular layered crown visibly improves over R11, 35.31% QUALITY bytes saved with warm R11 palette preserved. Remaining sharp/speckled petal patches, dark openings, crossing branch tubes / exposed roots, and cropped 9:16 aerial. **Visual ART PARTIAL.**

## Important delivery/gate distinctions

**R12 model GLBs, owner ZIP, original editable .blend bytes and preview media remain `pending_owner_upload` in the PR branch** unless separately uploaded and SHA-checked there. This is not the same thing as an unexecuted Blender test. Blender executed and SA verified the source archives outside GitHub, while native Three.js GLTFLoader, RTX 3050 Ti/3060 FPS/VRAM with TikTok LIVE Studio, and production acceptance remain **NOT RUN / NOT APPROVED**.

R13 addresses sculpture and framing in a separate directory; original R12 source/models/scripts remain unchanged.
