# R04 — BINARY HANDOFF (NOT UPLOADED)
**Branch:** `assets/sakura-hero-r04-sa-review`  
**Root:** `Assets3D/Review/sakura_hero/r04/`  
**Status for every entry below:** `pending_owner_upload` (none committed to GitHub; these are locally verified original R04 bytes).  
**SHA-256 values below describe ONLY R04, never reuse them for R05.**

| Canonical file path | Bytes | SHA-256 | Status |
|---|---:|---|---|
| `Assets3D/Review/sakura_hero/r04/sakura_hero.glb` | 7968912 | `1f35bbc067e711d5b632b460a268f409df21774bc270b8a8fa5c3d9cef005751` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r04/sakura_hero_eco.glb` | 2298240 | `c4d4a73281d9c1ce2b3256ffff29aeebc0b12a0f5da5883c6026e38bcdfb7e28` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r04/sakura_hero_editable.obj` | 20817143 | `23ebf4e3116e08a0fd5205c3e163499bdffb644975c25dadc533ee42ef889411` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r04/sakura_hero_4_views.jpg` | 508621 | `ddb51da6f913eecfefd576081407dbae73623d8bb1181163607137903f2d6a93` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r04/sakura_hero_preview_top.png` | 781512 | `4c06ffc7419021214f6a17df3d07e4105d046c3e2e86e209a6528a6036495b54` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r04/sakura_hero_preview_under.png` | 1001000 | `6fba59edb6ec9a810a5fe2dd2d5d016524fc3a7f12007e253d0349c7ac70cce3` | `pending_owner_upload` |

Other local screenshots and owner video remain outside the branch; no `.blend` exists. See R04 manifest for the verified local GLB geometry counts and VTK renderer only. All models are original procedural work, no purchased or third-party assets. Commercial use in project permitted.

## Owner upload (Windows PowerShell)
1. Download `OnlinePagodaV2_SakuraHero_Prototype_R04.zip` from the AI Visual ChatGPT conversation and extract.
2. Clone repository or fetch existing local clone. **DO NOT checkout `main` to add binaries**:
```powershell
git clone https://github.com/nguyenbui5701/OnlinePagodaVer2.git
cd OnlinePagodaVer2
git fetch origin assets/sakura-hero-r04-sa-review
git switch assets/sakura-hero-r04-sa-review
$target = 'Assets3D/Review/sakura_hero/r04'
# Copy only R04 files from the extracted archive into $target.
Get-FileHash "$target/sakura_hero.glb" -Algorithm SHA256
Get-FileHash "$target/sakura_hero_eco.glb" -Algorithm SHA256
git status --short
git add Assets3D/Review/sakura_hero/r04
git commit -m "assets(visual): deliver verified R04 binary prototypes"
git push origin assets/sakura-hero-r04-sa-review
```
3. Before committing, compare every file to the table; if mismatched or absent, do not mark it uploaded. If the tree revision R05 is already the target for review, prefer upload R05 and keep R04 immutable.
4. SA only approves after independently retrieving exact files, checking SHA and importing the GLB.
