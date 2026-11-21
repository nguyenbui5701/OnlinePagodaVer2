#requires -Version 5.1
<# Owner-only P0-03 p02/p03 true GLB hair/portrait Cycles A/B; no paid tools; no runtime changes. #>
param(
 [ValidateSet('quick','all')][string]$Mode='quick',
 [int]$Samples=32,
 [int]$Size=520,
 [string]$BlenderPath=''
)
$ErrorActionPreference='Stop'
$here=$PSScriptRoot
$checks=@(
 @{File='p02_baseline\lotus_pad_01.glb';Hash='80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9'},
 @{File='p02_baseline\meditator_base.glb';Hash='83009fab6f4f00730260ef70dcd4d8605b2c634bc99f1fd6e34a1030833abd4c'},
 @{File='lotus_pad_01.glb';Hash='80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9'},
 @{File='meditator_base.glb';Hash='646842c7574976020f6583c4e18879c9bef012e5f31dc851589c0a1491786be0'}
)
foreach($x in $checks){
 $file=Join-Path $here $x.File
 if(-not(Test-Path -LiteralPath $file)){throw "Missing GLB: $file"}
 $sha=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
 if($sha -ne $x.Hash){throw "P0-03 GLB SHA mismatch $($x.File): $sha"}
 Write-Host "[P03 GLB SHA PASS] $($x.File)" -ForegroundColor Green
}
if(-not $BlenderPath){$cmd=Get-Command blender.exe -ErrorAction SilentlyContinue;if($cmd){$BlenderPath=$cmd.Source}}
if(-not $BlenderPath -and ${env:ProgramFiles}){
 $dir=Join-Path ${env:ProgramFiles} 'Blender Foundation'
 if(Test-Path -LiteralPath $dir){
  $b=@(Get-ChildItem -LiteralPath $dir -Directory | ForEach-Object {Join-Path $_.FullName 'blender.exe'} | Where-Object {Test-Path -LiteralPath $_} | Sort-Object)
  if($b.Count){$BlenderPath=$b[-1]}
 }
}
if(-not $BlenderPath -or -not(Test-Path -LiteralPath $BlenderPath)){throw 'Blender not found. Supply -BlenderPath with a full path to blender.exe.'}
$py=Join-Path $here 'blender_cycles_ab_p03.py'
if(-not(Test-Path -LiteralPath $py)){throw "Missing Blender script: $py"}
if($Samples -lt 1 -or $Size -lt 128){throw 'Invalid sample count or resolution'}
$out=Join-Path $here 'P03_Cycles_Evidence'
if(Test-Path -LiteralPath $out){Remove-Item -LiteralPath $out -Force -Recurse}
New-Item -ItemType Directory -Path $out -Force | Out-Null
$cases=@('p02_actor','p03_actor','p02_pair','p03_pair')
if($Mode -eq 'quick'){$cases=@('p02_actor','p03_actor','p02_pair','p03_pair')}
foreach($name in $cases){
 $parts=$name.Split('_');$revision=$parts[0];$kind=$parts[1]
 $folder=Join-Path $out $name;New-Item -ItemType Directory -Path $folder -Force | Out-Null
 $argv=@('--background','--factory-startup','--python-exit-code','97','--python',$py,'--','--root',$here,'--out',$folder,'--revision',$revision,'--kind',$kind,'--samples',"$Samples",'--size',"$Size")
 if($Mode -eq 'quick'){$argv+='--quick'}
 $stdout=Join-Path $out ($name+'_stdout.log');$stderr=Join-Path $out ($name+'_stderr.log')
 Write-Host "[P03 CYCLES START] $name" -ForegroundColor Cyan
 $prior=$ErrorActionPreference
 try {$ErrorActionPreference='Continue'; & $BlenderPath @argv 1> $stdout 2> $stderr; $code=$LASTEXITCODE}
 finally {$ErrorActionPreference=$prior}
 if($code -ne 0){
  if(Test-Path -LiteralPath $stdout){Get-Content -LiteralPath $stdout -Tail 55}
  if(Test-Path -LiteralPath $stderr){Get-Content -LiteralPath $stderr -Tail 100}
  throw "Blender failed $name exit=$code; see $stderr"
 }
 $report=Join-Path $folder 'case_report.json'
 if(-not(Test-Path -LiteralPath $report)){throw "Blender exit 0 but report missing: $report"}
 Write-Host "[P03 CYCLES COMPLETED] $name" -ForegroundColor Green
}
$hashfile=Join-Path $out 'FILE_HASHES_SHA256.txt'
Get-ChildItem -LiteralPath $out -Recurse -File | Where-Object {$_.FullName -ne $hashfile} | Sort-Object FullName | ForEach-Object {
 "$( (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() )  $($_.FullName.Substring($out.Length+1))"
} | Set-Content -LiteralPath $hashfile -Encoding UTF8
$zip=Join-Path $here 'P03_LOTUS_CHIBI_Blender_Cycles_AB_Evidence.zip'
if(Test-Path -LiteralPath $zip){Remove-Item -LiteralPath $zip -Force}
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -CompressionLevel Optimal
Write-Host "[P03 OWNER CYCLES EVIDENCE ZIP] $zip" -ForegroundColor Green
Write-Host 'SA review requires the original ZIP and two new p03 actor/pair .blend project files; do not claim approval before owner OK.'
