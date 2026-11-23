# P0.7a1 owner-run Blender Cycles evidence (Windows PowerShell)

**Only execute with a clean up-to-date working copy of the existing Draft PR #2 branch** `assets/lotus-pad-chibi-p0`. Do not edit p6c, p7a, main, V1 or Codex. The GLB files are already on PR; all Blender/Cycles outputs are pending until these commands execute.

```powershell
git fetch origin
git switch assets/lotus-pad-chibi-p0
git pull --ff-only origin assets/lotus-pad-chibi-p0
cd Assets3D/Review/lotus_pad_chibi/p7a1
node .\build_male_undercut_p07a1.mjs cross
node .\build_male_undercut_p07a1.mjs kneel
node .\validate_p07a1_glb_rays.mjs
.\run_p07a1_blender.ps1 -Mode all -Samples 32 -Size 720
```

Or supply `-BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe'` if Blender is not auto-detected. Node 22+ and Blender 4.5+ recommended. The script SHA-pins both actual P06c GLBs, both P07a1 GLBs and frozen P0.2 lotus. It performs 8 real GLB→Blender cases: P06c / P07a1 × cross / kneel × actor / lotus. `Mode all` provides matched front/top/profile/3Q/back/low-back/ear macro shots, 720×1280 9:16 medium and close in both poses, and five animation timestamps for P07a1; 32 CPU Cycles samples, AgX EV0, three sun lights, same cameras. Four new editable .blend files, per-case JSON and SHA256 of PNGs, stdout/stderr, a ZIP and ZIP CRC are required. The script does not reuse source-only beauty renders as if reimports.

**Before uploading:** verify full runner exits successfully; look for `[P07A1_ZIP_CRC_PASS]` in `P07A1_ZIP_CRC_stdout.log` and actual image files. In this same folder, push `P07A1_Cycles_Evidence/`, `P07A1_UNDERCUT_Blender_Cycles_Evidence.zip`, and `P07A1_ZIP_CRC_stdout.log` (+ stderr) to the existing PR branch. If files are too big for ordinary GitHub push, follow the repository's owner binary handoff policy. Do not overwrite historic P07a evidence. After upload, SA must re-check binary, original cases and art before owner can approve. STOP before side part 7/3, Codex, integration or merge.
