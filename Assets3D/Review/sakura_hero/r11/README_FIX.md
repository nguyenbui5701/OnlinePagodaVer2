# Sakura Hero R11 Windows launcher bugfix

PowerShell variable names are case-insensitive. The original launcher used `$home` for the Blender installation directory; `$HOME` is a built-in read-only automatic variable. This update renames those three references to `$blenderInstallDir` both in the launcher and in the source generator. No GLBs or Blender materials are changed.

Copy `run_sakura_R11_blender.ps1` into your existing `r11` folder and replace the previous launcher. Optionally copy `make_windows_launcher.py` there too so future regeneration stays fixed.

Run quick (from `r11` in PowerShell):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run_sakura_R11_blender.ps1 -Mode quick -Samples 8 -Size 320
```

If Blender is not detected, add `-BlenderPath` with the full executable path. This fix is source-level/static checked only; the user Windows Blender run remains the execution test.
