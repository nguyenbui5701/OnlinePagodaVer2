#requires -Version 5.1
<# Sakura R12 controlled Blender Cycles A/B: original GLB / AgX / same dusk rig.
   Corrected variables: never assign $home (PowerShell $HOME is read-only).
   This script is authored for owner's Windows Blender; NOT run here. #>
param(
 [ValidateSet('quick','all')][string]$Mode='quick',
 [int]$Samples=32,
 [int]$Size=520,
 [string]$BlenderPath=''
)
$ErrorActionPreference='Stop'
$rootDir=$PSScriptRoot
$cases=@(
 @{Name='r10_palette_only';File='r10_palette_only.glb';Hash='a9f178d1a4d6c4e0b5b969ab25a7fe0462d1284a06ac3a89abd761094420dd41'},
 @{Name='r11_final';File='r11_final.glb';Hash='584d95eb9467c8342d018a4a0331f8205b20f042325ef82b56d1bd8daddab375'},
 @{Name='r12_final';File='sakura_hero.glb';Hash='0e1f656c74a3f7860cb640395d95cebdb852d7e1269f1463e04408aa6bc8bb25'},
 @{Name='eco';File='sakura_hero_eco.glb';Hash='accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173'}
)
if(-not $BlenderPath){
 $found=Get-Command blender.exe -ErrorAction SilentlyContinue
 if($found){$BlenderPath=$found.Source}
}
if(-not $BlenderPath){
 $blenderInstallDir=Join-Path ${env:ProgramFiles} 'Blender Foundation'
 if(Test-Path $blenderInstallDir){
  $installed=@(Get-ChildItem $blenderInstallDir -Directory | ForEach-Object {
   Join-Path $_.FullName 'blender.exe'
  } | Where-Object {Test-Path $_} | Sort-Object)
  if($installed.Count -gt 0){$BlenderPath=$installed[-1]}
 }
}
if(-not $BlenderPath -or -not (Test-Path $BlenderPath)){
 throw 'blender.exe not found. Pass -BlenderPath with your actual installed executable path.'
}
Write-Host "[BLENDER] $BlenderPath"
if($Samples -lt 1 -or $Size -lt 128){throw 'Samples must be >=1 and Size >=128'}
$selected=$cases
if($Mode -eq 'quick'){$selected=@($cases[0],$cases[2])}
foreach($entry in $selected){
 $source=Join-Path $rootDir $entry.File
 if(-not(Test-Path -LiteralPath $source)){throw "Missing GLB: $source"}
 $actual=(Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
 if($actual -ne $entry.Hash){throw "SHA256 mismatch in $($entry.File): $actual"}
 Write-Host "[VERIFIED R12 INPUT] $($entry.Name) $actual"
}
$outRoot=Join-Path $rootDir 'Blender_Evidence_R12'
New-Item -ItemType Directory -Force -Path $outRoot | Out-Null
$py=Join-Path $rootDir 'blender_ab_validate_r12.py'
if(-not (Test-Path $py)){throw "Missing Blender script $py"}
foreach($entry in $selected){
 $name=$entry.Name
 $target=Join-Path $outRoot $name
 New-Item -ItemType Directory -Force -Path $target | Out-Null
 $args=@('--background','--factory-startup','--python',$py,'--','--model',(Join-Path $rootDir $entry.File),'--out',$target,'--case',$name,'--samples',"$Samples",'--size',"$Size")
 if($Mode -eq 'quick'){$args+= '--quick'}
 Write-Host "[R12 RENDER START] $name Samples=$Samples Size=$Size"
 & $BlenderPath @args 1> (Join-Path $outRoot ($name+'_stdout.log')) 2> (Join-Path $outRoot ($name+'_stderr.log'))
 if($LASTEXITCODE -ne 0){
  Get-Content (Join-Path $outRoot ($name+'_stderr.log')) -Tail 35
  Get-Content (Join-Path $outRoot ($name+'_stdout.log')) -Tail 35
  throw "Blender failed for $name : exit code $LASTEXITCODE"
 }
 $report=Join-Path $target ($name+'_report.json')
 if(-not (Test-Path $report)){throw "Missing case JSON report: $report"}
 Write-Host "[R12 RENDER COMPLETE] $name"
}
# Do not include the original 4 GLBs in evidence ZIP, they are checksummed in each case JSON.
$hashFile=Join-Path $outRoot 'FILE_HASHES_SHA256.txt'
Get-ChildItem -LiteralPath $outRoot -Recurse -File | Where-Object { $_.FullName -ne $hashFile } |
 ForEach-Object { "$(Get-FileHash $_.FullName -Algorithm SHA256 | Select-Object -ExpandProperty Hash)  $($_.FullName.Substring($outRoot.Length+1))" } |
 Set-Content -LiteralPath $hashFile -Encoding UTF8
$archive=Join-Path $rootDir 'Sakura_R12_Blender_Evidence_Cycles.zip'
if(Test-Path $archive){Remove-Item $archive -Force}
Compress-Archive -Path (Join-Path $outRoot '*') -DestinationPath $archive -CompressionLevel Optimal
Write-Host "[R12 EVIDENCE ZIP] $archive"
Write-Host 'Upload evidence ZIP and, if requested, both editable .blend files for independent review.'
Write-Host 'Do NOT claim Cycles R12 PASS until these renders and reports are verified.'
