#requires -Version 5.1
<# Windows: original GLB P0.3 vs P0.4 matched Blender Cycles; source editable .blend.
   No repo/main/Codex edits; all evidence from actual user execution, never fabricated. #>
param(
 [ValidateSet('quick','all')][string]$Mode='quick',
 [int]$Samples=32, [int]$Size=520,
 [string]$BlenderPath=''
)
$ErrorActionPreference='Stop';$root=$PSScriptRoot
$checks=@(
 @{Name='P0.3 actor';File='p03_baseline\meditator_base.glb';Sha='646842c7574976020f6583c4e18879c9bef012e5f31dc851589c0a1491786be0'},
 @{Name='P0.2 leaf';File='p02_baseline\lotus_pad_01.glb';Sha='80f572c35ab7cd9db98076b656fe3902d08c1a20e5d5f2149b2e78d7538cc0c9'},
 @{Name='P0.4 female';File='meditator_female_ao_ba_ba_p04.glb';Sha='586134fdeab962f35458c16255985513b070da47195110d3c83eef2dd9b6be09'}
)
foreach($f in $checks){
 $p=Join-Path $root $f.File
 if(-not(Test-Path -LiteralPath $p)){throw "Missing source GLB $($f.Name): $p"}
 $actual=(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
 if($actual -ne $f.Sha){throw "SHA MISMATCH $($f.Name) actual=$actual expected=$($f.Sha)"}
 Write-Host "[P04 SHA PASS] $($f.Name)" -ForegroundColor Green
}
if(-not $BlenderPath){$b=Get-Command blender.exe -ErrorAction SilentlyContinue;if($b){$BlenderPath=$b.Source}}
if(-not $BlenderPath -and $env:ProgramFiles){
 $base=Join-Path $env:ProgramFiles 'Blender Foundation'
 if(Test-Path $base){$candidates=@(Get-ChildItem -LiteralPath $base -Directory | ForEach-Object {Join-Path $_.FullName 'blender.exe'} | Where-Object {Test-Path $_} | Sort-Object);if($candidates.Count){$BlenderPath=$candidates[-1]}}
}
if(-not $BlenderPath -or -not(Test-Path $BlenderPath)){throw 'Blender.exe not found. Specify -BlenderPath with exact executable path.'}
$script=Join-Path $root 'blender_p04_cycles.py'
if(-not(Test-Path $script)){throw "Missing Blender Python script $script"}
$out=Join-Path $root 'P04_Cycles_Evidence'
if(Test-Path $out){Remove-Item -LiteralPath $out -Recurse -Force}
New-Item -ItemType Directory -Path $out -Force | Out-Null
$cases=@('p03_actor','p04_actor','p03_pair','p04_pair','p04_palette')
if($Mode -eq 'quick'){$cases=@('p03_actor','p04_actor','p04_pair')}
foreach($case in $cases){
 $parts=$case.Split('_');$revision=$parts[0];$kind=$parts[1]
 $folder=Join-Path $out $case;New-Item -ItemType Directory -Path $folder -Force | Out-Null
 $args=@('--background','--factory-startup','--python-exit-code','97','--python',$script,'--','--root',$root,'--out',$folder,'--revision',$revision,'--kind',$kind,'--samples',"$Samples",'--size',"$Size")
 if($Mode -eq 'quick'){$args+='--quick'}
 $stdout=Join-Path $out ($case+'_stdout.log');$stderr=Join-Path $out ($case+'_stderr.log')
 $old=$ErrorActionPreference
 try{$ErrorActionPreference='Continue'; & $BlenderPath @args 1> $stdout 2> $stderr;$code=$LASTEXITCODE}
 finally{$ErrorActionPreference=$old}
 if($code -ne 0){
  if(Test-Path $stdout){Get-Content $stdout -Tail 70}
  if(Test-Path $stderr){Get-Content $stderr -Tail 120}
  throw "Blender failed for $case exit=$code. Logs: $stderr"
 }
 if(-not(Test-Path (Join-Path $folder 'case_report.json'))){throw "Missing report $case"}
 Write-Host "[P04 CYCLES COMPLETE] $case" -ForegroundColor Green
}
$hashfile=Join-Path $out 'SHA256_FILES.txt'
Get-ChildItem -LiteralPath $out -Recurse -File | Where-Object {$_.FullName -ne $hashfile} | Sort-Object FullName | ForEach-Object {
 "$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant())  $($_.FullName.Substring($out.Length+1))"
} | Set-Content -LiteralPath $hashfile -Encoding UTF8
$zip=Join-Path $root 'P04_FEMALE_Blender_Cycles_Evidence.zip'
if(Test-Path $zip){Remove-Item $zip -Force}
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -CompressionLevel Optimal
Write-Host "[P04 ZIP CREATED] $zip" -ForegroundColor Green
Write-Host 'P0.4 Cycles must be reviewed by SA; owner must explicitly approve female visual before male stage.'
