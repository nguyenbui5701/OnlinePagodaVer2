#requires -Version 5.1
<# Sakura Hero R11 native Blender Cycles A/B; owner-run, zero-cost.
   This launcher HAS NOT BEEN executed by AI Visual on Windows/Blender.
   Never change R10/R11 inputs, look settings or material nodes silently.
#>
[CmdletBinding()]
param(
 [string]$BlenderPath = '',
 [ValidateSet('quick','all')][string]$Mode='quick',
 [ValidateRange(1,1024)][int]$Samples=8,
 [ValidateRange(128,2048)][int]$Size=320
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonScript=Join-Path $root 'blender_ab_validate_r11.py'
$expected=@{
    "r10_albedo_only.glb" = @{ sha256 = "d00c135c64ba5974905f7740be2be5af7c7f116b23b3d0a1d628a74d3f773fe8"; bytes = 5096508 }
    "r10_emissive_only.glb" = @{ sha256 = "7b874521b49baea66a7041eeb43b4ec77a7c491e80761acf9fbcc26cfe7b774f"; bytes = 5096560 }
    "r10_palette_only.glb" = @{ sha256 = "a9f178d1a4d6c4e0b5b969ab25a7fe0462d1284a06ac3a89abd761094420dd41"; bytes = 5096532 }
    "r10_sakura_hero.glb" = @{ sha256 = "ac4322fb00475d0dde3334a375fca0e0094715583edf7f6460b30a9139b1e273"; bytes = 5096052 }
    "r11_geometry_only.glb" = @{ sha256 = "ea4fedb6024c3a9d0345cec6af532ceea87dbcb32b98347247a38c2aa82b811e"; bytes = 7600372 }
    "sakura_hero.glb" = @{ sha256 = "584d95eb9467c8342d018a4a0331f8205b20f042325ef82b56d1bd8daddab375"; bytes = 7599884 }
    "sakura_hero_eco.glb" = @{ sha256 = "accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173"; bytes = 1393492 }

}
$caseInput=@{
 'r10_baseline'='r10_sakura_hero.glb'
 'r10_emissive_only'='r10_emissive_only.glb'
 'r10_albedo_only'='r10_albedo_only.glb'
 'r10_palette_only'='r10_palette_only.glb'
 'r11_geometry_only'='r11_geometry_only.glb'
 'r11_final'='sakura_hero.glb'
 'eco'='sakura_hero_eco.glb'
 'r10_standard'='r10_sakura_hero.glb'
 'r10_light75'='r10_sakura_hero.glb'
}
$allCases=@('r10_baseline','r10_emissive_only','r10_albedo_only','r10_palette_only','r11_geometry_only','r11_final','eco','r10_standard','r10_light75')
$runCases=if($Mode -eq 'quick') {@('r10_baseline','r10_emissive_only','r10_albedo_only','r11_final','eco')} else {$allCases}
if(-not (Test-Path -LiteralPath $pythonScript -PathType Leaf)){throw 'Missing blender_ab_validate_r11.py'}
foreach($file in $expected.Keys){
 $p=Join-Path $root $file
 if(-not (Test-Path -LiteralPath $p -PathType Leaf)){throw "Missing input: $p"}
 $expectedItem=$expected[$file]
 $real=(Get-Item -LiteralPath $p).Length
 $actual=(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLowerInvariant()
 if($real -ne $expectedItem.bytes -or $actual -ne $expectedItem.sha256){
  throw "SOURCE HASH ERROR for $file; expected $($expectedItem.sha256), actual $actual, stop."
 }
 Write-Host "[VERIFIED] $file $real $actual" -ForegroundColor Green
}
if(-not $BlenderPath){
 $cmd=Get-Command blender -ErrorAction SilentlyContinue
 if($cmd){$BlenderPath=$cmd.Source}
}
if(-not $BlenderPath){
 $home=Join-Path $env:ProgramFiles 'Blender Foundation'
 if(Test-Path -LiteralPath $home){
  $candidates=@(Get-ChildItem -LiteralPath $home -Directory -ErrorAction SilentlyContinue |
   ForEach-Object {Join-Path $_.FullName 'blender.exe'} |
   Where-Object {Test-Path -LiteralPath $_})
  if($candidates.Count -gt 0){$BlenderPath=$candidates[-1]}
 }
}
if(-not $BlenderPath -or -not (Test-Path -LiteralPath $BlenderPath -PathType Leaf)){
 throw 'Blender executable not found. Use -BlenderPath with the real installed blender.exe path.'
}
Write-Host "[BLENDER] $BlenderPath" -ForegroundColor Cyan
$dest=Join-Path $root 'Blender_Evidence_R11_AB'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
(& $BlenderPath --version 2>&1 | Select-Object -First 5 | Out-String) | Set-Content -LiteralPath (Join-Path $dest 'BLENDER_VERSION.txt')
foreach($c in $runCases){
 $source=Join-Path $root $caseInput[$c]
 $out=Join-Path $dest $c
 New-Item -ItemType Directory -Force -Path $out | Out-Null
 $stdout=Join-Path $dest ($c+'_stdout.log')
 $stderr=Join-Path $dest ($c+'_stderr.log')
 $args='--background --factory-startup --python-exit-code 3 --python "'+$pythonScript+'" -- --model "'+$source+'" --out "'+$out+'" --case '+$c+' --samples '+$Samples+' --size '+$Size
 Write-Host "[RENDER START] $c samples=$Samples size=$Size" -ForegroundColor Cyan
 $proc=Start-Process -FilePath $BlenderPath -ArgumentList $args -Wait -PassThru -NoNewWindow -RedirectStandardOutput $stdout -RedirectStandardError $stderr
 if($proc.ExitCode -ne 0){
  Get-Content -LiteralPath $stdout -Tail 30
  if(Test-Path $stderr){Get-Content -LiteralPath $stderr -Tail 30}
  throw "Blender failed for case $c, exit code $($proc.ExitCode)"
 }
 $report=Join-Path $out ($c+'_report.json')
 if(-not(Test-Path -LiteralPath $report -PathType Leaf)){throw "Missing report for $c"}
 $jr=Get-Content -LiteralPath $report -Raw -Encoding UTF8 | ConvertFrom-Json
 if($jr.sourceSha256 -ne $expected[$caseInput[$c]].sha256){throw "Mismatch report source SHA for $c"}
 foreach($img in $jr.images){
  $im=Join-Path $out $img.name
  if(-not(Test-Path -LiteralPath $im -PathType Leaf)){throw "Missing output image: $im"}
  $imHash=(Get-FileHash -LiteralPath $im -Algorithm SHA256).Hash.ToLowerInvariant()
  if($imHash -ne $img.sha256){throw "Image checksum mismatch: $im"}
 }
 Write-Host "[RENDER DONE] $c images=$($jr.images.Count)" -ForegroundColor Green
}
$audit=Join-Path $dest 'FILE_HASHES_SHA256.txt'
$lines=New-Object System.Collections.Generic.List[string]
$lines.Add('Blender Cycles A/B R10/R11. Runs here only, not guaranteed production parity.')
$lines.Add("Mode=$Mode Samples=$Samples Size=$Size")
Get-ChildItem -LiteralPath $dest -File -Recurse | Where-Object { $_.Name -ne 'FILE_HASHES_SHA256.txt' } | ForEach-Object {
 $lines.Add((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()+'  '+$_.FullName)
}
$lines | Set-Content -LiteralPath $audit -Encoding UTF8
$stage=Join-Path $dest 'SEND_TO_AI_VISUAL'
New-Item -ItemType Directory -Force -Path $stage | Out-Null
Get-ChildItem -LiteralPath $dest -File | Copy-Item -Destination $stage -Force
foreach($c in $runCases){
 $src=Join-Path $dest $c; $dst=Join-Path $stage $c
 New-Item -ItemType Directory -Force -Path $dst | Out-Null
 Get-ChildItem -LiteralPath $src -File | Where-Object {$_.Extension -in @('.png','.json')} | Copy-Item -Destination $dst
}
$zip=Join-Path $root 'Sakura_R11_Blender_Evidence_AB.zip'
if(Test-Path -LiteralPath $zip){Remove-Item -LiteralPath $zip -Force}
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal
Write-Host "[DONE] Evidence ZIP: $zip" -ForegroundColor Green
Write-Host 'Also upload two .blend files from Blender_Evidence_R11_AB\r11_final and \eco separately.'
Write-Host 'Do not claim Blender/ThreeJS/FPS PASS without independent review of evidence.'
