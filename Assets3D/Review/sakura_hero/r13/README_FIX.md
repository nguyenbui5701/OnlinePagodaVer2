# Sakura R13 — Windows Blender traceback/import hotfix

Replace exactly TWO files in your r13 directory: blender_ab_validate_r13.py and run_sakura_R13_blender.ps1. All R12/R13 GLBs remain untouched.

1. Blender Python adds the local directory to sys.path before importing blender_reference_rig_r10 (matching the previously working R12 test).
2. PowerShell 5.1 uses ErrorActionPreference=Continue ONLY during the Blender native process call so stderr does not become a terminating NativeCommandError; preference is restored afterward.
3. --python-exit-code 97 makes real Blender Python exceptions fail with nonzero exit code; launcher prints the last 80 lines of stderr and last 50 lines of stdout and will not falsely mark a failure as PASS.

Before rerun, save your prior failing log if needed: Blender_Evidence_R13/r12_baseline_stderr.log. Launcher removes that output directory at start of a new test.

PowerShell in the R13 folder:

powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R13_blender.ps1 -Mode quick -Samples 8 -Size 320

If full traceback still appears, send the printed lines or file Blender_Evidence_R13\r12_baseline_stderr.log / r13_final_stderr.log. Do not infer a Blender PASS until actual images and reports complete.
