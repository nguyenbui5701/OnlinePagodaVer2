# 13 — Cross-AI contract: assets, world anchors, live focus intents

**Status:** DRAFT contract for SA approval. This is the single integration agreement between AI 3D and Codex.

## A. Why this contract exists

A 3D asset can look good in Blender but be unusable when a gifted viewer must be focused: wrong origin, scale, direction, name anchor, or seat height. Meanwhile a working event queue can be broken by rendering-specific identifiers. The asset API and event API must be loosely coupled before implementation.

## B. 3D assets -> runtime renderer

**AI 3D delivers:**
- Versioned GLB (3D mesh, not image), editable Blender source when possible, preview renders and manifest.
- Stable unique `assetId` per model type, LOD variant, actor animation clip names, material variants, local anchor offsets.
- All GLBs share a consistent world convention: `+Y` up, local `+Z` actor forward, local origin at seat contact center; actual exceptions clearly declared.
- Asset validity proof: open/export from Blender, load via GLTF viewer, multi-angle screenshots and simple triangle/texture budgets.

**Codex must not change without design approval:** mesh topology, rig or user-visible materials. It may own shader/material integration only by declared contract. It may not guess actor height or manually offset a broken model repeatedly in camera code.

Example manifest **schema proposal**:
```json
{
  "version": "0.1.0",
  "coordinateSystem": {"up": "+Y", "actorForward": "+Z", "metersPerUnit": 1},
  "assets": [
    {
      "assetId": "meditator_base",
      "revision": 1,
      "runtime": "meditator_base.glb",
      "source": "meditator_base.blend",
      "kind": "avatar",
      "boundsMeters": [0.75, 0.9, 0.7],
      "anchors": {
        "seat": [0, 0, 0],
        "head": [0, 0.75, 0],
        "nameplate": [0, 1.15, 0],
        "giftFx": [0.32, 0.75, 0.0]
      },
      "animations": ["sit_idle", "react_gift"],
      "lods": ["meditator_base_lod1.glb"],
      "provenance": "original model / generation tool and license",
      "triangles": 0,
      "textures": [],
      "preview": "meditator_base_front.png"
    }
  ]
}
```
*All numeric fields in the example are placeholders and must be replaced by measurements before approval; `triangles:0` is not a real model count.*

**Scene layout file** (Codex can author, based on AI 3D top-down world design):
```ts
type LotusSeat = {
  seatId: string;
  leafAssetId: string;
  position: [number, number, number]; // world x,y,z
  rotationY: number;
  groupId: string;
  cameraAnchor?: [number, number, number];
};
```
Seat world anchor must be stable across re-rendering so server focus keys can resolve to a real avatar. Dynamic camera cannot target name text or a guessed screen coordinate.

## C. V2 Event Engine -> camera/renderer

**Codex defines typed serializable messages**, with project-private IDs (do not expose raw TikTok ID to public overlay). Proposal:
```ts
type AvatarPresentation = {
  actorId: string;
  seatId: string;
  displayName: string;
  avatarUrl?: string;
  appearanceVariant: string;
  visible: boolean;
  revision: number;
};
type FocusIntent = {
  requestId: string;
  roomSessionId: string;
  actorId: string;
  giftId: string;
  giftCount: number;
  confirmation: "observed" | "confirmed";
  firstSeenAtMs: number;
  expiresAtMs: number;
};
type CameraPresentation = {
  mode: "CINEMATIC" | "GIFT_TRANSITION" | "GIFT_FOCUS" | "CINE_RETURN" | "MANUAL";
  activeRequestId?: string;
  activeActorId?: string;
  pendingGivers: number;
  cinematicShotId?: string;
};
```

- Event Engine owns authoritative identity / queue / gift confirmation state, and emits FocusIntent with actorId (never a 3D position).
- Renderer owns a `seatId -> world transform` mapping; `actorId -> seatId` is part of synchronized state. Renderer finds camera target from actor transform + manifest anchor.
- The camera always runs cinematic when no gift is active or queued; gift focus uses FIFO **between users**, with fairness coalescing and return (Design/09).
- Renderer and camera must not mutate confirmed gift counts; they receive updates. Reconnect / room session changes invalidate stale focus targets.
- Nicknames and avatar URL must already be validated/sanitized; escaped renderer text. Missing avatar image uses a material fallback rather than a guessed identity.
- If model/seat unavailable, a truthful name/gift overlay fallback may be displayed (09) and report a diagnostic; never focus wrong avatar.
- `focusStarted`, `focusEnded`, `focusSkipped(reason)` are useful telemetry events, not TikTok billing events.

## D. Tests and review handshake

**AI 3D tests**:
- load each GLB; turntable front/side/back/top, zero-missing-textures, correct scale and anchor locations;
- render chibi on leaf and clear nameplate above head;
- tree looks like reference from aerial (15s) and under-tree (20s);
- ECO/QUALITY LODs present or documented fallback;
- polygons/materials/texture memory per asset measured, not guessed.

**Codex tests**:
- fake Event Engine A, B, C gifts -> focus A, B, C then cinematic without teleport;
- dynamic target is correct `actorId` and `seatId`, including actor not spawned before gifting;
- no-gift cinematic cycles >45s; asset loading failures don't deadlock event processing;
- representative scene benchmark both owner GPUs and 9:16 output.

**SA integration decision**: approve only when selected manifest revision and protocol version both known, reference screenshots pass, event/camera tests pass and actual GPU profiling is attached. If contract evolves, version docs and ask both AIs to adapt rather than silently mutate interface.

## E. Division of labor hard rule

**AI 3D may use AI generation, Blender, mesh-editing and export. Codex does NOT generate art or write intricate vertex geometry code to stand in for production assets.** Procedural water/fog/particles and renderer optimization are Codex code, not AI 3D files. SA owns cross-team review and priority.
