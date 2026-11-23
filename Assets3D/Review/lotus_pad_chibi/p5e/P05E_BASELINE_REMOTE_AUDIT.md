# P05d additive remote audit (Nov 22, 2026) — no historical evidence rewritten

[SA review #6010466650](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6010466650) was conducted on exact HEAD `e34eee82afafbcb174e71f710e6e630b59a784f0`.

- SA independently verified **actual original P05d raw GLB**: 471252 bytes, SHA256 `0f169e427cc70bc0b5b744db935c4de4ecac356ef3fc8a1113812a5bf0780e44`, 17184 tris/10 meshes/21 materials.
- SA inspected original owner 32-sample Blender Cycles FRONT 360105 bytes SHA `8e7e64dae02ac8130ff5eec9f0281e1e35e4899fd6e6fed9c5924cc7d121d413`, SIDE 356675 bytes SHA `0c5ae8dc30a25607e3b8dfa4e2bb4e000ea7e236b1dedf3faf4bdac6494a1b92` and matching P05c side. 4/4 original Blender stdout completion markers, 4/4 stderr empty.
- Two owner-created P05d .blend and original Cycles ZIP have GitHub Git blobs, but **full raw .blend SHA256 / entire PNG checksums / ZIP CRC are NOT independently verified** by SA.
- Owner rejected P05d foot (beige pebble) and torso-to-legs slit (inherited from P05c). This is why P05e exists. Do not retroactively mark P05d ART PASS.
- **New P05e Cycles NOT EXECUTED**, new editable .blend NOT YET CREATED; old evidence cannot serve as new Cycles proof.

P05d files/manifest and frozen kneeling P05c remain immutable.
