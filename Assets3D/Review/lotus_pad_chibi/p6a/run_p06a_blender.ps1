#requires -Version 5.1
<# OnlinePagodaVer2 P0.6a owner Cycles 8-case A/B male-female cross+both kneel, 2 optional six-palette cases.
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
 @{File='..\p5f\meditator_female_cross_prayer_p05f.glb';Hash='3ed6946640ed057868b64a9998b1c3a4bf30f28866b3e0c1de9a9ab55c5cc1a4'},
 @{File='..\p5c\meditator_female_kneel_prayer_p05c.glb';Hash='a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac'},
 @{File='meditator_male_cross_prayer_p06a.glb';Hash='c684934ff2ceb8da08265fcc8304f2684255f144dc7df94819f007c5e803cb61'},
 @{File='meditator_male_kneel_prayer_p06a.glb';Hash='9aad5f3f4d1b84d0a9ffb2cda3bc01b39ece676318ba883e417f7337e9d2251e'},
 @{File='..\p5f\p02_baseline\lotus_pad_01.glb';Hash='80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9'}
)
foreach($entry in $checks){
 $file=Join-Path $here $entry.File
 if(-not(Test-Path -LiteralPath $file)){throw "Missing exact original GLB: $file. Copy ONLY frozen p3 lotus_pad_01.glb to p02_baseline."}
 $actual=(Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
 if($actual -ne $entry.Hash){throw "SHA-256 mismatch for $($entry.File): $actual expected $($entry.Hash)"}
 Write-Host "[P06A_INPUT_SHA_PASS] $($entry.File)" -ForegroundColor Green
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
$py=Join-Path $here 'blender_p06a_cycles.py'
if(-not(Test-Path -LiteralPath $py)){throw "Missing exact Blender Python $py"}
$out=Join-Path $here 'P06A_Cycles_Evidence'
if(Test-Path -LiteralPath $out){Remove-Item -LiteralPath $out -Recurse -Force}
New-Item -ItemType Directory -Force -Path $out | Out-Null
$cases=@('female_cross_actor','male_cross_actor','female_cross_pair','male_cross_pair',
         'female_kneel_actor','male_kneel_actor','female_kneel_pair','male_kneel_pair')
if($Mode -eq 'all'){$cases+=@('male_cross_palette','male_kneel_palette')}
foreach($case in $cases){
 $parts=$case.Split('_');$revision=$parts[0]+'_'+$parts[1];$kind=$parts[2]
 $folder=Join-Path $out $case;New-Item -ItemType Directory -Force -Path $folder|Out-Null
 $stdout=Join-Path $out ($case+'_stdout.log');$stderr=Join-Path $out ($case+'_stderr.log')
 $argv=@('--background','--factory-startup','--python-exit-code','97','--python',$py,'--',
  '--root',$here,'--out',$folder,'--revision',$revision,'--kind',$kind,'--samples',"$Samples",'--size',"$Size")
 if($Mode -eq 'quick'){$argv+='--quick'}
 Write-Host "[P06A_CYCLES_START] $case" -ForegroundColor Cyan
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
 if($revision.StartsWith('male_') -and ($kind -eq 'actor' -or $kind -eq 'pair')){
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
 Write-Host "[P06A_CYCLES_DONE] $case images=$($reportData.images.Count)" -ForegroundColor Green
}
$shafile=Join-Path $out 'FILE_HASHES_SHA256.txt'
Get-ChildItem -LiteralPath $out -Recurse -File | Where-Object {$_.FullName -ne $shafile} | Sort-Object FullName | ForEach-Object {
 $h=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
 "$h  $($_.FullName.Substring($out.Length+1))"
} | Set-Content -LiteralPath $shafile -Encoding UTF8
$zip=Join-Path $here 'P06A_MALE_TWO_POSE_Blender_Cycles_Evidence.zip'
if(Test-Path -LiteralPath $zip){Remove-Item -LiteralPath $zip -Force}
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -CompressionLevel Optimal
Write-Host "[P06A_OWNER_CYCLES_ZIP] $zip" -ForegroundColor Green
Write-Host 'Send original Cycles ZIP + four actual male editable .blend files to SA. Both approved females/lotus frozen. STOP no Codex/integration/GPU/merge.'
