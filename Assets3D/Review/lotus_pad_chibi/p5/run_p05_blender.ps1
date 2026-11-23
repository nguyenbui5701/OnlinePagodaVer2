#requires -Version 5.1
<# P0.5 female cross/kneel actual GLB Blender Cycles A/B, zero paid tools.
   Never mark Cycles PASS before real case reports + original PNGs + SHA exist.
   p04_baseline GLB included in Starter; original lotus p3 must be copied. #>
param(
 [ValidateSet('quick','all')][string]$Mode='quick',
 [int]$Samples=32,
 [int]$Size=520,
 [string]$BlenderPath=''
)
$ErrorActionPreference='Stop'
$here=$PSScriptRoot
$checks=@(
 @{File='p04_baseline\meditator_female_ao_ba_ba_p04.glb';Hash='586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09'},
 @{File='meditator_female_cross_prayer_p05.glb';Hash='981ecf0b83378ce3fca7cd49db9473baac43238af3b5ee2fa857024ff66b57fd'},
 @{File='meditator_female_kneel_prayer_p05.glb';Hash='04a1d0e03e5186085118dd06d158dbba43e7180843895ed1661a03529040785e'},
 @{File='p02_baseline\lotus_pad_01.glb';Hash='80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9'}
)
foreach($entry in $checks){
 $path=Join-Path $here $entry.File
 if(-not(Test-Path -LiteralPath $path)){throw "MISSING original GLB $path. For the leaf, copy p3\lotus_pad_01.glb from PR #2."}
 $actual=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
 if($actual -ne $entry.Hash){throw "GLB SHA mismatch: $path expected $($entry.Hash) got $actual"}
 Write-Host "[P05_INPUT_SHA_PASS] $($entry.File)" -ForegroundColor Green
}
if(-not $BlenderPath){$cmd=Get-Command blender.exe -ErrorAction SilentlyContinue;if($cmd){$BlenderPath=$cmd.Source}}
if(-not $BlenderPath -and ${env:ProgramFiles}){
 $dir=Join-Path ${env:ProgramFiles} 'Blender Foundation'
 if(Test-Path -LiteralPath $dir){
  $found=@(Get-ChildItem -LiteralPath $dir -Directory | ForEach-Object {Join-Path $_.FullName 'blender.exe'} | Where-Object {Test-Path -LiteralPath $_} | Sort-Object)
  if($found.Count -gt 0){$BlenderPath=$found[-1]}
 }
}
if(-not $BlenderPath -or -not(Test-Path -LiteralPath $BlenderPath)){throw 'Blender missing: supply -BlenderPath full blender.exe path'}
if($Samples -lt 1 -or $Size -lt 160){throw 'Invalid -Samples or -Size'}
$py=Join-Path $here 'blender_p05_cycles.py'
if(-not(Test-Path -LiteralPath $py)){throw "Missing exact Blender Python source $py"}
$out=Join-Path $here 'P05_Cycles_Evidence'
if(Test-Path -LiteralPath $out){Remove-Item -LiteralPath $out -Recurse -Force}
New-Item -ItemType Directory -Force -Path $out | Out-Null
$cases=@('p04_actor','cross_actor','kneel_actor','p04_pair','cross_pair','kneel_pair','cross_palette','kneel_palette')
if($Mode -eq 'quick'){$cases=@('p04_actor','cross_actor','kneel_actor','cross_pair','kneel_pair')}
foreach($case in $cases){
 $parts=$case.Split('_');$revision=$parts[0];$kind=$parts[1]
 $folder=Join-Path $out $case;New-Item -ItemType Directory -Force -Path $folder|Out-Null
 $stdout=Join-Path $out ($case+'_stdout.log');$stderr=Join-Path $out ($case+'_stderr.log')
 $argv=@('--background','--factory-startup','--python-exit-code','97','--python',$py,'--',
  '--root',$here,'--out',$folder,'--revision',$revision,'--kind',$kind,'--samples',"$Samples",'--size',"$Size")
 if($Mode -eq 'quick'){$argv+='--quick'}
 Write-Host "[P05_CYCLES_START] $case" -ForegroundColor Cyan
 $prior=$ErrorActionPreference
 try {$ErrorActionPreference='Continue'; & $BlenderPath @argv 1> $stdout 2> $stderr; $exitCode=$LASTEXITCODE}
 finally {$ErrorActionPreference=$prior}
 if($exitCode -ne 0){
  if(Test-Path $stdout){Get-Content $stdout -Tail 60}
  if(Test-Path $stderr){Get-Content $stderr -Tail 100}
  throw "Blender case failed: $case, exit=$exitCode. See the stdout/stderr logs."
 }
 $report=Join-Path $folder 'case_report.json'
 if(-not(Test-Path $report)){throw "Missing genuine report $report"}
 $r=Get-Content -LiteralPath $report -Raw -Encoding UTF8 | ConvertFrom-Json
 if($r.images.Count -lt 1){throw "No Cycles PNG evidence in $case"}
 foreach($im in $r.images){
  $file=Join-Path $folder $im.file
  if(-not(Test-Path -LiteralPath $file)){throw "Missing PNG $file"}
  $sha=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
  if($sha -ne $im.sha256){throw "PNG case_report SHA mismatch $file"}
 }
 Write-Host "[P05_CYCLES_DONE] $case images=$($r.images.Count)" -ForegroundColor Green
}
$shafile=Join-Path $out 'FILE_HASHES_SHA256.txt'
Get-ChildItem -LiteralPath $out -Recurse -File | Where-Object {$_.FullName -ne $shafile} | Sort-Object FullName | ForEach-Object {
 $hash=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
 $relative=$_.FullName.Substring($out.Length+1)
 "$hash  $relative"
} | Set-Content -LiteralPath $shafile -Encoding UTF8
$zip=Join-Path $here 'P05_FEMALE_PRAYER_Blender_Cycles_Evidence.zip'
if(Test-Path -LiteralPath $zip){Remove-Item -LiteralPath $zip -Force}
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -CompressionLevel Optimal
Write-Host "[P05_EVIDENCE_ZIP] $zip" -ForegroundColor Green
Write-Host 'Cycles evidence requires independent SA audit and explicit owner approval of BOTH female poses. No merge/Codex/male.'
