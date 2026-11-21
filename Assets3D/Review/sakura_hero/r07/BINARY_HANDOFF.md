# Sakura R07 — Binary and render handoff

Branch: `assets/sakura-hero-r04-sa-review`; folder: `Assets3D/Review/sakura_hero/r07/`. **All listed files: `pending_owner_upload`.**

| Canonical repository path | Bytes | SHA-256 | Status |
|---|---:|---|---|
| `Assets3D/Review/sakura_hero/r07/sakura_hero.glb` | 4494556 | `a6571ebc56bd360a550231fa7ee46572c7bb227f57d99755941da43faf6d1424` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/sakura_hero_eco.glb` | 1358528 | `2ef5ab5a49bf017c6b3d16ac7b3902a7e66be1a2e7fdb0609967ea409bd65a79` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/sakura_hero_editable.obj` | 11289053 | `86612d6e2d5c815b99f745147718434a35595b4e9dbcf4a3b029d756a00126f8` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r07_quality_top_pbr.png` | 242774 | `17e648ea7c74a5cb495f65c2b8de9d580154a275d1025e8fd38760569f04b619` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r07_quality_under_pbr.png` | 214494 | `0a3398c3a79a4f9f72f1479525d337dc8dd9b6f9d667548af43e15b68d2364ae` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r07_quality_three_quarter_pbr.png` | 208924 | `1ca7cc556d612bbdfd913e006caf4d5e890d56053b06bd26413af10306047e42` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r07_quality_trunk_33s_pbr.png` | 148279 | `53d6cbdefa855561c1f23ee57f5717255f01156535937b4c1307654f90dd96af` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r07_eco_top_pbr.png` | 187786 | `9efb98f325e4499beebb2dc2ac5a84b1aab49fda5dd58c6eaf855b3427408c63` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r07_eco_under_pbr.png` | 169335 | `82065388e18315c3dec6199457106cea86e786d56adc343d924d3fb0b7d30860` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r07_eco_under_no_ibl_pbr.png` | 176677 | `d1a01c94a5fec584da40c76f280b3892b9d5b40f8a155f218a8969195f103cc0` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r06_eco_top_matched_pbr.png` | 189605 | `a6cdbf96c967a0962484cd665adb210a9bcad9ff3d14452184cbe32b3e07ddba` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r06_eco_under_matched_pbr.png` | 159740 | `947b6cc721cf70a047123519329fbec1e8f0ca81cc6ecd1dda60cdedd5e4f585` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r06_quality_top_matched_pbr.png` | 231895 | `19a1920571e986cc010b1f3b8013685cac799ed1923a746a3bed235a933f3270` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r06_quality_under_matched_pbr.png` | 200549 | `6544d82ad2858de0977c63848f2b01667aa03169c81444eae42f3dc2ed0f467c` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r06_quality_trunk_33s_matched_pbr.png` | 136957 | `adfbf3667d56010935ba8ebbe2430c653d9c45cc361ac528cf5d8fa93d857fd9` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r06_r07_eco_matched_pbr.jpg` | 141647 | `f1e6402acafb716a845950c8cc6dd6f4129dccd77fbc0e4c173e972737207953` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r06_r07_quality_matched_pbr.jpg` | 168484 | `ae0d20a81631cf60b5c9c89127f45f5c14e7e4042396f9547a6826273f82b0fd` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r06_r07_trunk_33s_pbr.jpg` | 60140 | `d7978a438bc9364334ca81b1b0a0baa86e9348fc0ee3db8e468ad8bc9a05f8d0` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r07_quality_eco_matched_pbr.jpg` | 152170 | `dd7cc247f28e6cf29dcccac216df379cbffe0bbc8d2ee9014b3caefcafb40d4a` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r07_eco_ibl_control_pbr.jpg` | 80375 | `1246e25d2f86a9d3d6efdc0709c7fb0952802fe41a7fad8827c9474877f000fa` | `pending_owner_upload` |
| `Assets3D/Review/sakura_hero/r07/r07_video_reference_comparison.jpg` | 141289 | `41d3afc5d66b3c7e9522dfba49cded3dbac359d0105195c33a56316b28a3179f` | `pending_owner_upload` |

## Windows PowerShell upload (only after local SHA checks)

```powershell
git fetch origin assets/sakura-hero-r04-sa-review
git switch assets/sakura-hero-r04-sa-review
$target='Assets3D/Review/sakura_hero/r07'
# Extract the delivered R07 packages and copy binary/preview files into $target.
Get-FileHash "$target/sakura_hero.glb" -Algorithm SHA256
Get-FileHash "$target/sakura_hero_eco.glb" -Algorithm SHA256
# Compare with table. Abort if mismatched.
git add Assets3D/Review/sakura_hero/r07
git commit -m "assets(visual): upload R07 verified GLBs and PBR review media"
git push origin assets/sakura-hero-r04-sa-review
```

**Do not edit R04/R05/R06. Do not mark files uploaded before verified on GitHub. There is NO `.blend` file in this revision.**
