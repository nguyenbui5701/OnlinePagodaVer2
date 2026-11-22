# OnlinePagodaVer2 — P0.7a1 undercut art refinement

Created as a NON-DESTRUCTIVE source-and-binary revision for SA Review blocker #6012036137, Draft PR #2 branch `assets/lotus-pad-chibi-p0`. **No art self-approval.**

Two actual glTF2 binary GLBs are included with SHA256 recorded in `asset_manifest.json`. They differ from P0.7a only in hair mesh #6 POSITION/NORMAL and corresponding hair naming/bounds/provenance metadata; no changes to face/body/skin/eyebrows/clothes/colors, lotus, scene, animations, anchor transforms, female or Sakura. One canonical hair identical in both poses. Rebuild with Node.js 22+: `node build_male_undercut_p07a1.mjs cross` and `node build_male_undercut_p07a1.mjs kneel` (from this folder with pristine p7a inputs).

**Technical gate:** actual binary GLB2 parse, SHA256 and frozen nonhair/accessor checks: `P07A1_VALIDATION.json`. No new hair drawcalls (one hair primitive); 0 VND paid services. **Art gate:** `NOT_RUN` Blender/Cycles; no editable .blend, 9:16 evidence, 5-time idle animation screenshots or CRC claimed. Exact matched old/new A/B and owner run still required before SA PASS. STOP FOR SA REVIEW; no side part 7/3, Codex, integration, GPU/LIVE or merge.
