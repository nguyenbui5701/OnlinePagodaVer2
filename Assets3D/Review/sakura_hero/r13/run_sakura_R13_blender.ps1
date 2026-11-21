#requires -Version 5.1
<# R13 controlled same-light Cycles A/B. Does not mutate source GLBs.
   Uses read-only-safe $blenderInstallDir, never the PowerShell built-in $HOME.
   AI environment has not executed Blender; owner supplies actual evidence. #>
param(
 [ValidateSet('quick','all')][string]$Mode='quick',
 [int]$Samples=32,
 [int]$Size=520,
 [string]$BlenderPath=''
)
$ErrorActionPreference='Stop'
$rootDir=$PSScriptRoot
$cases=@(
 @{Name='r12_baseline';File='r12_quality.glb';Hash='0e1f656c74a3f7860cb640395d95cebdb852d7e1269f1463e04408aa6bc8bb25'},
 @{Name='r13_final';File='sakura_hero.glb';Hash='5e03020ac3160d6746b96715254e37290d140a1e7b3cee00708a105d2955e840'},
 @{Name='eco_unchanged';File='sakura_hero_eco.glb';Hash='accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173'}
)
if(-not $BlenderPath){
 $detected=Get-Command blender.exe -ErrorAction SilentlyContinue
 if($detected){$BlenderPath=$detected.Source}
}
if(-not $BlenderPath){
 $blenderInstallDir=Join-Path ${env:ProgramFiles} 'Blender Foundation'
 if(Test-Path -LiteralPath $blenderInstallDir){
  $options=@(Get-ChildItem -LiteralPath $blenderInstallDir -Directory | ForEach-Object {
   Join-Path $_.FullName 'blender.exe'
  } | Where-Object {Test-Path -LiteralPath $_} | Sort-Object)
  if($options.Count -gt 0){$BlenderPath=$options[-1]}
 }
}
if(-not $BlenderPath -or -not (Test-Path -LiteralPath $BlenderPath)){
 throw 'Cannot locate blender.exe; specify -BlenderPath with actual Blender executable.'
}
if($Samples -lt 1 -or $Size -lt 128){throw 'Invalid Samples/Size'}
$selected=$cases
if($Mode -eq 'quick'){$selected=@($cases[0],$cases[1])}
foreach($case in $selected){
 $src=Join-Path $rootDir $case.File
 if(-not (Test-Path -LiteralPath $src)){throw "Missing GLB input: $src"}
 $hash=(Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash.ToLowerInvariant()
 if($hash -ne $case.Hash){throw "GLB SHA mismatch $($case.Name): $hash"}
 Write-Host "[R13 VERIFIED INPUT] $($case.Name) $hash"
}
$out=Join-Path $rootDir 'Blender_Evidence_R13'
# Cleaning the previous quick run prevents stale PNG/report hashes leaking into full A/B.
if(Test-Path -LiteralPath $out){Remove-Item -LiteralPath $out -Recurse -Force}
New-Item -ItemType Directory -Force -Path $out | Out-Null
$py=Join-Path $rootDir 'blender_ab_validate_r13.py'
if(-not (Test-Path -LiteralPath $py)){throw "Missing Python importer $py"}
foreach($case in $selected){
 $dest=Join-Path $out $case.Name
 New-Item -ItemType Directory -Force -Path $dest | Out-Null
 $args=@('--background','--factory-startup','--python-exit-code','97','--python',$py,'--',
   '--model',(Join-Path $rootDir $case.File),
   '--out',$dest,'--case',$case.Name,'--samples',"$Samples",'--size',"$Size")
 if($Mode -eq 'quick'){$args+='--quick'}
 Write-Host "[R13 RENDER START] $($case.Name) $Samples samples $Size wide"
 # Windows PowerShell 5.1 turns native stderr text into NativeCommandError
 # when $ErrorActionPreference='Stop'. That hides Blender's actual Python traceback.
 # Disable *only for this native invocation*; restore immediately afterward.
 $stdout=Join-Path $out ($case.Name+'_stdout.log')
 $stderr=Join-Path $out ($case.Name+'_stderr.log')
 $previousErrorActionPreference=$ErrorActionPreference
 try {
  $ErrorActionPreference='Continue'
  & $BlenderPath @args 1> $stdout 2> $stderr
  $blenderExitCode=$LASTEXITCODE
 } finally {
  $ErrorActionPreference=$previousErrorActionPreference
 }
 # --python-exit-code 97 guarantees nonzero exit when Blender's Python fails.
 if($blenderExitCode -ne 0){
  Write-Host '[R13 BLENDER STDOUT - last 50 lines]' -ForegroundColor Yellow
  if(Test-Path -LiteralPath $stdout){Get-Content -LiteralPath $stdout -Tail 50}
  Write-Host '[R13 BLENDER STDERR - last 80 lines]' -ForegroundColor Yellow
  if(Test-Path -LiteralPath $stderr){Get-Content -LiteralPath $stderr -Tail 80}
  throw "Blender Cycles failed $($case.Name) (exit $blenderExitCode). See $stderr and $stdout for the FULL Python traceback."
 }
 $report=Join-Path $dest ($case.Name+'_report.json')
 if(-not (Test-Path -LiteralPath $report)){throw "No case report $report"}
 Write-Host "[R13 RENDER COMPLETE] $($case.Name)"
}
$hashList=Join-Path $out 'FILE_HASHES_SHA256.txt'
Get-ChildItem -LiteralPath $out -File -Recurse | Where-Object { $_.FullName -ne $hashList } |
 Sort-Object FullName | ForEach-Object {
  "$( (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() )  $($_.FullName.Substring($out.Length+1))"
 } | Set-Content -LiteralPath $hashList -Encoding UTF8
$zip=Join-Path $rootDir 'Sakura_R13_Blender_Evidence_Cycles.zip'
if(Test-Path -LiteralPath $zip){Remove-Item -LiteralPath $zip -Force}
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -CompressionLevel Optimal
Write-Host "[R13 EVIDENCE ZIP] $zip"
Write-Host 'Send ZIP and two R13 .blend files (if generated) for source-file SHA verification.'
Write-Host 'R13 Cycles / art is pending independent examination, no production PASS.'
