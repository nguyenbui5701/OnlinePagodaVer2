# P0.12-B owner-run free Blender Cycles evidence. PowerShell 5.1+.
# From repository root:
# & .\Assets3D\Review\lotus_botanicals\p012b\run_p012b_blender.ps1
# Use -Blender 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe' if not on PATH.
param(
    [string]$Blender = 'blender',
    [string]$P02 = ''
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $P02) { $P02 = Join-Path $root '..\..\lotus_pad_chibi\p0.2\lotus_pad_01.glb' }
$P02 = (Resolve-Path -LiteralPath $P02 -ErrorAction Stop).Path
$manifest = Get-Content -LiteralPath (Join-Path $root 'asset_manifest.json') -Raw | ConvertFrom-Json
foreach ($asset in $manifest.assets) {
    $file = Join-Path $root $asset.filename
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) { throw "Missing GLB $file" }
    $size = (Get-Item -LiteralPath $file).Length
    $hash = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
    if (($size -ne [long]$asset.bytes) -or ($hash -ne $asset.sha256)) { throw "P012B_HASH_MISMATCH $file" }
    Write-Output "P012B_GLB_SHA_PASS $($asset.filename) $size $hash"
}
$p02Hash = (Get-FileHash -LiteralPath $P02 -Algorithm SHA256).Hash.ToLowerInvariant()
if ($p02Hash -ne $manifest.baseline.p02PadSHA256) { throw 'P012B_P02_BASELINE_HASH_MISMATCH' }
Write-Output "P012B_P02_SHA_PASS $p02Hash"
$evidence = Join-Path $root 'P012B_Cycles_Evidence'
New-Item -Path $evidence -ItemType Directory -Force | Out-Null
$log = Join-Path $evidence 'blender_cycles_console.log'
$script = Join-Path $root 'blender_cycles_p012b.py'
& $Blender --background --python $script -- --assets $root --p02 $P02 2>&1 | Tee-Object -FilePath $log
if ($LASTEXITCODE -ne 0) { throw "P012B_BLENDER_EXIT_FAILURE $LASTEXITCODE; see $log" }
$blend = Join-Path $root 'P012B_botanicals_editable.blend'
if (-not (Test-Path -LiteralPath $blend -PathType Leaf)) { throw 'P012B_BLEND_NOT_CREATED' }
$pngs = @(Get-ChildItem -LiteralPath $evidence -Filter '*.png' -File)
if ($pngs.Count -ne 20) { throw "P012B_CYCLES_PNG_COUNT_EXPECTED_20_ACTUAL_$($pngs.Count)" }
$shaList = Join-Path $evidence 'owner_sha256.txt'
$files = @((Get-Item -LiteralPath $blend)) + $pngs
$lines = foreach ($f in $files) {
  $hash = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  "$hash  $($f.FullName)"
}
$lines | Set-Content -LiteralPath $shaList -Encoding UTF8
Write-Output "P012B_CYCLES_NATIVE_IMAGES_PASS $($pngs.Count)"
Write-Output "P012B_BLEND_CREATED $blend"
Write-Output "P012B_LOG $log"
Write-Output "P012B_SHA_LIST $shaList"
Write-Output 'P012B_SA_ART_REVIEW_REQUIRED'
