param([ValidateSet('All','Focused','Validate','Render')][string]$Phase='All',[string]$Blender='')
$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)
if ((git branch --show-current).Trim() -ne 'assets/pond-environment-b9') { throw 'B9_WRONG_BRANCH' }
if (!$Blender) {
  $cmd=Get-Command blender -ErrorAction SilentlyContinue
  if ($cmd) {$Blender=$cmd.Source} else {$Blender=Get-ChildItem 'C:\Program Files\Blender Foundation' -Filter blender.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName}
}
if (!$Blender -or !(Test-Path -LiteralPath $Blender -PathType Leaf)) {throw 'B9_BLENDER_NOT_FOUND'}
# Fetch only immutable art references missing from local object store; no branch update.
foreach ($sha in @('ce0db947e5e9ea4c6214bc900b0cdd9c6a83cced','9a01b39afde642d55dcf9bc7639f3a84ef913e4d')) {
  git cat-file -e "$sha^{commit}" 2>$null
  if ($LASTEXITCODE -ne 0) {
    git fetch --no-tags origin $sha
    if ($LASTEXITCODE -ne 0) {throw "B9_CONTEXT_FETCH_FAILED $sha"}
  }
}
function Native([string]$Label,[string]$Mode) {
  $script=(Resolve-Path .\native_b9.py).Path
  $out=Join-Path (Get-Location) "$($Label)_stdout.log"
  $err=Join-Path (Get-Location) "$($Label)_stderr.log"
  $args=@('--background','--python-exit-code','17','--python',('"{0}"' -f $script))
  if ($Mode) {$args+=@('--',$Mode)}
  $stamp=Get-Date -Format 'yyyyMMdd_HHmmss_fff'
  foreach ($old in @($out,$err,(Join-Path (Get-Location) "$($Label)_exit_code.txt"))) {
    if (Test-Path -LiteralPath $old) {Move-Item -LiteralPath $old -Destination "$old.$stamp.previous"}
  }
  $p=Start-Process -FilePath $Blender -ArgumentList $args -Wait -PassThru -NoNewWindow -RedirectStandardOutput $out -RedirectStandardError $err
  if ($p.ExitCode -ne 0) {Get-Content $err -Tail 80;Get-Content $out -Tail 30;throw "B9_NATIVE_FAILED $Label $($p.ExitCode)"}
  Set-Content -LiteralPath "$($Label)_exit_code.txt" -Value '0' -Encoding ascii
  Write-Output "B9_NATIVE_EXIT_0 $Label"
}
if ($Phase -ne 'Render') {Native 'B9_focus' '--focused-only'}
if ($Phase -eq 'Focused') {return}
if (!(Test-Path .\B9_focus_exit_code.txt) -or ((Get-Content .\B9_focus_exit_code.txt -Raw).Trim() -ne '0')) {throw 'B9_FOCUS_EXIT_RECEIPT_MISSING'}
if ($Phase -ne 'Render') {Native 'B9_validate' '--validate-only'}
if ($Phase -ne 'Validate') {
  if (!(Test-Path .\B9_validate_exit_code.txt) -or ((Get-Content .\B9_validate_exit_code.txt -Raw).Trim() -ne '0')) {throw 'B9_VALIDATE_EXIT_RECEIPT_MISSING'}
  if (!(Test-Path .\native_manifest.json)) {Native 'B9_render' ''}
  else {throw 'B9_EXISTING_FINAL_MANIFEST_REVIEW_REQUIRED; do not reuse unverified receipts'}
  Write-Output 'P10B9_ART_SA_REVIEW_REQUIRED'
}
