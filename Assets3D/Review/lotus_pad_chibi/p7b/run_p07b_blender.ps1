#requires -Version 5.1
<# P07b owner Cycles ONLY 4 NEW cases; no P06c or P07a1 re-render, no destructive deletion.
   Smoke -> human art review -> full. SHA-locked true P07b GLB2 reimports + original P02 lotus.
   Zero paid tools. Existing evidence folders never silently overwritten. #>
param(
 [ValidateSet('smoke','all')][string]$Mode='smoke',
 [switch]$ArtSmokeAccepted,
 [int]$Samples=32,
 [int]$Size=720,
 [string]$BlenderPath=''
)
$ErrorActionPreference='Stop'
$here=$PSScriptRoot
$verify=@(
 @{File='meditator_male_cross_prayer_sidepart73_p07b.glb';Hash='1238f5fba9f7cfea0c550fabdc26446905f6e403e558793fb726251d4fec08cb'},
 @{File='meditator_male_kneel_prayer_sidepart73_p07b.glb';Hash='2bb7430c4da4c58c6ee986a741ff79d3865f581c046003ce0770e80af345b3f2'},
 @{File='..\p5f\p02_baseline\lotus_pad_01.glb';Hash='80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9'}
)
foreach($item in $verify){
 $p=Join-Path $here $item.File
 if(!(Test-Path -LiteralPath $p)){throw "Missing SHA-pinned input: $p"}
 $hash=(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
 if($hash -ne $item.Hash){throw "SHA mismatch $p $hash expected $($item.Hash)"}
 Write-Host "[P07B_INPUT_SHA_PASS] $($item.File)" -ForegroundColor Green
}
if($Mode -eq 'all'){
 if(-not $ArtSmokeAccepted){throw 'STOP: inspect smoke front/top/side and both real 720x1280 lotus PNG first. Retry with -ArtSmokeAccepted only after real human art inspection.'}
 $smoke=Join-Path $here 'P07B_Smoke_Evidence'
 foreach($r in @('p07b_cross_actor','p07b_cross_pair','p07b_kneel_actor','p07b_kneel_pair')){
  if(!(Test-Path (Join-Path (Join-Path $smoke $r) 'case_report.json'))){throw "Missing genuine preflight smoke report for $r"}
 }
}
if($Samples -lt 1 -or $Size -lt 160){throw 'Invalid samples or size'}
if(-not $BlenderPath){$cmd=Get-Command blender.exe -ErrorAction SilentlyContinue;if($cmd){$BlenderPath=$cmd.Source}}
if(-not $BlenderPath -and ${env:ProgramFiles}){
 $parent=Join-Path ${env:ProgramFiles} 'Blender Foundation'
 if(Test-Path $parent){
  $found=@(Get-ChildItem $parent -Directory | ForEach-Object {Join-Path $_.FullName 'blender.exe'} | Where-Object {Test-Path $_} | Sort-Object)
  if($found.Count -gt 0){$BlenderPath=$found[-1]}
 }
}
if(-not $BlenderPath -or !(Test-Path $BlenderPath)){throw 'Blender executable unavailable. Pass -BlenderPath full path.'}
$py=Join-Path $here 'blender_p07b_cycles.py'
if(!(Test-Path $py)){throw 'Missing Blender Python source'}
$dirname=if($Mode -eq 'smoke'){'P07B_Smoke_Evidence'}else{'P07B_Cycles_Evidence'}
$out=Join-Path $here $dirname
if(Test-Path -LiteralPath $out){throw "NON_DESTRUCTIVE_STOP: evidence folder already exists: $out. Inspect or manually version old evidence; no overwrites."}
New-Item -ItemType Directory -Path $out | Out-Null
$cases=@('p07b_cross_actor','p07b_cross_pair','p07b_kneel_actor','p07b_kneel_pair')
foreach($case in $cases){
 $parts=$case.Split('_');$revision=$parts[0]+'_'+$parts[1];$kind=$parts[2]
 $dest=Join-Path $out $case;New-Item -ItemType Directory $dest | Out-Null
 $stdout=Join-Path $out ($case+'_stdout.log');$stderr=Join-Path $out ($case+'_stderr.log')
 $argv=@('--background','--factory-startup','--python-exit-code','97','--python',$py,'--',
  '--root',$here,'--out',$dest,'--revision',$revision,'--kind',$kind,'--samples',"$Samples",'--size',"$Size")
 if($Mode -eq 'smoke'){$argv+='--quick'}
 Write-Host "[P07B_NEW_ONLY_CASE_START] $case" -ForegroundColor Cyan
 $prior=$ErrorActionPreference
 try {$ErrorActionPreference='Continue'; & $BlenderPath @argv 1> $stdout 2> $stderr; $exitCode=$LASTEXITCODE}
 finally {$ErrorActionPreference=$prior}
 if($exitCode -ne 0){
  Get-Content -LiteralPath $stdout -Tail 60 -ErrorAction SilentlyContinue
  Get-Content -LiteralPath $stderr -Tail 80 -ErrorAction SilentlyContinue
  throw "Blender case failed: $case exit=$exitCode"
 }
 $report=Join-Path $dest 'case_report.json'
 if(!(Test-Path $report)){throw "Missing real report $report"}
 $caseData=Get-Content -LiteralPath $report -Raw -Encoding UTF8 | ConvertFrom-Json
 if(@($caseData.images).Count -lt 1){throw "Missing real PNG entries $case"}
 if(!$caseData.originalBlend){throw "Missing editable .blend metadata for $case"}
 $blend=Join-Path $dest $caseData.originalBlend.file
 if(!(Test-Path $blend)){throw "No editable .blend $blend"}
 if((Get-FileHash $blend -Algorithm SHA256).Hash.ToLowerInvariant() -ne $caseData.originalBlend.sha256){throw 'Blend hash mismatch'}
 $images=@($caseData.images)
 if($caseData.diagnosticImagesNotArtApproval){$images+=@($caseData.diagnosticImagesNotArtApproval)}
 foreach($im in $images){
  $file=Join-Path $dest $im.file
  if(!(Test-Path $file)){throw "Missing PNG $file"}
  if((Get-Item $file).Length -ne $im.bytes){throw "PNG byte mismatch $file"}
  if((Get-FileHash $file -Algorithm SHA256).Hash.ToLowerInvariant() -ne $im.sha256){throw "PNG hash mismatch $file"}
 }
 Write-Host "[P07B_CASE_SHA_PASS] $case" -ForegroundColor Green
}
$hashes=Join-Path $out 'FILE_HASHES_SHA256.txt'
Get-ChildItem -LiteralPath $out -Recurse -File | Sort-Object FullName | ForEach-Object {
 "$( (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant() )  $($_.FullName.Substring($out.Length+1))"
} | Set-Content -LiteralPath $hashes -Encoding UTF8
if($Mode -eq 'smoke'){
 Write-Host 'P07B_SMOKE_READY_FOR_VISUAL_REVIEW — Examine front, top, left, right, back and both lotus 720x1280 BEFORE full -Mode all.' -ForegroundColor Yellow
 exit 0
}
$zip=Join-Path $here 'P07B_SIDE_PART_73_Blender_Cycles_Evidence.zip'
if(Test-Path $zip){throw 'NON_DESTRUCTIVE_STOP: existing ZIP; never silently replace owner evidence'}
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -CompressionLevel Optimal
$crc=Join-Path $here 'validate_p07b_zip_crc.py'
$crcOut=Join-Path $here 'P07B_ZIP_CRC_stdout.log';$crcErr=Join-Path $here 'P07B_ZIP_CRC_stderr.log'
if((Test-Path $crcOut) -or (Test-Path $crcErr)){throw 'NON_DESTRUCTIVE_STOP: existing CRC log'}
$argv=@('--background','--factory-startup','--python-exit-code','97','--python',$crc,'--',$zip)
$prior=$ErrorActionPreference
try {$ErrorActionPreference='Continue'; & $BlenderPath @argv 1> $crcOut 2> $crcErr; $exitCode=$LASTEXITCODE}
finally {$ErrorActionPreference=$prior}
if($exitCode -ne 0){throw "P07B ZIP CRC validator failed exit=$exitCode"}
if(!((Get-Content $crcOut -Raw) -match '\[P07B_ZIP_CRC_PASS\]')){throw 'P07B CRC PASS marker missing'}
Write-Host '[P07B_FULL_NEW_ONLY_EVIDENCE_COMPLETE] 4 new cases ONLY. Send ZIP and real originals for SA review. No old P blender run, no merge.' -ForegroundColor Green
