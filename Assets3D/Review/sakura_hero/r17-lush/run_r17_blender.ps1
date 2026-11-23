# R17 original art, 0-VND native owner-run Blender build + matched Cycles A/B
# Run PowerShell from within Assets3D/Review/sakura_hero/r17-lush on its own worktree.
param(
    [string]$Blender = "",
    [switch]$SkipRender
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root "..\r16"
$target = Join-Path $root "author_r17_blender.py"
if (!(Test-Path -LiteralPath $target -PathType Leaf)) {
    throw "R17_SCRIPT_NOT_FOUND $target"
}
$required = @(
    @{ File="sakura_hero.glb"; Bytes=5055232; SHA="c8db96966410bf34c9be2cbdce887bee3b051beab5c9dd4c2a3b99875dbb938c" },
    @{ File="sakura_hero_eco.glb"; Bytes=1393492; SHA="accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173" }
)
foreach ($entry in $required) {
    $path = Join-Path $source $entry.File
    if (!(Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "R17_SOURCE_BLOCKED_MISSING_R16_GLB $path"
    }
    $size = (Get-Item -LiteralPath $path).Length
    $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
    if (($size -ne [long]$entry.Bytes) -or ($hash -ne $entry.SHA)) {
        throw "R17_SOURCE_BLOCKED_R16_HASH_MISMATCH $($entry.File): $size $hash"
    }
    Write-Output "R17_R16_ORIGINAL_SHA_PASS $($entry.File) $size $hash"
}
if (!$Blender) {
    $command = Get-Command blender -ErrorAction SilentlyContinue
    if ($command) { $Blender = $command.Source }
    elseif (Test-Path "C:\Program Files\Blender Foundation") {
        $Blender = Get-ChildItem "C:\Program Files\Blender Foundation" -Filter blender.exe -Recurse -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty FullName
    }
}
if (!$Blender) { throw "R17_BLENDER_NOT_FOUND: pass -Blender C:\path\blender.exe" }
$exe = (Get-Command -Name $Blender -ErrorAction Stop).Source
$logs = Join-Path $root "R17_Cycles_Evidence"
New-Item -ItemType Directory -Path $logs -Force | Out-Null
$stdout = Join-Path $logs "blender_stdout.log"
$stderr = Join-Path $logs "blender_stderr.log"
$args = @('--background','--python-exit-code','17','--python',('"{0}"' -f $target),'--')
if ($SkipRender) { $args += '--skip-render' }
Write-Output "R17_BLENDER_START $exe"
$p = Start-Process -FilePath $exe -ArgumentList $args -Wait -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
$exit = [int]$p.ExitCode
Write-Output "R17_BLENDER_EXIT_CODE=$exit"
if ($exit -ne 0) {
    if (Test-Path $stdout) { Get-Content -LiteralPath $stdout -Tail 50 }
    if (Test-Path $stderr) { Get-Content -LiteralPath $stderr -Tail 100 }
    throw "R17_NATIVE_BLENDER_FAILED $exit; logs: $stdout $stderr"
}
$report = Join-Path $root 'R17_BUILD_RESULT.json'
if (!(Test-Path $report)) { throw "R17_BUILD_REPORT_MISSING" }
$obj = Get-Content -LiteralPath $report -Raw | ConvertFrom-Json
if ($obj.gate -ne 'R17_SA_ART_REVIEW_REQUIRED') { throw "R17_WRONG_GATE" }
foreach ($profile in @('quality','eco')) {
    $name = if ($profile -eq 'quality') { 'sakura_hero_r17.glb' } else { 'sakura_hero_r17_eco.glb' }
    $file = Join-Path $root $name
    if (!(Test-Path $file)) { throw "R17_MISSING_EXPORT $file" }
    $sha = (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
    $expectedSha = $obj.r17.$profile.sha256
    if ($sha -ne $expectedSha) { throw "R17_OUTPUT_SHA_MISMATCH $name" }
    Write-Output "R17_EXPORTED_SHA_PASS $name $sha"
}
$blend = Join-Path $root 'sakura_hero_r17_editable.blend'
if (!(Test-Path $blend)) { throw "R17_EDITABLE_BLEND_MISSING" }
$blendHash = (Get-FileHash -LiteralPath $blend -Algorithm SHA256).Hash.ToLowerInvariant()
if ($blendHash -ne $obj.editableSource.sha256) { throw "R17_BLEND_SHA_MISMATCH" }
Write-Output "R17_EDITABLE_BLEND_SHA_PASS $blendHash"
if (-not $SkipRender) {
    $images = @(Get-ChildItem -LiteralPath $logs -Filter '*_cycles.png' -File)
    if ($images.Count -ne 24) { throw "R17_CYCLES_EXPECTED_24_ACTUAL_$($images.Count)" }
    if ($obj.cycles.count -ne 24) { throw "R17_CYCLES_REPORT_COUNT_MISMATCH" }
    Write-Output "R17_CYCLES_NATIVE_EVIDENCE_24_CREATED"
} else {
    Write-Output "R17_CYCLES_PENDING_NOT_RUN"
}
Write-Output "R17_LOCAL_SOURCE_BUILD_VERIFIED_OWNER_MUST_UPLOAD"
Write-Output "R17_SA_ART_REVIEW_REQUIRED"
