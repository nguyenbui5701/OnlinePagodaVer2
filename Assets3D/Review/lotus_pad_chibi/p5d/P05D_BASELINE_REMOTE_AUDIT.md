# Additive immutable baseline remote audit — 2026-11-22

At PR #2 SA review [#6010091090](https://github.com/nguyenbui5701/OnlinePagodaVer2/pull/2#pullrequestreview-6010091090), HEAD `bdb171b82d9ceb8d72bc42ac0ece64cecf4be166`:

- P0.5c cross original 424,784B SHA `1da8c12982165cf57e2ef678013cdd57b67bba7fd6c08e2979c267599d35e5bf`, kneel original 439,244B SHA `a8b40ffb81e12f7eaf401c42a21a3588bdc05660579f512c95c936514d2029ac`: raw remote SHA independent SA PASS.
- Eight original Blender Cycles cases with completed stdout, empty stderr, selected six PNG exact hashes: PASS; full 78 PNG SHA, original four .blend SHA and original evidence ZIP CRC **NOT independently reverified**.
- Historical P0.5c generator checkout alone still lacks exact frozen P04/P05 source dependencies, so original source-chain clean checkout reproduction remains BLOCKED. **New P0.5d builder uses exact original SHA-pinned P0.5c GLB as its ONLY geometry dependency** and was reproduced byte-identically in clean local directory. No edit to prior revision docs or source.
