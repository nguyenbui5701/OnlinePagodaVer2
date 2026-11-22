# AI Visual 13 — P0.7a GENTLE MALE UNDERCUT — ADDITIVE HAIR OPTION (BOTH POSES)

**AUTHORITATIVE SA task:** [AI_VISUAL_13_MALE_UNDERCUT_VARIANT_P07A](https://github.com/nguyenbui5701/OnlinePagodaVer2/blob/main/Task/AI_VISUAL_13_MALE_UNDERCUT_VARIANT_P07A.md); mandatory Rules Design/07, original source PR #2 DRAFT branch `assets/lotus-pad-chibi-p0` baseline exact HEAD `91bbfd5fa2a98894a096d7a60426ca62fe720c96`. Owner has accepted P0.6c and it is NOT REPLACED. **P0.7b side part 7/3 is OUT OF SCOPE.**

## GENUINE newly sculpted production GLB2 outputs (already uploaded to PR branch)
| Output (in this p7a folder) | Actual SHA256 / bytes | Whole model |
|---|---|---|
| `meditator_male_cross_prayer_undercut_p07a.glb` | `72c407bf3b6ae8a6edc8ed9a0e544168db7edcac379a8ea92b9677cceed00107` / **590,124 B** | 18,380 tris, 9,469 verts, 10 meshes |
| `meditator_male_kneel_prayer_undercut_p07a.glb` | `e7f86beb4cd43f899c57922c0e34c94020e93dc007c6b9f5094b2757363960da` / **456,540 B** | 18,420 tris, 9,485 verts, 9 meshes |

**What is visibly different physically:** original P06c closed hair shell retained, crown lifted mean **+10.45mm**, both temples reduced **−16.77mm**, neat nape reduced **−16.82mm**; 3 existing rounded swept hair directions stay attached. No bald skin-fade, no material repaint or artificial 2D cards. Only old hair mesh #6 positions/normals change; 1,672 hair vertices/3,080 triangles remain, hair material index6 reused. Face/ears/eyes/two original eyebrow tubes/skin/prayer hands/ao ba ba 6 colors/palms/feet/body/animation/anchors untouched.

**Real strict bytes:** each original SHA-pinned approved P06c male GLB read and reexported, all nonhair primitive POSITION/NORMAL/INDICES and animation sampler input/output bytes compared EXACT. Original 208 eyebrow vertices+normals+face index range bit exact, original hair indices bit exact, old 21 materials and 6 named `KHR_materials_variants` unchanged. Exact same new hair POS/NORMAL/INDEX bytes shared by both male poses. Two clips per actor 2.0s, 17 keyframes each; five original anchors intact. No new drawcall/material/triangle. Full independent `P07A_VALIDATION.json`.

**Physical scalp check:** triangulated head mesh #3 / actual hair mesh #6 sampled ray classification: original P06c 0/1591 cap penetrations vs new P07a 0/1575, original min +8.083mm and new min +8.083mm on the filtered upper front+top samples; 567 three sweep points min +6.606mm→+7.0mm. Original + new front/top/right3Q/L/R/back camera ray samples skin-first=0. **SAMPLED_PROXY ONLY** for the continuous surface and render outcome; see `P07A_SCALP_COVERAGE_REPORT.json` and runnable `validate_p07a_glb_rays.mjs`.

## Actual Blender authoring / Cycles status
Editable Blender *SOURCE* `blender_p07a_cycles.py`, owner 8-case runner `run_p07a_blender.ps1`, and real ZIP CRC validator `validate_p07a_zip_crc.py` are committed. **Blender executable is unavailable here; no NEW p7a .blend, Cycles PNG, stdout/stderr, ZIP or ZIP CRC was actually generated; all status `PENDING_OWNER_RUN`.** Existing owner genuine P06c Cycles from baseline exist and were inspected. P07a style has NOT been visually approved. The runner reimports both actual approved P06c and actual new P07a into exact same Cycles rig, generates original new editable .blend in two poses x actor/pair, PNG 9:16 medium+close, front/top/side/back/3⁄4/low-back/ear macros, five native idle times, logs+real hashes+ZIP CRC on Windows. Read `README_WINDOWS.md` and `BINARY_HANDOFF.md`.

**Workflow STOP:** `P07A_MALE_UNDERCUT_SA_REVIEW_REQUIRED`; SA independently checks true p7a Cycles and artifacts then owner explicitly approves both poses. **NO SIDE PART 7/3, NO CODEX, NO INTEGRATION, NO GPU/LIVE, NO MERGE. ZERO PAID SERVICES / 0 VND.**
