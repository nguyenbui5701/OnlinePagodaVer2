param([ValidateSet('All','Build','Final')][string]$Phase='All',[string]$Blender='')
$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)
if ((git branch --show-current).Trim() -ne 'assets/sakura-hero-r18-polish') { throw 'R18A_WRONG_BRANCH' }
if (!$Blender) {
    $cmd=Get-Command blender -ErrorAction SilentlyContinue
    if ($cmd) { $Blender=$cmd.Source }
    else { $Blender=Get-ChildItem 'C:\Program Files\Blender Foundation' -Filter blender.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName }
}
if (!$Blender -or !(Test-Path -LiteralPath $Blender -PathType Leaf)) { throw 'R18A_BLENDER_NOT_FOUND' }
$python=Get-Command py -ErrorAction Stop
& $python.Source -c "from PIL import Image; from pathlib import Path; [compile(p.read_bytes(), str(p), 'exec') for p in Path('.').glob('*.py')]"
if ($LASTEXITCODE -ne 0) { throw 'R18A_PREFLIGHT_FAILED: verify Python source and existing Pillow installation' }
function Invoke-Native([string]$Script,[string]$Label) {
    $path=(Resolve-Path $Script).Path
    $stdout=Join-Path (Get-Location) ("{0}_stdout.log" -f $Label)
    $stderr=Join-Path (Get-Location) ("{0}_stderr.log" -f $Label)
    $args=@('--background','--python-exit-code','17','--python',('"{0}"' -f $path))
    $p=Start-Process -FilePath $Blender -ArgumentList $args -Wait -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    if ($p.ExitCode -ne 0) {
        Get-Content -LiteralPath $stderr -Tail 100
        Get-Content -LiteralPath $stdout -Tail 30
        throw "R18A_NATIVE_FAILED $Label $($p.ExitCode)"
    }
    Set-Content -LiteralPath (Join-Path (Get-Location) ("{0}_exit_code.txt" -f $Label)) -Value '0' -Encoding ascii
    Write-Output "R18A_NATIVE_EXIT_0 $Label"
}
if ($Phase -ne 'Final') {
    if (Test-Path -LiteralPath .\validation.json) { Write-Output 'R18A_EXISTING_VALIDATION_KEEP; Final verifies exact SHA and receipt' }
    else { Invoke-Native '.\author_r18a.py' 'R18a_build' }
}
if ($Phase -ne 'Build') {
    if (!(Test-Path -LiteralPath .\validation.json)) { throw 'R18A_BUILD_VALIDATION_MISSING' }
    if (!(Test-Path -LiteralPath .\R18a_build_exit_code.txt) -or ((Get-Content -LiteralPath .\R18a_build_exit_code.txt -Raw).Trim() -ne '0')) { throw 'R18A_BUILD_EXIT_RECEIPT_MISSING' }
    foreach ($f in @('native_manifest.json','owner_sha256.txt','final_result.json','R18a_final_exit_code.txt')) {
        if (Test-Path -LiteralPath $f) { Remove-Item -LiteralPath $f }
    }
    Invoke-Native '.\render_r18a.py' 'R18a_final'
    & $python.Source .\make_r18a_sheets.py
    if ($LASTEXITCODE -ne 0) { throw 'R18A_SHEETS_FAILED' }
    Write-Output 'P10B8_ART_SA_REVIEW_REQUIRED'
}
