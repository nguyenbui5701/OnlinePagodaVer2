# Run only quick R17b preview. Never calls full generator or final render.
param([string]$Blender = "")
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (!$Blender) {
    $cmd = Get-Command blender -ErrorAction SilentlyContinue
    if ($cmd) { $Blender = $cmd.Source }
    else {
        $Blender = Get-ChildItem "C:\Program Files\Blender Foundation" -Filter blender.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    }
}
if (!$Blender -or !(Test-Path -LiteralPath $Blender -PathType Leaf)) { throw "R17B_BLENDER_NOT_FOUND" }
$script = Join-Path $root "author_r17b_preview.py"
$out = Join-Path $root "preview"
New-Item -ItemType Directory -Path $out -Force | Out-Null
$stdout = Join-Path $out "blender_preview_stdout.log"
$stderr = Join-Path $out "blender_preview_stderr.log"
$manifest = Join-Path $out "preview_manifest.json"
if (Test-Path -LiteralPath $manifest) { Remove-Item -LiteralPath $manifest }
$p = Start-Process -FilePath $Blender -ArgumentList @('--background','--python-exit-code','17','--python',('"{0}"' -f $script)) -Wait -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
if ($p.ExitCode -ne 0) { Get-Content -LiteralPath $stderr -Tail 100; Get-Content -LiteralPath $stdout -Tail 30; throw "R17B_PREVIEW_FAILED $($p.ExitCode)" }
if (!(Test-Path -LiteralPath $manifest)) { throw "R17B_PREVIEW_MANIFEST_MISSING" }
$m = Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json
if ($m.status -ne 'R17B_PREVIEW_READY_OWNER_SA_VISUAL_REVIEW_PENDING' -or $m.images.Count -ne 18) { throw "R17B_WRONG_PREVIEW_STATE" }
foreach ($profile in @('quality','eco')) {
    $a = $m.candidate.$profile
    $path = Join-Path $out $a.file
    if ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $a.sha256) { throw "R17B_CANDIDATE_SHA_MISMATCH $profile" }
}
Write-Output "R17B_PREVIEW_COMPLETE 18 PNG; NO FINAL CYCLES"
Write-Output "R17_SA_ART_REVIEW_REQUIRED"
