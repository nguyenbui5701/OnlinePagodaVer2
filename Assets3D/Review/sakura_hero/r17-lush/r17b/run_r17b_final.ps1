# R17b final evidence only. No preview generator, no GLB export.
param([string]$Blender = "")
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $root
if ((git branch --show-current).Trim() -ne 'assets/sakura-hero-r17-lush') { throw "R17B_WRONG_BRANCH" }
if (!$Blender) {
    $cmd = Get-Command blender -ErrorAction SilentlyContinue
    if ($cmd) { $Blender = $cmd.Source }
    else { $Blender = Get-ChildItem "C:\Program Files\Blender Foundation" -Filter blender.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName }
}
if (!$Blender -or !(Test-Path -LiteralPath $Blender -PathType Leaf)) { throw "R17B_BLENDER_NOT_FOUND" }
$python = Get-Command py -ErrorAction Stop
& $python.Source -c "from PIL import Image"
if ($LASTEXITCODE -ne 0) { throw "Pillow required: py -m pip install Pillow" }
$out = Join-Path $root 'final'
New-Item -ItemType Directory -Path $out -Force | Out-Null
foreach ($marker in @('final_manifest.json','owner_sha256.txt','R17B_FINAL_RESULT.json','blender_exit_code.txt')) {
    $file = Join-Path $out $marker
    if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file }
}
$stdout = Join-Path $out 'blender_final_stdout.log'
$stderr = Join-Path $out 'blender_final_stderr.log'
$script = Join-Path $root 'render_r17b_final.py'
$p = Start-Process -FilePath $Blender -ArgumentList @('--background','--python-exit-code','17','--python',('"{0}"' -f $script)) -Wait -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
if ($p.ExitCode -ne 0) {
    Get-Content -LiteralPath $stderr -Tail 100
    Get-Content -LiteralPath $stdout -Tail 30
    throw "R17B_FINAL_BLENDER_FAILED $($p.ExitCode)"
}
Set-Content -LiteralPath (Join-Path $out 'blender_exit_code.txt') -Value 'R17B_FINAL_BLENDER_EXIT_CODE=0' -Encoding ascii
Write-Output 'R17B_FINAL_BLENDER_EXIT_CODE=0'
& $python.Source (Join-Path $root 'make_r17b_final_sheets.py')
if ($LASTEXITCODE -ne 0) { throw "R17B_FINAL_SHEETS_FAILED" }
if (!(Test-Path -LiteralPath (Join-Path $out 'final_manifest.json'))) { throw "R17B_FINAL_MANIFEST_MISSING" }
$m = Get-Content -LiteralPath (Join-Path $out 'final_manifest.json') -Raw | ConvertFrom-Json
if ($m.cycles.count -ne 24 -or $m.cycles.r17bCount -ne 12 -or $m.sheetCount -ne 6) { throw "R17B_FINAL_COUNT_MISMATCH" }
Write-Output "R17B_FINAL_EVIDENCE_READY_OWNER_UPLOAD"
Write-Output "R17_SA_ART_REVIEW_REQUIRED"
