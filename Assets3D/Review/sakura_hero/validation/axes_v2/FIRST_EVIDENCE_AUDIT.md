# R09 first owner Blender evidence — technical audit

**Evidence ZIP SHA-256:** `f57523aa7100ae6d9fef671a9320c02b03da1535cba99966d6f9048719cbe6dc`. ZIP integrity test passed.

- Blender version: **4.5.16 LTS**, Cycles CPU, samples **32**, width **520** px.
- QUALITY imported original checksum `e68a479a2ea4705d711702e015ef290c72757cca107a261913d4988d5ae9bbc8`, **11 meshes, 185,026 triangles**, all listed materials report Principled BSDF. Four PNGs rendered.
- ECO imported original checksum `accd47de97af2af2bada3d8008abf2c16100edbc8045b306e6c2fac3ef0e8173`, **10 meshes, 44,412 triangles**, Principled BSDF. Eight PNGs rendered.
- 14/14 image and JSON files verified against the accompanying `FILE_HASHES_SHA256.txt`; both stderr logs empty; stdout ends with completed render and Blender quit.
- Reports state `.blend` were saved, with SHA-256 QUALITY `42082d5d9588e5387e39caafec82738db238959d198eb2739ba459153592ea97`, ECO `e46ce1cd57c0cb30285a66c35200faa62cb4918cb4bf8f16067b695b77b64602`. **These .blend bytes are not inside the uploaded evidence ZIP** and have not been independently rehashed here.
- **Critical camera bug:** The supplied R09 script never rotated original glTF +Y-up camera, view-up and light coordinates to Blender +Z-up. Top/three-quarter/under/trunk screenshots are therefore unsuitable for judging reference fidelity or underside lighting; the under view is almost entirely pink. This is a test-rig error, not evidence of faulty GLB mesh or PBR material.
- **Disposition:** Blender import/Cycles process PASS; PBR visual comparison **BLOCKED pending corrected camera AXES V2 rerun**; production art and Three.js/GPU acceptance OPEN. No R10 geometry created.

See the sibling `README_AXES_V2.md` and corrected validation scripts.
