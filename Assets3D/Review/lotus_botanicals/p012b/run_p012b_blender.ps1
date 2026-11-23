# P0.12-B owner-run Cycles evidence (Windows PowerShell 5.1+).
# All output is captured to files; Blender stderr must not be swallowed by PS ErrorActionPreference='Stop'.
# Run from project root: & .\Assets3D\Review\lotus_botanicals\p012b\run_p012b_blender.ps1 -Blender 'C:\path\to\blender.exe'
param(
    [string]$Blender = 'blender',
    [string]$P02 = '',
    [switch]$ContextOnly
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
$stdoutLog = Join-Path $evidence 'blender_cycles_stdout.log'
$stderrLog = Join-Path $evidence 'blender_cycles_stderr.log'
$script = Join-Path $root 'blender_cycles_p012b.py'
$beforeIsolated = @{}
if ($ContextOnly) {
    $prior = Join-Path $evidence 'cycles_manifest.json'
    if (-not (Test-Path -LiteralPath $prior)) { throw 'P012B_CONTEXT_ONLY_REQUIRES_COMPLETED_20_IMAGE_EVIDENCE' }
    $priorEntries = Get-Content -LiteralPath $prior -Raw | ConvertFrom-Json
    $priorIsolated = @($priorEntries | Where-Object { $_.file -match '^(bloom|bud)_(quality|eco)_(front|side|three_quarter|elevated)_cycles\.png$' })
    if ($priorIsolated.Count -ne 16) { throw 'P012B_CONTEXT_ONLY_REQUIRES_16_ISOLATED_SHAS' }
    foreach ($f in $priorIsolated) { $beforeIsolated[$f.file] = $f.sha256 }
}
if (-not (Test-Path -LiteralPath $script -PathType Leaf)) { throw "P012B_SCRIPT_NOT_FOUND $script" }

# Start-Process redirects both native streams to files, so a Python traceback
# cannot trigger a premature PowerShell NativeCommandError.
$executable = (Get-Command -Name $Blender -ErrorAction Stop).Source
$blenderArgs = @(
    '--background',
    '--python-exit-code', '17',
    '--python', ('"{0}"' -f $script),
    '--',
    '--assets', ('"{0}"' -f $root),
    '--p02', ('"{0}"' -f $P02)
)
if ($ContextOnly) { $blenderArgs += '--context-only' }
$processStartUtc = (Get-Date).ToUniversalTime()
Write-Output "P012B_BLENDER_START $executable"
Write-Output "P012B_BLENDER_STDOUT $stdoutLog"
Write-Output "P012B_BLENDER_STDERR $stderrLog"
$process = Start-Process -FilePath $executable -ArgumentList $blenderArgs -Wait -PassThru -NoNewWindow -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog
$exitCode = [int]$process.ExitCode
$stdoutText = if (Test-Path -LiteralPath $stdoutLog) { Get-Content -LiteralPath $stdoutLog -Raw } else { '' }
$stderrText = if (Test-Path -LiteralPath $stderrLog) { Get-Content -LiteralPath $stderrLog -Raw } else { '' }

@(
    "P012B_BLENDER_EXIT_CODE=$exitCode"
    "P012B_BLENDER_EXECUTABLE=$executable"
    "P012B_BLENDER_SCRIPT=$script"
    '===== STDOUT ====='
    $stdoutText
    '===== STDERR ====='
    $stderrText
) | Set-Content -LiteralPath $log -Encoding UTF8

if ($exitCode -ne 0) {
    Write-Output 'P012B_BLENDER_FAILED — last 60 lines of stdout:'
    if (Test-Path -LiteralPath $stdoutLog) { Get-Content -LiteralPath $stdoutLog -Tail 60 }
    Write-Output 'P012B_BLENDER_FAILED — last 120 lines of stderr / traceback:'
    if (Test-Path -LiteralPath $stderrLog) { Get-Content -LiteralPath $stderrLog -Tail 120 }
    throw "P012B_BLENDER_EXIT_FAILURE $exitCode; full traceback at $stderrLog; combined log $log"
}

# A previous successful run must not be mistaken for fresh evidence.
$blend = Join-Path $root 'P012B_botanicals_editable.blend'
if (-not (Test-Path -LiteralPath $blend -PathType Leaf)) { throw 'P012B_BLEND_NOT_CREATED' }
$blendFile = Get-Item -LiteralPath $blend
if ($blendFile.LastWriteTimeUtc -lt $processStartUtc.AddSeconds(-2)) { throw 'P012B_BLEND_STALE_FROM_PREVIOUS_RUN' }
$pngs = @(Get-ChildItem -LiteralPath $evidence -Filter '*.png' -File)
if ($pngs.Count -ne 20) { throw "P012B_CYCLES_PNG_COUNT_EXPECTED_20_ACTUAL_$($pngs.Count)" }
if ($ContextOnly) {
    $contextNames = @(
        'p02_scale_context_quality_720x1280_cycles.png',
        'p02_scale_context_eco_720x1280_cycles.png',
        'water_level_low_quality_720x1280_cycles.png',
        'aerial_quality_720x1280_cycles.png'
    )
    $stalePngs = @($pngs | Where-Object { ($contextNames -contains $_.Name) -and $_.LastWriteTimeUtc -lt $processStartUtc.AddSeconds(-2) })
    if ($stalePngs.Count -ne 0) { throw "P012B_STALE_CONTEXT_PNG_COUNT_$($stalePngs.Count)" }
    foreach ($filename in $beforeIsolated.Keys) {
        $oldSha = $beforeIsolated[$filename]
        $newSha = (Get-FileHash -LiteralPath (Join-Path $evidence $filename) -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($newSha -ne $oldSha) { throw "P012B_ISOLATED_SHA_CHANGED $filename" }
    }
    if (-not $stdoutText.Contains('P012B_CONTEXT_ONLY_FINISHED 4 PNG')) { throw "P012B_CONTEXT_COMPLETION_MARKER_MISSING; see $log" }
    if (-not $stdoutText.Contains('P012B_16_ISOLATED_CYCLES_PRESERVED_SHA_PASS')) { throw "P012B_ISOLATED_SHA_GUARD_MARKER_MISSING; see $log" }
    $projectedCount = ([regex]::Matches($stdoutText,'P012B_CONTEXT_PROJECTED_THREE_SUBJECTS_PASS')).Count
    if ($projectedCount -ne 4) { throw "P012B_CONTEXT_PROJECTION_PASS_EXPECTED_4_ACTUAL_$projectedCount" }
    Write-Output 'P012B_FOUR_CONTEXT_FRAMES_RERENDERED_AND_PROJECTED_PASS'
    Write-Output 'P012B_16_ISOLATED_CYCLES_SHA_UNCHANGED_PASS'
} else {
    $stalePngs = @($pngs | Where-Object { $_.LastWriteTimeUtc -lt $processStartUtc.AddSeconds(-2) })
    if ($stalePngs.Count -ne 0) { throw "P012B_CYCLES_STALE_PNG_COUNT_$($stalePngs.Count)" }
    if (-not $stdoutText.Contains('P012B_BLENDER_CYCLES_FINISHED 20 PNG')) { throw "P012B_CYCLES_COMPLETION_MARKER_MISSING; see $log" }
}

$shaList = Join-Path $evidence 'owner_sha256.txt'
$files = @($blendFile) + $pngs
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
