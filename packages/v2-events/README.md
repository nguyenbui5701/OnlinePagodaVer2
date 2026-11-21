# DEMO Event Engine v0.1.0

Baseline [Design/16](../../Design/16_P0_APPROVAL_AND_HANDOFF.md), [Design/09](../../Design/09_GIFT_CAMERA_DIRECTOR.md), [Design/13](../../Design/13_3D_EVENT_INTEGRATION_CONTRACT.md) at `fcc6ede4cb7a96ba09cb94d2088fbf9e09481766`. Scope `packages/v2-events/**`. Node 24+ and npm. The test, build and fixture need no TikTok account, external requests, or GPU. The V1 mapper was read as a contract reference.

```powershell
Set-Location packages/v2-events
npm.cmd ci
npm.cmd run build
npm.cmd test
node src/demo.ts > demo-trace.json
```

`npm run demo` prints the same trace with the npm banner. The included [trace](evidence/demo-trace.json) was generated with the direct Node command. It shows 45 s idle, five provisional A packets, final A count 5, B and C arrivals during A focus, chronological A → B → C start/end, then cinematic return. The final confirmed total is 7.

## Integration seam

```ts
import { DemoEngine, type FocusIntent } from '@online-pagoda/v2-events';

const engine = new DemoEngine();
engine.ingest({ type: 'session', action: 'open', roomEpoch: 1, connection: 1, atMs: 0 });
const receipt = engine.ingest({
  type: 'gift', roomEpoch: 1, connection: 1, atMs: 100,
  eventId: 'gift-packet-1', viewer: { userKey: 'demo-a', name: 'Thiền An' },
  giftId: 'rose', phase: 'final', count: 1,
});
const snapshot = engine.snapshotSince(0);
const intent: FocusIntent | undefined = snapshot?.focus;
// Resolve intent.actorId through snapshot.avatars, then seatId through your scene layout.
const timedEffects = engine.advance(1000);
```

- `ingest` accepts validated DEMO JSON-shaped packets. Process packets in monotonic fake arrival time, reopening a room with a strictly increasing epoch and reconnecting with a new connection generation. Run `advance` for clock ticks or replay; it emits crossed deadlines in order even on a coarse tick. Lifecycle changes invalidate old connection packets. A disconnect preserves current state and running deadlines.
- Synchronization uses full typed replacements. A client applies newer revisions from the same engine instance and calls `snapshotSince` to resync across gaps or session changes. Effects are transient outputs from each call. Each engine instance starts a fresh revision stream.
- A present viewer preserves actor and seat through reconnect. After TTL expiry an arrival can receive a new actor and the first free seat. Active and queued actors keep their seats until their shots finish or expire. Only chat and gifts spawn by DEMO default. Like FX use a shared cooldown. All tunables in `demoDefaults` are provisional.
- Per-giver slots retain FIFO order. Progress can request one provisional shot per streak and never increments confirmed totals. Final counts are authoritative, even when focus falls back to an overlay. `giftFx` carries the actual gift packet's confirmed count and a sanitized display label. A final received after its provisional slot ends still acknowledges the giver. The current focus intent presents the latest confirmed gift type and accumulates adjacent confirmations of that type.
- Packet and streak dedup survive reconnect for the entire room epoch. At the configurable session-key limit new packets return `session-limit` until a new room epoch. This bounds memory and preserves exactly-once totals without evicting old keys. This in-memory DEMO has no persistent ledger or provider adapter.
- The renderer must display labels as text and may use a neutral material when the HTTPS photo is missing. Public views and effects contain surrogate actor/request IDs. Camera animation, assets and production transport are integration work.
