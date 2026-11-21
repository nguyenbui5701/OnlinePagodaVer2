#requires -Version 5.1
<# P0-01 OWNER Blender Cycles and editable sources. No paid tools. #>
param([ValidateSet('quick','all')][string]$Mode='quick',
      [int]$Samples=32,[int]$Size=520,[string]$BlenderPath='')
$ErrorActionPreference='Stop'
$dir=$PSScriptRoot
$checks=@(
 @{File='lotus_pad_01.glb';Hash='0c80e5d4b2590716fdf9a985340fe2446af7ecc056727a03b82a3997db52bba5'},
 @{File='meditator_base.glb';Hash='f4e184b57046ad442183931bf9fd2f6d7953000ea07270458e291f627f787d2b'}
)
foreach($c in $checks){
 $p=Join-Path $dir $c.File
 if(-not(Test-Path -LiteralPath $p)){throw "Missing GLB $p"}
 $digest=(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
 if($digest -ne $c.Hash){throw "GLB SHA mismatch $($c.File): $digest"}
 Write-Host "[P0 GLB SHA PASS] $($c.File)"
}
if(-not $BlenderPath){
 $which=Get-Command blender.exe -ErrorAction SilentlyContinue
 if($which){$BlenderPath=$which.Source}
}
if(-not $BlenderPath){
 $base=Join-Path ${env:ProgramFiles} 'Blender Foundation'
 if(Test-Path -LiteralPath $base){
  $found=@(Get-ChildItem -LiteralPath $base -Directory | ForEach-Object {
   Join-Path $_.FullName 'blender.exe'
  } | Where-Object {Test-Path -LiteralPath $_} | Sort-Object)
  if($found.Count){$BlenderPath=$found[-1]}
 }
}
if(-not $BlenderPath -or -not(Test-Path -LiteralPath $BlenderPath)){
 throw 'Blender executable missing. Pass -BlenderPath with full Windows path.'
}
$script=Join-Path $dir 'blender_cycles_validate_and_save.py'
if(-not(Test-Path -LiteralPath $script)){throw "Missing Python script: $script"}
if($Samples -lt 1 -or $Size -lt 128){throw 'Invalid sample/resolution'}
$out=Join-Path $dir 'Blender_Evidence_P0'
if(Test-Path $out){Remove-Item -LiteralPath $out -Recurse -Force}
New-Item -ItemType Directory -Path $out -Force | Out-Null
$cases=@('pad','actor','pair')
if($Mode -eq 'quick'){$cases=@('pair')}
foreach($case in $cases){
 $target=Join-Path $out $case
 New-Item -ItemType Directory -Path $target -Force | Out-Null
 $argv=@('--background','--factory-startup','--python-exit-code','97','--python',$script,'--',
         '--root',$dir,'--out',$target,'--case',$case,'--samples',"$Samples",'--size',"$Size")
 if($Mode -eq 'quick'){$argv+='--quick'}
 $stdout=Join-Path $out ($case+'_stdout.log')
 $stderr=Join-Path $out ($case+'_stderr.log')
 Write-Host "[P0 CYCLES START] $case"
 $oldPref=$ErrorActionPreference
 try {
  $ErrorActionPreference='Continue'
  & $BlenderPath @argv 1> $stdout 2> $stderr
  $exit=$LASTEXITCODE
 } finally {$ErrorActionPreference=$oldPref}
 if($exit -ne 0){
  if(Test-Path $stdout){Get-Content -LiteralPath $stdout -Tail 60}
  if(Test-Path $stderr){Get-Content -LiteralPath $stderr -Tail 100}
  throw "Blender failed $case exit=$exit; see $stderr"
 }
 $json=Join-Path $target ($case+'_report.json')
 if(-not(Test-Path -LiteralPath $json)){throw "Missing report $json"}
 Write-Host "[P0 CYCLES PASS] $case"
}
$hashfile=Join-Path $out 'FILE_HASHES_SHA256.txt'
Get-ChildItem -LiteralPath $out -File -Recurse | Where-Object {$_.FullName -ne $hashfile} |
  Sort-Object FullName | ForEach-Object {
  "$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant())  $($_.FullName.Substring($out.Length+1))"
 } | Set-Content -LiteralPath $hashfile -Encoding UTF8
$archive=Join-Path $dir 'P0_LOTUS_CHIBI_Blender_Evidence_Cycles.zip'
if(Test-Path -LiteralPath $archive){Remove-Item -LiteralPath $archive -Force}
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $archive -CompressionLevel Optimal
Write-Host "[P0 EVIDENCE ZIP] $archive"
Write-Host 'Send the ZIP and original individual .blend files for independent SA review.'
