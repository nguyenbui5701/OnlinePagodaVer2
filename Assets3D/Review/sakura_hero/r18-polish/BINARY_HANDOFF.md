# Pending native binary handoff

Immutable R17B files and SHA256 in asset_manifest.json. Actual R18 bytes/SHA unavailable until native run. Do not regenerate R17B or overwrite previous art.

Audit first: attachment_audit.json, R18_Attachment_Audit/ (6 PNG + audit_views.json), R18_audit_* logs. After audit review, Build produces sakura_hero_r18.glb, sakura_hero_r18_eco.glb, attachment_diagnostics.json, validation.json and build logs. Final creates sakura_hero_r18_editable.blend, cycles_manifest.json, R18_Cycles_Evidence/ (18 new matched PNG +2 controlled light PNG +7 JPG), sheet_manifest.json, native_manifest.json, owner_sha256.txt and final logs. Six older R17B PNG are referenced without copies.

Check `Get-FileHash .\sakura_hero_r18.glb, .\sakura_hero_r18_eco.glb, .\sakura_hero_r18_editable.blend -Algorithm SHA256` against native_manifest after actual final. Commit only files inside this R18 directory, never stale failed output. Upload exact binaries/ZIP for independent SA if remote binary access remains empty. Canonical manifest and PR status reconciled after actual GitHub upload. All outputs pending_owner_upload. No merge, no runtime, Owner GO pending.
