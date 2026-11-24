# Sakura R17 — SA follow-up / PR #18

Authoritative [SA review #6032823643](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/18#pullrequestreview-6032823643) at `36c9e327c37441a7c5406068f9aecd291e52d437`; task AI Visual 16 §7. Frozen PR #1 base `d9dbeb6a81d1e667d471b8f62910829bb1ce2bd9`; read-only PR #17 `1201369e019f6ba04f7437c7dac347e56894ba2a`. Same artist branch only, cost 0 VND.

**R17_NATIVE_BUILD_EVIDENCE_PASS / R17_ART_PARTIAL / R17_BINARY_SA_VERIFICATION_PENDING / MERGE_HOLD.** Owner final R17 Art GO PENDING. Git tree contains both GLBs, editable Blender and 24 native Cycles PNGs. Sizes match the owner build/PNG ledger; the SHA-256 values below are owner-reported, not independently decoded by SA. Metadata-only reconciliation and read-only evidence scripts; no geometry, renderer or original evidence changes.

## Actual inventory and measurements

| Artifact | Bytes | Owner SHA-256 | Git blob SHA |
|---|---:|---|---|
| `sakura_hero_r17.glb` | 17851064 | `4115ba647eaa960e5fd2e9949462b52a2010231bf84ac25b574447bd36c5a73f` | `8d9e45711d2677ab400436a459e8630ed8428a32` |
| `sakura_hero_r17_eco.glb` | 3854076 | `cc07824bef901d30ce833880ab835027d027f15ab26eb327e6b6d6bb46d2d679` | `e2de5ae499e9f369e3f3becc728d08fc13552cde` |
| `sakura_hero_r17_editable.blend` | 31319198 | `8fadb16d1458f21fe95e63e00c2dc6a1feaba8aaa19e0d861b7fb2a44076beb9` | `4f931ac7cff55393ab17cb48d5f152c01cc93787` |

| Profile | R16 triangles | R17 triangles | Added flowers | R17 meshes/materials | File size ratio |
|---|---:|---:|---:|---:|---:|
| QUALITY | 191288 | 220088 | 1200 | 12/15 | 3.53x |
| ECO | 44412 | 49452 | 420 | 11/14 | 2.77x |

Original R16 native checksum gate and R17 export/import reported PASS by owner; 24 matched 720×1280 CPU Cycles frames (32 samples, 6 views × 2 profiles × 2 revisions) are indexed in [cycles_manifest.json](R17_Cycles_Evidence/cycles_manifest.json). All 24 Git sizes match. Stdout 146982 bytes, empty stderr, final marker `R17_NATIVE_BUILD_COMPLETE R17_LOCAL_BUILD_WITH_NATIVE_CYCLES 24 PNG`. Source: [R17_BUILD_RESULT.json](R17_BUILD_RESULT.json). No textures/images/animations/cameras reported. Full world XYZ bounds not reported; original bottom only QUALITY -0.518381 m / ECO -1.026049 m. Do not treat these as full bounds or verified root invariant.

## SA blockers and next actions (no rerender)

1. **P0 handoff:** this README, manifest, BINARY_HANDOFF and PR description now reflect existing artifacts, not pending generation.
2. **P0 binary/compatibility:** SA cannot retrieve large binary payloads and container git DNS is blocked. Run the new read-only Blender audit: verifies exact R16/R17 SHA, GLB2 chunks/accessors/indices/finite coordinates, triangle degeneracy count, full world XYZ bounds, transforms, protected wood/branch/gold triangle multisets (0.1 mm quantization) and imported PBR, reopens existing .blend with separate ECO/QUALITY collections. No export/save/render. These are proposed checks; results pending. Original R16 .blend not independently opened; 45/68 secondary contact proxy remains unresolved.
3. **P1 bytes/art:** reported file sizes grow much more than triangles. Audit provides actual logical POSITION/NORMAL/INDEX/other accessor sizes, primitive vertex records and BIN chunk totals. Hypotheses include flat/split normals, material seams and index width; do not assert cause before measurement. No arbitrary byte cap, no destructive optimization. SA saw ECO full/trunk pairs: original bark silhouette looks preserved; darker new flowers but canopy masses still similar. QUALITY/other views need accessible evidence. Six JPEG contact sheets (one per view, both profiles, matched R16/R17), each below 1 MiB, will be derived from original SHA-checked PNGs. Pixel differences are a proxy, not true canopy coverage or depth proof. No change to originals.

## Run only the follow-up checks

From the existing clean R17 artist worktree, inside the r17-lush directory:

```powershell
git pull --ff-only origin assets/sakura-hero-r17-lush
$Blender = Get-ChildItem "C:\Program Files\Blender Foundation" -Filter blender.exe -Recurse | Select-Object -First 1 -ExpandProperty FullName
$script = (Resolve-Path .\audit_r17_read_only.py).Path
$p = Start-Process -FilePath $Blender -ArgumentList @('--background','--python-exit-code','17','--python',('"{0}"' -f $script)) -Wait -PassThru -NoNewWindow -RedirectStandardOutput ".\R17_audit_stdout.log" -RedirectStandardError ".\R17_audit_stderr.log"
if ($p.ExitCode -ne 0) { Get-Content .\R17_audit_stderr.log -Tail 100; throw "R17 audit failed" }
py -m pip install Pillow
py .\make_r17_review_sheets.py
```

Review `R17_READ_ONLY_AUDIT.json` for bounds/degeneracy/mismatch counts, `R17_Review_Sheets/sheet_manifest.json` and six JPEGs. A successful script execution does not equal compatibility or art PASS. If any mismatch, report it and stop, no source re-export. Commit only those new reports, audit logs and sheets on this branch. Send SA the exact R17 two GLBs and .blend plus both baseline R16 GLBs (ZIP acceptable) if remote binary retrieval remains blocked. Independent SHA/open checks remain pending until SA can inspect actual bytes.

**STOP `R17_SA_ART_REVIEW_REQUIRED`**. No merge/Codex import, no runtime shader or reflection/seat claim, no physical RTX/LIVE PASS, no R16 overwrite.
