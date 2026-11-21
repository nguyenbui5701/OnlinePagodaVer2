#requires -Version 5.1
<#
Sakura Hero R10 AXES V2 - OWNER-RUN independent Blender Cycles PBR checkpoint.
AXES V2 fixes incorrect Y-up camera/lighting coordinates in the initial R10 proof.
This corrected launcher has NOT been executed on Windows/Blender by AI Visual.
Requires the original R10 two GLBs and blender_import_validate_r10.py beside this file.
It does not modify source GLBs, GitHub, R04-R10, or create an R10 revision.
#>
[CmdletBinding()]
param(
    [string]$BlenderPath = '',
    [ValidateSet('all','quality','eco')][string]$Variant = 'all',
    [ValidateRange(1,1024)][int]$Samples = 32,
    [ValidateRange(128,2048)][int]$Size = 520
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonScript = Join-Path $root 'blender_import_validate_r10.py'
$models = @{
    quality = @{ file = 'sakura_hero.glb'; sha256 = 'ac4322fb00475d0dde3334a375fca0e0094715583edf7f6460b30a9139b1e273'; bytes = 5096052 }
    eco = @{ file = 'sakura_hero_eco.glb'; sha256 = 'accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173'; bytes = 1393492 }
}
if (-not (Test-Path -LiteralPath $pythonScript -PathType Leaf)) { throw "Missing blender_import_validate_r10.py beside this launcher: $root" }

# 1. Check originals before Blender is started. Never overwrite the archived GLBs.
$choose = if ($Variant -eq 'all') { @('quality','eco') } else { @($Variant) }
foreach ($v in $choose) {
    $m = $models[$v]
    $p = Join-Path $root $m.file
    if (-not (Test-Path -LiteralPath $p -PathType Leaf)) { throw "Missing R10 input: $p" }
    $info = Get-Item -LiteralPath $p
    $got = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($info.Length -ne $m.bytes -or $got -ne $m.sha256) {
        throw "R10 $v binary NOT MATCHED. Expected $($m.bytes) bytes SHA $($m.sha256); actual $($info.Length) bytes SHA $got. Stop: do NOT test changed/incorrect bytes as R10."
    }
    Write-Host "[VERIFIED ORIGINAL R10] $($m.file) | $($info.Length) bytes | $got" -ForegroundColor Green
}

# 2. Locate Blender (4.5 LTS preferred; 5.x may work but is not prevalidated).
if (-not $BlenderPath) {
    $cmd = Get-Command blender -ErrorAction SilentlyContinue
    if ($cmd) { $BlenderPath = $cmd.Source }
}
if (-not $BlenderPath) {
    $installRoot = Join-Path $env:ProgramFiles 'Blender Foundation'
    if (Test-Path -LiteralPath $installRoot) {
        $candidates = @(Get-ChildItem -LiteralPath $installRoot -Directory -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName 'blender.exe' } |
            Where-Object { Test-Path -LiteralPath $_ })
        if ($candidates.Count -gt 0) { $BlenderPath = $candidates[-1] }
    }
}
if (-not $BlenderPath -or -not (Test-Path -LiteralPath $BlenderPath -PathType Leaf)) {
    throw "Blender.exe not found. Install Blender from blender.org and run with -BlenderPath 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe' (change to your actual path)."
}
Write-Host "[BLENDER AXES_V2] $BlenderPath"
$dest = Join-Path $root 'Blender_Evidence_R10_AxesV2'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$versionsText = Join-Path $dest 'BLENDER_VERSION.txt'
try { (& $BlenderPath --version 2>&1 | Select-Object -First 5 | Out-String) | Set-Content -LiteralPath $versionsText -Encoding UTF8 } catch { "Blender version could not be captured: $_" | Set-Content -LiteralPath $versionsText }

# 3. Run original R10 importer and Cycles CPU for both real GLBs.
foreach ($v in $choose) {
    $out = Join-Path $dest $v.ToUpperInvariant()
    New-Item -ItemType Directory -Force -Path $out | Out-Null
    $modelPath = Join-Path $root $models[$v].file
    $stdout = Join-Path $dest ("blender_" + $v + "_stdout.log")
    $stderr = Join-Path $dest ("blender_" + $v + "_stderr.log")
    $argv = '--background --factory-startup --python-exit-code 3 --python "' + $pythonScript + '" -- --model "' + $modelPath + '" --out "' + $out + '" --variant ' + $v + ' --samples ' + $Samples + ' --size ' + $Size
    Write-Host "[START] $v (Cycles CPU), samples=$Samples, width=$Size" -ForegroundColor Cyan
    $proc = Start-Process -FilePath $BlenderPath -ArgumentList $argv -Wait -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    if ($proc.ExitCode -ne 0) {
        Write-Host "[FAILED] Blender exit code $($proc.ExitCode) for $v. Logs: $stdout , $stderr" -ForegroundColor Red
        if (Test-Path -LiteralPath $stderr) { Get-Content -LiteralPath $stderr -Tail 35 }
        throw "Blender R10 test FAILED on $v; upload logs, do not call PBR passed."
    }
    $blendFile = Join-Path $out ('sakura_hero_r10_' + $v + '.blend')
    $report = Join-Path $out ('r10_' + $v + '_blender_report.json')
    $views = @('top','aerial_e','aerial_w','aerial_n','aerial_s','three_quarter','under','trunk_33s')
    $required = @($blendFile,$report)
    foreach ($view in $views) { $required += (Join-Path $out ('r10_' + $v + '_' + $view + '_blender_cycles.png')) }
    $missing = @($required | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Leaf) })
    if ($missing.Count -gt 0) { throw "BLENDER OUTPUT INCOMPLETE for $v : $($missing -join '; ')" }
    $obj = Get-Content -LiteralPath $report -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($obj.sourceSha256 -ne $models[$v].sha256) { throw "Input SHA in Blender JSON report did not match R10 $v. Stop." }
    Write-Host "[RENDERED] $v : $($views.Count) PNG + JSON + .blend | check material visuals manually" -ForegroundColor Green
}

# 4. Generate readable audit and a light evidence ZIP for sharing in chat.
$audit = Join-Path $dest 'FILE_HASHES_SHA256.txt'
$records = New-Object System.Collections.Generic.List[string]
$records.Add('R10 axes-v2 Blender PBR run; corrected Y-up/Z-up cameras; NOT automatic art approval')
$records.Add('Samples: ' + $Samples + ' ; width: ' + $Size + ' ; selected: ' + $Variant)
foreach ($v in $choose) {
    $records.Add("Variant: $v")
    $files = @(Get-ChildItem -LiteralPath (Join-Path $dest $v.ToUpperInvariant()) -File)
    foreach ($f in $files) { $records.Add((Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant() + '  ' + $f.FullName) }
}
$records | Set-Content -LiteralPath $audit -Encoding UTF8
$light = Join-Path $root 'Sakura_R10_Blender_Evidence_AxesV2.zip'
$stage = Join-Path $dest 'SEND_TO_AI_VISUAL'
New-Item -ItemType Directory -Force -Path $stage | Out-Null
Copy-Item -LiteralPath $versionsText,$audit -Destination $stage
Get-ChildItem -LiteralPath $dest -Filter 'blender_*_*.log' -File | Copy-Item -Destination $stage
foreach ($v in $choose) {
    $sd = Join-Path $stage $v.ToUpperInvariant()
    New-Item -ItemType Directory -Force -Path $sd | Out-Null
    $sourceFolder = Join-Path $dest $v.ToUpperInvariant()
    Get-ChildItem -LiteralPath $sourceFolder -File | Where-Object { $_.Extension -eq '.png' -or $_.Extension -eq '.json' } | Copy-Item -Destination $sd
}
if (Test-Path -LiteralPath $light) { Remove-Item -LiteralPath $light -Force }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $light -CompressionLevel Optimal
Write-Host "`n[DONE] Send me this ZIP: $light" -ForegroundColor Green
Write-Host 'Also send .blend files separately from Blender_Evidence_R10_AxesV2\QUALITY and \ECO.'
Write-Host 'The ZIP intentionally excludes .blend to keep file transfers manageable. Upload .blend files separately if you want their SHA independently checked.'
Write-Host 'This proves Blender executed only if log/JSON/screenshots pass manual review; not proof of Three.js parity or GPU FPS.'
