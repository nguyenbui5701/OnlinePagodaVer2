param([ValidateSet('Audit','Build','Preview','Final')][string]$Phase='Build',[string]$Blender='')
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
if ($Phase -eq 'Audit') { throw 'R18_AUDIT_ALREADY_PASS_DO_NOT_REPEAT' }
if ($Phase -eq 'Final') { throw 'R18_FINAL_HOLD_PENDING_SA_PREVIEW_REVIEW' }
switch ($Phase) {
    'Build' {
        if (!(Test-Path .\attachment_audit.json)) { throw 'R18_AUDIT_MISSING' }
        $auditHash=(Get-FileHash -LiteralPath .\attachment_audit.json -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($auditHash -ne 'd1bd1bc8d914893e6c98b96b00553191b0497dd548e982c44979af7a42c20baa') { throw 'R18_REVIEWED_AUDIT_SHA_MISMATCH' }
        Invoke-Native '.\author_r18.py' 'build' 'R18_build'
        Write-Output 'R18_BUILD_READY_RUN_FOCUSED_PREVIEW_ONLY'
    }
    'Preview' {
        if (!(Test-Path .\validation.json)) { throw 'R18_VALIDATION_MISSING' }
        Invoke-Native '.\render_r18.py' 'preview' 'R18_preview'
        Write-Output 'P10B8_ART_SA_REVIEW_REQUIRED'
    }
}
