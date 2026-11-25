# R18a — final evidence uploaded / AI Visual pre-SA review complete

Owner upload `24cf39cf4df5e7a05be7cf126a422439a7cd4d60`; reviewed R18 `631273440469b789bf7f1688bff30a35309de601`; [SA R1](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/27#pullrequestreview-6058176405); AI Visual17 §10. Art First soft references ECO120k/QUALITY500k/HIGH QUALITY1M. No mandatory third GLB; full detail QUALITY editable + ECO collection. No rerun of unchanged baseline tests. 0 VND.

| LOD | Triangles | Gold delta | Vertex records | Primitives | Bytes | SHA256 |
|---|---:|---:|---:|---:|---:|---|
| QUALITY | 242954 | +5521 | 303136 | 26 | 7152368 | `ff14eece4e43eba996a28bfdc8e7353693b4d0ab75911af2f0a61dbae57f35ab` |
| ECO | 60931 | +2149 | 101192 | 25 | 2229632 | `1ed0f0bb658a045fba09267020feebab99824ee06423bb92577a8cd2d2e7c847` |

QUALITY +5521 tris (+2.33%), +157036 bytes (+2.24%); ECO +2149 tris (+3.66%), +64412 bytes (+2.97%) vs R18. Primitive count is asset inventory, not measured runtime draw calls. 15/14 materials, no textures. Native surface-distance maxima ~0.012m (<0.025m tolerance), bounds unchanged. No GPU performance assertion.

Independent review of attached ZIP: CRC, SHA256/Git blob match all three binaries; both GLBs parsed, finite accessor/index and degenerate checks PASS. Reverted only appended gold data and gold material in memory to reconstruct exact previous R18 SHA256/Git blob/length both profiles. [Receipt](PRE_SA_FINAL_REVIEW.json). All accepted structural bytes preserved. Editable `sakura_hero_r18a_editable.blend` 22877219 bytes, SHA256 `07c5859ca2a6a9dec33c7999cabd7d2a45873285e09d04e0ea3771577a83266c`, Git blob `5239e9b4c0b2cb075d73c7e6636269fd6eafdfde`; Owner native reopen and visibility switch PASS; no independent Blender execution here.

Native Build/Final exit 0, empty stderr; 24 matched frames (16 new +8 reused R17B), four reused R18 gold controls and two new warm-fill images. Nine sheets directly viewed (36 panels); 41 inventory files + manifest and 12 reused frames match 54 SHA ledger entries. Git metadata checked; remote render bytes not independently rehashed. See [native manifest](native_manifest.json), [SHA ledger](owner_sha256.txt), [final result](final_result.json).

Art improvement clear: long legible branching gold, intact mature pink crown and repaired blossoms. QUALITY sometimes broad flat ribbons, 3 qualifying major branch components vs ECO 9; ECO fine gold on more limbs. Warm-fill helps bark/flower readability offline only. Reference video unavailable in artist session, previous SA finding used. Seat/gift camera-only; no runtime seats, lighting, reflection, FPS/VRAM/LIVE proof. Recommend SA final review, no additional art or render iteration now. Owner Art GO pending. No merge/runtime/Codex/B9/C0. STOP P10B8_ART_SA_REVIEW_REQUIRED.

## Verified upload inventory

| File | Bytes | Owner SHA256 | Git blob |
|---|---:|---|---|
| `sakura_hero_r18a.glb` | 7152368 | `ff14eece4e43eba996a28bfdc8e7353693b4d0ab75911af2f0a61dbae57f35ab` | `44f2900490ddd682d5b951808b37aaeb0e714f78` |
| `sakura_hero_r18a_eco.glb` | 2229632 | `1ed0f0bb658a045fba09267020feebab99824ee06423bb92577a8cd2d2e7c847` | `fea7660aacdb61099d9ca1b377656440a2a0b8b7` |
| `sakura_hero_r18a_editable.blend` | 22877219 | `07c5859ca2a6a9dec33c7999cabd7d2a45873285e09d04e0ea3771577a83266c` | `5239e9b4c0b2cb075d73c7e6636269fd6eafdfde` |
| `validation.json` | 19161 | `f52eab086b0da1d218d251ae6da6537aa1bd5433b090070b50c465418fcbaf52` | `4391c4cd30c0235641dcc6811558ae0bf26aaf0e` |
| `editable_reopen.json` | 37665 | `e251958133f2f33656942da51590ff242c251f5e048fb9779375a32cb611ff52` | `408729c92a8881d3cca9e19aab867c1f83c52e87` |
| `final_result.json` | 59941 | `cde417ad6d6b36a204f186b5182a92a65bc96fb78e16242426461202f5380d36` | `af2376d156a748bfb732549ba427c15b87102612` |
| `cycles_manifest.json` | 39415 | `b4e058271f98ab881d4f7a543139a1d2b49a15e58ba94dea051aa03c393e35e2` | `89f9fe527593342cc9aaa6413a13de1fc0df0f68` |
| `sheet_manifest.json` | 52367 | `4a9d4b8cf5e6a23a1e17be42a6f07f7aba0f9aca4109c81b2b105c618b780d6e` | `e407a17fd9e01ef73d936acc47ea10d07b37e8e3` |
| `R18a_build_stdout.log` | 4844 | `57c41cae33a50122dd5bc96fa618a4080ad0bda5aef8d53e5cebb426a9e293a1` | `d04146894ab940af341f014a8aa5a96a88184044` |
| `R18a_build_stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` |
| `R18a_build_exit_code.txt` | 3 | `13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354` | `18748286e5b8b4de5db905f87cdfed1a7d48fe60` |
| `R18a_final_stdout.log` | 120030 | `d2d74b54552660746a37496464974fc64d69936e90c850fe81228cb4a659bb71` | `8fb95a554212d9fae06f5717a3c408f12b759cb0` |
| `R18a_final_stderr.log` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` |
| `R18a_final_exit_code.txt` | 3 | `13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354` | `18748286e5b8b4de5db905f87cdfed1a7d48fe60` |
| `R18a_Cycles_Evidence/quality_r17b_low_water_cycles.png` | 1241806 | `fa77a24f91f9bc7e0aa7e9167f29cdc64fd4eb97b2c3d7919399043ce88e8a73` | `95238a5e629e50ac2c502acc176ea2bdb69f28c2` |
| `R18a_Cycles_Evidence/quality_r17b_seat_gift_composition_cycles.png` | 1191583 | `faf1d6ae1ecad99afef2bc772aa19d36acb1213e8b51dbbd804f2079c614f4c3` | `15e6a65325dc05d180f4a998ef482727f9957930` |
| `R18a_Cycles_Evidence/quality_r18a_aerial_cycles.png` | 1186773 | `4cbaf4de765650ae05f46f2a1f9799908de27a06474f2ee3d70f7b513d11ffe4` | `12d56c8cc57b3d0bab9944af4adff7fe9aba81a4` |
| `R18a_Cycles_Evidence/quality_r18a_wide_cycles.png` | 1011610 | `8d34dc32f792a1d02c6705c0ec51359a42e111f3cb8bf7ce8497a6d3eb4dfd53` | `d94ba0b7a804a39b9a0010171be21d963710a345` |
| `R18a_Cycles_Evidence/quality_r18a_under_tree_cycles.png` | 1228914 | `db6febfdddf17afbfd4d2f656ef20deb32e452d4c71bb62557988b80a73ba0ca` | `d704bca2fd93acc2acc84d6152d90e4ff439e04e` |
| `R18a_Cycles_Evidence/quality_r18a_branch_close_cycles.png` | 1270206 | `9b1fc1a2006dd005d22e43b99da4230707ef4d2c77aceefea47619c0518779e4` | `0f7112d5fe919aa121eee05e3db34f4baaf89dc7` |
| `R18a_Cycles_Evidence/quality_r18a_low_water_cycles.png` | 1258018 | `18abb5ce8612886bffdd0c7e220b1810d3c014adac880a72ebc30137ba2da9f6` | `bf8ccccc5556c4085bc2c8714ce2b77588d24e90` |
| `R18a_Cycles_Evidence/quality_r18a_seat_gift_composition_cycles.png` | 1257692 | `69f20c4cfd70e7e1705ea060ef323d6ee02472542a15ae42e700581b028a7ad1` | `abb5a7493cf69b35f9e5027b982631cfb501406f` |
| `R18a_Cycles_Evidence/eco_r17b_low_water_cycles.png` | 1185133 | `766f70c2aba35c5c2986f17421da32db9fe8c9ef70568ec10dbbc368f6c0206c` | `320d4394920d9407a253441eb45adab2f87c2afd` |
| `R18a_Cycles_Evidence/eco_r17b_seat_gift_composition_cycles.png` | 1167782 | `26968ec23992422e387c733e26b9832801bf58531a0a2bedf2f3517999b35f7c` | `adbc0456598d7fd4d1b5113354290402628db796` |
| `R18a_Cycles_Evidence/eco_r18a_aerial_cycles.png` | 1148155 | `c7eaa1c178a76836c46c9a8ba06831e189e2aed15485d88f4a4d4ae79234c992` | `1ce2f76ea59453feefa4c620da76607b833a56a0` |
| `R18a_Cycles_Evidence/eco_r18a_wide_cycles.png` | 982673 | `90faa978f73f934dc28d71195090d873ae7ad1fd9ff573076e6338310a6cb1c5` | `bcbd51f3e4e6c18ae426cdcf854fcc9d87cfc2b6` |
| `R18a_Cycles_Evidence/eco_r18a_under_tree_cycles.png` | 1205729 | `024e4a4b5d8a2510d263e31a42f74731570a69e5b7598b7ebc6c98edb924cf92` | `b0b819de36894487aa086b3cd56f726d8598e3ce` |
| `R18a_Cycles_Evidence/eco_r18a_branch_close_cycles.png` | 1277512 | `c222e4a5c844ca29d4485d6b86724a12ee776ef53290f98ac18a928bcacc80c9` | `c808f258e19cfb91e53348717f6ef02961918cd7` |
| `R18a_Cycles_Evidence/eco_r18a_low_water_cycles.png` | 1192842 | `ee732833c81928154fd4e476f5df471907ae0a73e1a7dea13d0a6b902bcd2371` | `036adeb97df81e3399608cc39608afa0b45393aa` |
| `R18a_Cycles_Evidence/eco_r18a_seat_gift_composition_cycles.png` | 1236283 | `6f94fbe59f4df8d8165538f59173fc6838060b2c709f3f6e408d1b3a269258c1` | `2558c7903cd8b0fa6f611fa79fb8213c1d5c6e99` |
| `R18a_Cycles_Evidence/quality_r18a_gold_look_only.png` | 1280074 | `b1493a840545b7bf5ad96ae38bab671a22114ce0cdf511a5ae297d4efccc3647` | `65a66fa13fe556505d09d5b5658f6af290d98f44` |
| `R18a_Cycles_Evidence/eco_r18a_gold_look_only.png` | 1247401 | `660c43b4b40ed42d745248d94eea07b96c6a3948bd885616ab894513cab48136` | `d1ad44e7849aaaf4a7381bd1f34854c372041132` |
| `R18a_Cycles_Evidence/aerial_AB.jpg` | 185995 | `1b45558fc219a820bc053afdd5aa5c6e891f0c3a26b5831b202487bb4aa61fba` | `e8bcef286309992a131726c909a3e60f016fdae5` |
| `R18a_Cycles_Evidence/branch_close_AB.jpg` | 284295 | `5b43c83c7e5754fee0cf48abc3a7c3f11086b5ac638453b5811c2a6e23d1dece` | `81121f75a68ee40f3bbd1c09ac575cfc8d799586` |
| `R18a_Cycles_Evidence/low_water_AB.jpg` | 249182 | `eb009efd1a63ee9b2fb98a686ec29728aeca2b4ecd7aa2a12087a6bf22e63807` | `4f29effd564b0748c6f0df4fb9c8e9239f15c27f` |
| `R18a_Cycles_Evidence/seat_gift_composition_AB.jpg` | 264691 | `1f3f0e7772376aeed60000a808c2a5562df91c5c08d7571fa3782c72c65f1ea5` | `721a68c4b296ef4b3c435a466bf2ace8bc8bccd0` |
| `R18a_Cycles_Evidence/under_tree_AB.jpg` | 252007 | `52058fb3b8ad8988a8a4b2529d85fc066b634498bc2e0ec337674bd8e1fca1aa` | `8daebc768c547876442668a40445019ae94b642d` |
| `R18a_Cycles_Evidence/wide_AB.jpg` | 130787 | `81a5d8ea8a0f3c0ac7ada5a6decb4226d6aee0c8f97a00a29572a6dd9d868496` | `1841c5f62a50ffc9aa3516b52580882314d0896f` |
| `R18a_Cycles_Evidence/gold_revision_under_tree_AB.jpg` | 252156 | `fb1912da8f525e7549cb7ff805bf933dd90c21117c9f0ec40a7ade3151e1cfe2` | `6fb9414d997548a4e73c6450b4925b16b628cdd2` |
| `R18a_Cycles_Evidence/gold_revision_branch_close_AB.jpg` | 280652 | `737d37fe2b52f8417ea5aeeaaefeb17e8dd507f41fd1a342467f008e55775c9a` | `3a348ada061ff2ee2c9a5fe1d3efca703982864e` |
| `R18a_Cycles_Evidence/gold_lighting_control_AB.jpg` | 289980 | `a1b65f8038d40d6af2bab0bfbb58168861a854c6ca52cb3351564cc2653b8375` | `84d83c8dbcdcb3d769256410f9bc69eb37680628` |
| `native_manifest.json` | 138902 | `143800dab51c32f89c2f3970383976ab36ab2bddb87e4c6c2c1c8dca2b99aaff` | `c823e1d965d29e3c4d966c8771c47431e18dee70` |
| `../../r17-lush/r17b/final/quality_r17b_true_aerial_9x16_cycles.png` | 1190123 | `69fe8f410494e084ad6c95dc15e47f88d7719821f2bde6f586de2ff7677810ff` | `0f6c00c38137063c747504a3397801fb0b92a0ac` |
| `../../r17-lush/r17b/final/quality_r17b_hero_wide_water_9x16_cycles.png` | 999544 | `49be575c6ae7e3fdeb1f9a7974e2c7c6a12468d5951689e04ffc02f3826eb022` | `5f1e6b9d5bab974c834a43a7caec8a02a940d315` |
| `../../r17-lush/r17b/final/quality_r17b_under_crown_9x16_cycles.png` | 1157669 | `c925024118c41950ddbf2fa7ffe943bbee22470388eb73716175ecae73cbce04` | `cf1895eaeb0e97f3d8077fb88ddeea52a661a39b` |
| `../R18_Repair_Preview/quality_r17b_repair_side.png` | 1225720 | `ed878ebc64558b1c62cdcd7b0dc78caf09a56f92ed84e91ff1c62a115e25e481` | `3d9816fa9517d0d675755d0f990469a3f9188338` |
| `../../r17-lush/r17b/final/eco_r17b_true_aerial_9x16_cycles.png` | 1151467 | `fd8ec70bee14be3ae700ab9d4584e0d2b9934d2af42b10286ab392a7bbcd2391` | `0c1417561136997c659dac060e309f0f4b8fa5cf` |
| `../../r17-lush/r17b/final/eco_r17b_hero_wide_water_9x16_cycles.png` | 974975 | `7a907396dafa1a4640af776f51605cae7e49b40d21c2251646792cb4814f8fc1` | `b0c967167e0eb36b32acbad2f87e48de5631eb89` |
| `../../r17-lush/r17b/final/eco_r17b_under_crown_9x16_cycles.png` | 1137455 | `1959e4f2369ab384eed970c3b52bd35e14bf3af7bcdbdac3f8fe76e57b583c2c` | `1b9ed36b78717a28c45b557ca12b499023e4a2db` |
| `../R18_Repair_Preview/eco_r17b_repair_side.png` | 1215991 | `fe9e61cf0e39aba731f75f9cfacbefa13a31cec7eccc6a97a519a709f207a802` | `9d9ed1131ed778b4b7c98b6b722147ea5260023c` |
| `../R18_Repair_Preview/quality_r18_under_tree.png` | 1170139 | `807a9304da9b831b18f861c8e62b1e3b344b8229c67d96093e19e7ca450565c3` | `bf78297da7d8723b2500c9dc983407f1a3d403ad` |
| `../R18_Repair_Preview/quality_r18_repair_side.png` | 1215543 | `601ad1483079af2a16e7094a2a7b4bd849c4f566607bdac2af18d155c63c4dc7` | `be19ed4532201f347858ba00f0d84c643f161aa6` |
| `../R18_Repair_Preview/eco_r18_under_tree.png` | 1134519 | `e77c9038aa393031dc9ab00e220870a855e80f492b72c25f2b1fd8864d21ccbc` | `cce66c0b5cf0c9c9f9856a13591c8cc4e24c37d6` |
| `../R18_Repair_Preview/eco_r18_repair_side.png` | 1221075 | `4d9ec04f861451372a18053df78a8c6fe6c21aed4b9e6836366ca535a8ce39b0` | `200b32c4c465cd8e37686b280c922bd68b6d12a4` |

SA may independently inspect the same Owner ZIP. No duplicate upload or rerender necessary. Three binary hashes independently verified; images metadata/ledger only.
