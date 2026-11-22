#requires -Version 5.1
<# OnlinePagodaVer2 P0.6b owner Cycles 4 NEW male hair cases only; original P06a references reused.
  Actual GLB reimport; exact SHA fail-fast; NO paid tools; no runtime changes.
  .blend + Cycles PNG reports ONLY exist after this has truly executed. #>
param(
 [ValidateSet('quick','all')][string]$Mode='quick',
 [int]$Samples=32,
 [int]$Size=520,
 [string]$BlenderPath=''
)
$ErrorActionPreference='Stop'
$here=$PSScriptRoot
$checks=@(
 @{File='..\p6a\meditator_male_cross_prayer_p06a.glb';Hash='c684934ff2ceb8da08265fcc8304f2684255f144dc7df94819f007c5e803cb61'},
 @{File='..\p6a\meditator_male_kneel_prayer_p06a.glb';Hash='9aad5f3f4d1b84d0a9ffb2cda3bc01b39ece676318ba883e417f7337e9d2251e'},
 @{File='meditator_male_cross_prayer_p06b.glb';Hash='d6add5fdd5ec7122c24aee774c1ea10cc0588643842c891e334ffd30c60ce4cb'},
 @{File='meditator_male_kneel_prayer_p06b.glb';Hash='db78a1b26bff1cd2dced82d4ed4d4255280cfb6eb3db3ea2dd5ab5b5674c0701'},
 @{File='..\p5f\p02_baseline\lotus_pad_01.glb';Hash='80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9'}
)
foreach($entry in $checks){
 $file=Join-Path $here $entry.File
 if(-not(Test-Path -LiteralPath $file)){throw "Missing SHA-locked original/new GLB: $file. Use entire owner asset branch checkout, do not substitute."}
 $actual=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
 if($actual -ne $entry.Hash){throw "SHA-256 mismatch for $($entry.File): $actual expected $($entry.Hash)"}
 Write-Host "[P06B_INPUT_SHA_PASS] $($entry.File)" -ForegroundColor Green
}
if(-not $BlenderPath){$cmd=Get-Command blender.exe -ErrorAction SilentlyContinue;if($cmd){$BlenderPath=$cmd.Source}}
if(-not $BlenderPath -and ${env:ProgramFiles}){
 $parent=Join-Path ${env:ProgramFiles} 'Blender Foundation'
 if(Test-Path -LiteralPath $parent){
  $found=@(Get-ChildItem -LiteralPath $parent -Directory | ForEach-Object {Join-Path $_.FullName 'blender.exe'} | Where-Object {Test-Path -LiteralPath $_} | Sort-Object)
  if($found.Count -gt 0){$BlenderPath=$found[-1]}
 }
}
if(-not $BlenderPath -or -not(Test-Path -LiteralPath $BlenderPath)){throw 'Blender.exe unavailable. Provide -BlenderPath full path.'}
if($Samples -lt 1 -or $Size -lt 160){throw 'Invalid sample count or image size'}
$py=Join-Path $here 'blender_p06b_cycles.py'
if(-not(Test-Path -LiteralPath $py)){throw "Missing exact Blender Python $py"}
$out=Join-Path $here 'P06B_Cycles_Evidence'
if(Test-Path -LiteralPath $out){Remove-Item -LiteralPath $out -Recurse -Force}
New-Item -ItemType Directory -Force -Path $out | Out-Null
$cases=@('p06b_cross_actor','p06b_cross_pair','p06b_kneel_actor','p06b_kneel_pair')
# Old P06a Cycles image evidence already owner executed and frozen;
# no redundant re-render. P06b artist-only hair changes, 4 new cases.

foreach($case in $cases){
 $parts=$case.Split('_');$revision=$parts[0]+'_'+$parts[1];$kind=$parts[2]
 $folder=Join-Path $out $case;New-Item -ItemType Directory -Force -Path $folder|Out-Null
 $stdout=Join-Path $out ($case+'_stdout.log');$stderr=Join-Path $out ($case+'_stderr.log')
 $argv=@('--background','--factory-startup','--python-exit-code','97','--python',$py,'--',
  '--root',$here,'--out',$folder,'--revision',$revision,'--kind',$kind,'--samples',"$Samples",'--size',"$Size")
 if($Mode -eq 'quick'){$argv+='--quick'}
 Write-Host "[P06B_CYCLES_START] $case" -ForegroundColor Cyan
 # Windows PowerShell 5.1 can emit NativeCommandError on Python stderr;
 # capture the actual files and exit code. A real Blender failure still FAILS.
 $prior=$ErrorActionPreference
 try {$ErrorActionPreference='Continue'; & $BlenderPath @argv 1> $stdout 2> $stderr; $exitCode=$LASTEXITCODE}
 finally {$ErrorActionPreference=$prior}
 if($exitCode -ne 0){
  if(Test-Path $stdout){Get-Content $stdout -Tail 70}
  if(Test-Path $stderr){Get-Content $stderr -Tail 100}
  throw "Blender case failed $case exit=$exitCode. See stdout/stderr logs."
 }
 $report=Join-Path $folder 'case_report.json'
 if(-not(Test-Path -LiteralPath $report)){throw "No real report: $report"}
 $reportData=Get-Content -LiteralPath $report -Raw -Encoding UTF8 | ConvertFrom-Json
 if($reportData.images.Count -lt 1){throw "No Cycles image in $case"}
 if($revision.StartsWith('p06b_') -and ($kind -eq 'actor' -or $kind -eq 'pair')){
  if(-not $reportData.originalBlend){throw "Missing editable male .blend for $case"}
  $blend=Join-Path $folder $reportData.originalBlend.file
  if(-not(Test-Path $blend)){throw "Missing real .blend $blend"}
  if((Get-FileHash $blend -Algorithm SHA256).Hash.ToLowerInvariant() -ne $reportData.originalBlend.sha256){throw "Editable .blend SHA mismatch $blend"}
 }
 foreach($im in $reportData.images){
  $png=Join-Path $folder $im.file
  if(-not(Test-Path -LiteralPath $png)){throw "Missing Cycles image $png"}
  if((Get-Item -LiteralPath $png).Length -ne $im.bytes){throw "Bytes mismatch $png"}
  if((Get-FileHash -LiteralPath $png -Algorithm SHA256).Hash.ToLowerInvariant() -ne $im.sha256){throw "SHA mismatch $png"}
 }
 Write-Host "[P06B_CYCLES_DONE] $case images=$($reportData.images.Count)" -ForegroundColor Green
}
$shafile=Join-Path $out 'FILE_HASHES_SHA256.txt'
Get-ChildItem -LiteralPath $out -Recurse -File | Where-Object {$_.FullName -ne $shafile} | Sort-Object FullName | ForEach-Object {
 $h=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
 "$h  $($_.FullName.Substring($out.Length+1))"
} | Set-Content -LiteralPath $shafile -Encoding UTF8
$zip=Join-Path $here 'P06B_MALE_HAIR_Blender_Cycles_Evidence.zip'
if(Test-Path -LiteralPath $zip){Remove-Item -LiteralPath $zip -Force}
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -CompressionLevel Optimal
Write-Host "[P06B_OWNER_CYCLES_ZIP] $zip" -ForegroundColor Green
$crcPy=Join-Path $here 'validate_p06b_zip_crc.py'
if(-not(Test-Path $crcPy)){throw "Missing CRC check: $crcPy"}
$crcStdout=Join-Path $here 'P06B_ZIP_CRC_stdout.log'
$crcStderr=Join-Path $here 'P06B_ZIP_CRC_stderr.log'
$crcArgv=@('--background','--factory-startup','--python-exit-code','97','--python',$crcPy,'--',$zip)
$prior=$ErrorActionPreference
try {$ErrorActionPreference='Continue'; & $BlenderPath @crcArgv 1> $crcStdout 2> $crcStderr; $crcExit=$LASTEXITCODE}
finally {$ErrorActionPreference=$prior}
if($crcExit -ne 0){
 if(Test-Path $crcStdout){Get-Content $crcStdout -Tail 60}
 if(Test-Path $crcStderr){Get-Content $crcStderr -Tail 60}
 throw "P06B ZIP CRC failure code=$crcExit"
}
if(-not((Get-Content $crcStdout -Raw -ErrorAction SilentlyContinue) -match 'P06B_ZIP_CRC_PASS')){throw 'No real ZIP CRC PASS marker'}
Write-Host "[P06B_ZIP_CRC_PASS] $((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant())" -ForegroundColor Green
Write-Host 'Send original P06B Cycles ZIP + four editable .blend files; old P06A original Cycles retained. STOP SA -> owner male hair gate. No Codex/integration/GPU/merge.'
