param([string]$Blender='')
$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)
if ((git branch --show-current).Trim() -ne 'assets/pond-environment-b9') {throw 'B9_R2_BRANCH'}
if (!$Blender) {
  $cmd=Get-Command blender -ErrorAction SilentlyContinue
  if ($cmd) {$Blender=$cmd.Source} else {$Blender=Get-ChildItem 'C:\Program Files\Blender Foundation' -Filter blender.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName}
}
if (!$Blender -or !(Test-Path -LiteralPath $Blender -PathType Leaf)) {throw 'B9_R2_BLENDER_NOT_FOUND'}
if (Test-Path .\evidence) {throw 'B9_R2_OUTPUT_EXISTS_ARCHIVE_FIRST'}
foreach ($pin in (Get-Content ..\context_pins.json -Raw | ConvertFrom-Json)) {
  git cat-file -e "$($pin.commit)^{commit}" 2>$null
  if ($LASTEXITCODE -ne 0) {
    git fetch --no-tags origin $pin.commit
    if ($LASTEXITCODE -ne 0) {throw "B9_R2_CONTEXT_FETCH_FAILED $($pin.commit)"}
  }
}
foreach ($file in @('B9_R2_stdout.log','B9_R2_stderr.log','B9_R2_exit_code.txt')) {
  if (Test-Path $file) {throw "B9_R2_LOG_EXISTS_ARCHIVE_FIRST $file"}
}
$script=(Resolve-Path .\native_visibility_r2.py).Path
$process=Start-Process -FilePath $Blender -ArgumentList @('--background','--python-exit-code','17','--python',('"{0}"' -f $script)) -Wait -PassThru -NoNewWindow -RedirectStandardOutput B9_R2_stdout.log -RedirectStandardError B9_R2_stderr.log
Set-Content B9_R2_exit_code.txt -Value $process.ExitCode -Encoding ascii
if ($process.ExitCode -ne 0) {Get-Content B9_R2_stderr.log -Tail 50; Get-Content B9_R2_stdout.log -Tail 20;throw "B9_R2_NATIVE_FAILED $($process.ExitCode)"}
if (!(Test-Path .\evidence\visibility_manifest.json)) {throw 'B9_R2_MANIFEST_MISSING'}
Write-Output 'B9_R2_NATIVE_EXIT_0; SA visual review pending'
