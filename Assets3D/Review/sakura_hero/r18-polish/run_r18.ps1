param([ValidateSet('Audit','Build','Final')][string]$Phase='Audit',[string]$Blender='')
$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)
if ((git branch --show-current).Trim() -ne 'assets/sakura-hero-r18-polish') { throw 'R18_WRONG_BRANCH' }
if (!$Blender) {
    $cmd=Get-Command blender -ErrorAction SilentlyContinue
    if ($cmd) { $Blender=$cmd.Source }
    else { $Blender=Get-ChildItem 'C:\Program Files\Blender Foundation' -Filter blender.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName }
}
if (!$Blender -or !(Test-Path -LiteralPath $Blender -PathType Leaf)) { throw 'R18_BLENDER_NOT_FOUND' }
function Invoke-Native([string]$Script,[string]$Mode,[string]$Label) {
    $path=(Resolve-Path $Script).Path
    $stdout=Join-Path (Get-Location) "${Label}_stdout.log"
    $stderr=Join-Path (Get-Location) "${Label}_stderr.log"
    $args=@('--background','--python-exit-code','17','--python',('"{0}"' -f $path),'--',$Mode)
    $p=Start-Process -FilePath $Blender -ArgumentList $args -Wait -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    if ($p.ExitCode -ne 0) { Get-Content -LiteralPath $stderr -Tail 100; Get-Content -LiteralPath $stdout -Tail 30; throw "R18_NATIVE_FAILED $Label $($p.ExitCode)" }
    Write-Output "R18_NATIVE_EXIT_0 $Label"
}
switch ($Phase) {
    'Audit' {
        Invoke-Native '.\author_r18.py' 'audit' 'R18_audit'
        Invoke-Native '.\render_r18.py' 'audit' 'R18_audit_views'
        Write-Output 'R18_AUDIT_READY_REVIEW_FINDINGS_BEFORE_BUILD'
    }
    'Build' {
        if (!(Test-Path .\attachment_audit.json)) { throw 'R18_AUDIT_MISSING' }
        Invoke-Native '.\author_r18.py' 'build' 'R18_build'
        Write-Output 'R18_BUILD_READY_CHECK_ATTACHMENT_REPORT_BEFORE_FINAL'
    }
    'Final' {
        if (!(Test-Path .\validation.json)) { throw 'R18_VALIDATION_MISSING' }
        $python=Get-Command py -ErrorAction Stop
        & $python.Source -c 'from PIL import Image'
        if ($LASTEXITCODE -ne 0) { throw 'Pillow required; use existing Pillow installation' }
        Invoke-Native '.\render_r18.py' 'final' 'R18_final'
        & $python.Source .\make_r18_sheets.py
        if ($LASTEXITCODE -ne 0) { throw 'R18_SHEETS_FAILED' }
        Write-Output 'P10B8_ART_SA_REVIEW_REQUIRED'
    }
}
