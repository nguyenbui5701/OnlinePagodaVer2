#requires -Version 5.1
<# Sakura R14 Cycles A/B, zero cost, SHA-gated inputs.
   Never write to reserved PowerShell $HOME; Python failure gives code 97. #>
param(
 [ValidateSet('quick','all')][string]$Mode='quick',
 [int]$Samples=32,
 [int]$Size=520,
 [string]$BlenderPath=''
)
$ErrorActionPreference='Stop'
$rootDir=$PSScriptRoot
$cases=@(
 @{Name='r13_baseline';File='r13_quality.glb';Hash='5e03020ac3160d6746b96715254e37290d140a1e7b3cee00708a105d2955e840'},
 @{Name='r14_final';File='sakura_hero.glb';Hash='ba3183c7b738dbd814b2b23cedc1f6da0470b13121882c116e1775154bda44f5'},
 @{Name='eco_unchanged';File='sakura_hero_eco.glb';Hash='accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173'}
)
if(-not $BlenderPath){
 $which=Get-Command blender.exe -ErrorAction SilentlyContinue
 if($which){$BlenderPath=$which.Source}
}
if(-not $BlenderPath){
 $base=Join-Path ${env:ProgramFiles} 'Blender Foundation'
 if(Test-Path -LiteralPath $base){
  $paths=@(Get-ChildItem -LiteralPath $base -Directory | ForEach-Object {
    Join-Path $_.FullName 'blender.exe'
  } | Where-Object {Test-Path -LiteralPath $_} | Sort-Object)
  if($paths.Count){$BlenderPath=$paths[-1]}
 }
}
if(-not $BlenderPath -or -not(Test-Path -LiteralPath $BlenderPath)){
 throw 'Blender.exe not found. Pass -BlenderPath with the full executable path.'
}
if($Size -lt 128 -or $Samples -lt 1){throw 'Invalid samples or resolution'}
$chosen=$cases
if($Mode -eq 'quick'){$chosen=@($cases[0],$cases[1])}
foreach($c in $chosen){
 $path=Join-Path $rootDir $c.File
 if(-not(Test-Path -LiteralPath $path)){throw "Required GLB missing $path"}
 $sha=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
 if($sha -ne $c.Hash){throw "SHA-256 mismatch $($c.Name): $sha"}
 Write-Host "[R14 INPUT SHA VERIFIED] $($c.Name)"
}
$out=Join-Path $rootDir 'Blender_Evidence_R14'
if(Test-Path -LiteralPath $out){Remove-Item -LiteralPath $out -Force -Recurse}
New-Item -ItemType Directory -Path $out -Force | Out-Null
$py=Join-Path $rootDir 'blender_ab_validate_r14.py'
if(-not(Test-Path -LiteralPath $py)){throw "Missing Blender Python script: $py"}
foreach($c in $chosen){
 $target=Join-Path $out $c.Name
 New-Item -ItemType Directory -Path $target -Force | Out-Null
 $argv=@('--background','--factory-startup','--python-exit-code','97','--python',$py,'--',
  '--model',(Join-Path $rootDir $c.File),'--out',$target,'--case',$c.Name,
  '--samples',"$Samples",'--size',"$Size")
 if($Mode -eq 'quick'){$argv+='--quick'}
 $stdout=Join-Path $out ($c.Name+'_stdout.log')
 $stderr=Join-Path $out ($c.Name+'_stderr.log')
 Write-Host "[R14 CYCLES START] $($c.Name) samples=$Samples size=$Size"
 # PowerShell 5.1 can convert native stderr to terminating NativeCommandError.
 $oldPref=$ErrorActionPreference
 try {
  $ErrorActionPreference='Continue'
  & $BlenderPath @argv 1> $stdout 2> $stderr
  $exitCode=$LASTEXITCODE
 } finally {
  $ErrorActionPreference=$oldPref
 }
 if($exitCode -ne 0){
  Write-Host '[R14 STDOUT - last 60 lines]' -ForegroundColor Yellow
  if(Test-Path -LiteralPath $stdout){Get-Content -LiteralPath $stdout -Tail 60}
  Write-Host '[R14 STDERR - last 100 lines]' -ForegroundColor Yellow
  if(Test-Path -LiteralPath $stderr){Get-Content -LiteralPath $stderr -Tail 100}
  throw "Blender Cycles failed $($c.Name), exit=$exitCode; see $stderr"
 }
 $report=Join-Path $target ($c.Name+'_report.json')
 if(-not(Test-Path -LiteralPath $report)){throw "Blender case report missing $report"}
 Write-Host "[R14 CYCLES COMPLETE] $($c.Name)"
}
$hashes=Join-Path $out 'FILE_HASHES_SHA256.txt'
Get-ChildItem -LiteralPath $out -File -Recurse | Where-Object {$_.FullName -ne $hashes} |
 Sort-Object FullName | ForEach-Object {
  "$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant())  $($_.FullName.Substring($out.Length+1))"
 } | Set-Content -LiteralPath $hashes -Encoding UTF8
$zip=Join-Path $rootDir 'Sakura_R14_Blender_Evidence_Cycles.zip'
if(Test-Path -LiteralPath $zip){Remove-Item -LiteralPath $zip -Force}
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -CompressionLevel Optimal
Write-Host "[R14 EVIDENCE ZIP] $zip"
Write-Host 'Send this ZIP for independent hash, Cycles image and artistic evaluation.'
