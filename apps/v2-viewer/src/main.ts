import './style.css';
import {
  AgXToneMapping, DirectionalLight, Group, PCFShadowMap, PerspectiveCamera, Scene, SRGBColorSpace,
  Mesh, Raycaster, Vector3, WebGLRenderer,
} from 'three';
import { loadSakura, parseTreeRevision, type Profile } from './asset.ts';
import { capture, createCinematicRoutes, parseCinematicSeed, type CameraPose } from './camera.ts';
import { bindGoldEmphasis, createTwilight, referenceViews, setupLighting } from './lighting.ts';
import { LookTimeline, lookOrder, parseLook } from './twilight.ts';
import { createSeatScene, seatPose } from './seat-scene.ts';
import { diversityEnabled } from './avatar-look.ts';
import { measureSeatContact } from './seat-contact.ts';
import { SliceCamera } from './slice-camera.ts';
import { parseScenario, SliceDriver } from './slice-driver.ts';
import { createCommunityNames, occupancy } from './community-presentation.ts';
import { showGift, usePersistentNameplates } from './slice-overlay.ts';
import { createNameplates } from './nameplates.ts';
import { createWater } from './water.ts';
import { createAmbientFx } from './ambient-fx.ts';
import { createTrunkMist } from './trunk-mist.ts';
import { createHeroRoutes } from './hero-camera.ts';
import { createGiftFx } from './gift-fx.ts';
import { fxProfiles, richAmbientProfiles } from './fx-profiles.ts';
import { blessingEnabled } from './gift-blessing.ts';
import { createBlessingCloud } from './blessing-cloud.ts';
import { botanicalLayout, botanicalsEnabled } from './botanical-layout.ts';
import { createBotanicalScene } from './botanical-scene.ts';
import { createPresenceBubbles } from './presence-bubbles.ts';
import { presenceDemo } from './presence-demo.ts';

declare const __REPO_REVISION__: string;
const canvas = document.querySelector<HTMLCanvasElement>('#capture')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const diagnostics = document.querySelector<HTMLPreElement>('#diagnostics')!;
const query = new URLSearchParams(location.search);
const requestedTree = parseTreeRevision(query.get('tree'));
const treeLoading = `Đang tải Sakura ${requestedTree}…`;
const liveRequested = query.get('source') === 'live';
const profile: Profile = query.get('profile') === 'quality' ? 'quality' : 'eco';
const requestedView = liveRequested ? '' : query.get('view') ?? '';
const view = Object.hasOwn(referenceViews, requestedView) ? requestedView as keyof typeof referenceViews : undefined;
const comparison = view ? referenceViews[view] : undefined;
const look = parseLook(query.get('look'), !!comparison);
const timeline = new LookTimeline();
const fxEnabled = !comparison && query.get('fx') !== 'off';
const fxProfile = fxProfiles[profile];
const captureWidth = view && view !== 'hero_full_9x16' ? 720 : capture.width;
const captureHeight = view && view !== 'hero_full_9x16' ? 835 : capture.height;
const requestedTime = query.has('time') ? Number(query.get('time')) : NaN;
const frozenAt = Number.isFinite(requestedTime) ? requestedTime : undefined;
const manual = query.get('inspect') === '1' && !comparison;
const scenario = liveRequested ? 'idle' : parseScenario(query.get('demo'));
const presence = !comparison && query.get('presence') === 'on';
if (presence) usePersistentNameplates();
const chatBubbles = !comparison && query.get('chatbubbles') === 'on';
const giftIcons = !comparison && query.get('gifticons') === 'on';
const enableBlessing = blessingEnabled(query.get('blessing'), scenario, fxEnabled);
const rings = !comparison && query.get('seats') === 'rings';
const rich = !comparison && query.get('ambience') === 'rich';
const hero = !comparison && query.get('shots') === 'hero';
const crowd = rings || liveRequested || (scenario === 'community' && query.get('crowd') !== 'off');
const diversity = !comparison && diversityEnabled(crowd, query.get('diversity'));
const enableBotanicals = !comparison && botanicalsEnabled(crowd, query.get('botanicals'));
const driver = new SliceDriver(liveRequested ? 'offline' : scenario,
  scenario === 'community' ? presenceDemo(chatBubbles, giftIcons) : []);
const director = new SliceCamera();
const seed = parseCinematicSeed(query.get('seed'));
if (query.get('clean') === '1') document.body.classList.add('clean');
if (liveRequested) {
  document.title = 'OnlinePagoda V2 · Portrait source';
  const operatorStatus = document.querySelector<HTMLParagraphElement>('#live-status')!;
  operatorStatus.hidden = false;
  operatorStatus.textContent = 'OFFLINE · Chưa có nguồn sự kiện TikTok đã xác minh. Chỉ hiển thị cảnh 3D.';
}

const errors: string[] = [];
const report: Record<string, unknown> = {
  repoRevision: __REPO_REVISION__, requestedTreeRevision: requestedTree, profile, viewport: [captureWidth, captureHeight],
  safeMargin: capture.safeMargin, near: capture.near, far: capture.far, scenario, seed, errors, contextRestores: 0,
  ...(liveRequested && { liveStatus: 'OFFLINE', liveReason: 'P10B2_PROVIDER_ACCESS_BLOCKED' }),
};
Object.assign(window, { viewerReport: report });

function show(message: string) {
  status.hidden = !message;
  status.textContent = message;
}

async function boot() {
  show(treeLoading);
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: profile === 'quality' });
  } catch {
    throw new Error('WebGL 2 không khả dụng. Mở preview trên trình duyệt hỗ trợ tăng tốc đồ họa.');
  }
  const abort = new AbortController();
  const scene = new Scene();
  const camera = new PerspectiveCamera(capture.fov, captureWidth / captureHeight, capture.near, capture.far);
  renderer.setPixelRatio(1);
  renderer.setSize(captureWidth, captureHeight, false);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = AgXToneMapping;
  renderer.toneMappingExposure = 0.94;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.enabled = profile === 'quality';

  const gl = renderer.getContext();
  const gpu = gl.getExtension('WEBGL_debug_renderer_info');
  report.graphics = gpu ? gl.getParameter(gpu.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  report.browser = navigator.userAgent;
  renderer.debug.onShaderError = (context, program, vertex, fragment) => {
    const message = [context.getProgramInfoLog(program), context.getShaderInfoLog(vertex),
      context.getShaderInfoLog(fragment)].filter(Boolean).join('\n');
    errors.push(message || 'Shader compilation failed');
    show('Lỗi shader WebGL. Xem diagnostics.');
  };

  const environment = new Group();
  const bubbles = chatBubbles || giftIcons
    ? createPresenceBubbles(canvas.parentElement!, profile, chatBubbles, giftIcons) : undefined;
  environment.name = 'Environment';
  scene.add(environment);
  const water = comparison ? undefined : createWater(fxProfile.water, look !== 'legacy');
  let ambient: ReturnType<typeof createAmbientFx> | undefined;
  let mist: ReturnType<typeof createTrunkMist> | undefined;
  let giftFx: ReturnType<typeof createGiftFx> | undefined;
  let blessing: ReturnType<typeof createBlessingCloud> | undefined;
  if (water) environment.add(water.mesh);
  const rig = setupLighting(scene, profile, !!comparison);
  const twilight = look === 'legacy' ? undefined : createTwilight(scene, rig);
  let gold: ReturnType<typeof bindGoldEmphasis> | undefined;

  let req = 0;
  let lost = false;
  let disposed = false;
  let sakura: Awaited<ReturnType<typeof loadSakura>> | undefined;
  let seats: Awaited<ReturnType<typeof createSeatScene>> | undefined;
  let botanicals: Awaited<ReturnType<typeof createBotanicalScene>> | undefined;
  let communityNames: ReturnType<typeof createCommunityNames> | undefined;
  let nameplates: ReturnType<typeof createNameplates> | undefined;
  let routes: ReturnType<typeof createCinematicRoutes> | ReturnType<typeof createHeroRoutes> | undefined;
  let start: number | undefined;
  let last: number | undefined;
  const frameTimes: number[] = [];
  const visited = new Set<string>();
  let lastReport = -Infinity;
  const render = (now: number, review?: {
    seconds: number; draw: boolean; angle?: number; idle?: number; seatId?: string; fixed?: CameraPose;
  }) => {
    if (lost || disposed || !sakura) return;
    start ??= now;
    const seconds = review?.seconds ?? frozenAt ?? (now - start) / 1000;
    let pose: CameraPose | undefined;
    let cinematic: ReturnType<NonNullable<typeof routes>['sample']> | undefined;
    let presentation: ReturnType<SliceDriver['update']> | undefined;
    let selected;
    if (comparison) {
      camera.position.fromArray(comparison.position);
      camera.up.fromArray(comparison.up);
      camera.lookAt(...comparison.target as [number, number, number]);
      camera.fov = comparison.fov;
    } else {
      if (!seats || !routes) return;
      const atMs = Math.round(seconds * 1000);
      presentation = driver.update(atMs);
      seats.present(presentation.state.avatars, seconds, review?.idle);
      const reviewSeat = review?.seatId ? seats.seats.get(review.seatId) : seats.preview;
      if (review?.seatId && reviewSeat) {
        for (const seat of seats.seats.values()) seat.root.visible = seat === reviewSeat;
        reviewSeat.sample(review.idle ?? seconds % 2);
      }
      if (seats.batches) {
        seats.batches.group.visible = !review?.seatId;
      }
      const actor = presentation.actor;
      const seat = actor && seats.seats.get(actor.seatId);
      selected = seat && seat.root.visible && actor ? { seat, presentation: actor } : undefined;
      const focus = selected && presentation.state.focus && {
        requestId: presentation.state.focus.requestId, pose: seatPose(selected.seat, 0.30),
      };
      const routeTime = director.routeSeconds(atMs, focus?.requestId);
      cinematic = routes.sample(routeTime);
      if (twilight && look !== 'legacy') {
        const mode = presentation.state.camera.mode;
        const weights = timeline.update(atMs, routeTime, mode === 'GIFT_TRANSITION' || mode === 'GIFT_FOCUS', look);
        const appearance = twilight.update(weights);
        renderer.toneMappingExposure = appearance.exposure;
        gold?.update(appearance.veinEmissive);
        water?.setAppearance(twilight.deepWater, twilight.horizon, twilight.reflection);
        report.appearance = { look, weights: [...weights], order: lookOrder,
          exposure: renderer.toneMappingExposure, fog: rig.fog?.color.toArray(), fogDensity: rig.fog?.density,
          reflection: { ...twilight.reflection }, veinEmissive: appearance.veinEmissive };
      }
      const live = director.move(atMs, cinematic, focus);
      pose = review?.fixed ?? (review?.angle !== undefined && reviewSeat ? seatPose(reviewSeat, review.angle, 5.35) : live);
      camera.position.copy(pose.position);
      camera.lookAt(pose.target);
      camera.fov = pose.fov;
      if (water) water.time.value = seconds;
      visited.add(cinematic.shot);
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (seats?.batches?.group.visible && (!review || review.draw)) {
      report.visibleDecorativeInstances = seats.batches.update(seats.preview.breath.scale, camera,
        diversity ? seats.preview.breath.position : undefined);
    }
    const labels = presentation ? showGift(camera, presentation, selected, presence) : undefined;
    if (presentation && (communityNames || nameplates || rings)) {
      const { avatars, viewerCount } = presentation.state;
      const plates = nameplates?.update(presentation.state, camera, manual);
      const names = plates?.names ?? communityNames?.update(avatars, camera, Math.round(seconds * 1000),
        labels?.name ? selected?.presentation.actorId : undefined) ?? [];
      if (plates && manual) report.nameplates = plates.projections;
      const slots = seats?.slots && occupancy(seats.slots, avatars);
      report.community = { slots, names, viewerCount, realActors: avatars.length,
        decorativeActors: slots?.filter(slot => slot.kind === 'DECORATIVE_ANONYMOUS').length ?? 0,
        batches: seats?.batches?.count ?? 0 };
    }
    const celebration = presentation && giftFx?.update(presentation.state, presentation.active, selected);
    const bubbleState = bubbles && presentation && seats && bubbles.update(presentation.state, presentation.chat,
      celebration?.gift, selected, seats.seats, camera, presentation.state.camera.mode !== 'CINEMATIC' || !!labels?.fallback);
    if (bubbleState) report.bubbles = bubbleState;
    if (blessing && presentation) report.blessing = blessing.update(presentation.state, celebration?.gift, selected);
    ambient?.update(seconds, celebration?.gift?.opacity ?? 0, !!bubbleState?.chat || !!presentation?.state.focus);
    mist?.update(seconds);
    if (rich && ambient && mist) report.richAmbience = {
      localPoints: ambient.localCount, totalPoints: ambient.points.geometry.getAttribute('position').count,
      mistPoints: mist.count, mistPixelCap: mist.pixelCap, mistCenterY: [mist.minCenterY, mist.maxCenterY],
    };
    water?.setRipple(celebration?.ripple);
    if (!comparison) report.fx = { enabled: fxEnabled, ambient: ambient?.counts, ...celebration };
    let focus;
    if (selected) {
      focus = {
        actorId: selected.presentation.actorId, seatId: selected.presentation.seatId,
        requestId: presentation?.state.focus?.requestId, name: selected.presentation.displayName,
        headWorld: selected.seat.head.getWorldPosition(new Vector3()).toArray(),
        nameWorld: selected.seat.name.getWorldPosition(new Vector3()).toArray(),
        fxWorld: selected.seat.fx.getWorldPosition(new Vector3()).toArray(),
      };
    }
    Object.assign(report, {
      elapsedSeconds: seconds, shot: view ?? cinematic?.shot, visited: [...visited], mode: presentation?.state.camera.mode,
      revision: presentation?.state.revision, roomSessionId: presentation?.state.roomSessionId, labels, focus,
      confirmedGiftCount: presentation?.state.confirmedGiftCount, pendingGivers: presentation?.state.camera.pendingGivers,
      position: camera.position.toArray(), target: comparison?.target ?? pose?.target.toArray(), fov: camera.fov,
      routeId: cinematic?.routeId, direction: cinematic?.direction, cycle: cinematic?.cycle, routeFallback: cinematic?.fallback,
    });
    if (review && !review.draw) return;
    if (botanicals) {
      botanicals.group.visible = !review?.seatId;
      if (manual || now - lastReport >= 500) {
        report.botanicalFrustum = botanicals.group.visible ? botanicals.inFrustum(camera) : [];
      }
    }
    renderer.render(scene, camera);
    if (last !== undefined && now > last) {
      frameTimes.push(now - last);
      if (frameTimes.length > 120) frameTimes.shift();
    }
    last = now;
    const info = renderer.info;
    Object.assign(report, {
      drawCalls: info.render.calls, trianglesDrawn: info.render.triangles,
      textures: info.memory.textures, geometries: info.memory.geometries, pointsDrawn: info.render.points,
      shaderPrograms: info.programs?.length,
      lights: 1 + rig.directionals.length, shadowMaps: rig.directionals.filter(light => light.shadow.map).length,
    });
    if (now - lastReport >= 500) {
      lastReport = now;
      if (frameTimes.length) {
        const times = [...frameTimes].sort((a, b) => a - b);
        report.frameTiming = {
          samples: times.length, fps: 1000 * times.length / times.reduce((a, b) => a + b, 0),
          p50ms: times[Math.floor((times.length - 1) * 0.50)],
          p95ms: times[Math.floor((times.length - 1) * 0.95)],
          p99ms: times[Math.floor((times.length - 1) * 0.99)],
        };
      }
      diagnostics.textContent = JSON.stringify(report, null, 2);
    }
    if (!comparison && !manual && frozenAt === undefined) req = requestAnimationFrame(render);
  };
  const clearPresence = () => {
    bubbles?.clear(Math.round(Number(report.elapsedSeconds ?? 0) * 1000));
    nameplates?.clear();
    if (bubbles) report.bubbles = {};
  };
  const visibility = () => { if (document.hidden) clearPresence(); };
  if (bubbles || presence) document.addEventListener('visibilitychange', visibility);
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    clearPresence();
    errors.push('webglcontextlost');
    cancelAnimationFrame(req);
    show('Mất ngữ cảnh WebGL. Đang chờ khôi phục…');
  };
  const contextRestored = () => {
    lost = false;
    report.contextRestores = Number(report.contextRestores) + 1;
    last = undefined;
    frameTimes.length = 0;
    show(sakura ? '' : treeLoading);
    if (!manual) req = requestAnimationFrame(render);
  };
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    abort.abort();
    cancelAnimationFrame(req);
    canvas.removeEventListener('webglcontextlost', contextLost);
    canvas.removeEventListener('webglcontextrestored', contextRestored);
    window.removeEventListener('pagehide', onPageHide);
    document.removeEventListener('visibilitychange', visibility);
    gold?.dispose();
    botanicals?.dispose();
    communityNames?.dispose();
    nameplates?.dispose();
    bubbles?.dispose();
    sakura?.dispose();
    seats?.dispose();
    ambient?.dispose();
    mist?.dispose();
    giftFx?.dispose();
    blessing?.dispose();
    water?.dispose();
    twilight?.dispose();
    for (const light of scene.children) if (light instanceof DirectionalLight) light.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
  const onPageHide = (event: PageTransitionEvent) => { if (!event.persisted) dispose(); };
  window.addEventListener('pagehide', onPageHide);
  import.meta.hot?.dispose(dispose);

  try {
    const asset = await loadSakura(profile, abort.signal, requestedTree);
    if (disposed) { asset.dispose(); return; }
    sakura = asset;
    environment.add(sakura.root);
    Object.assign(report, { asset: sakura.report });
    if (twilight) {
      gold = bindGoldEmphasis(asset.root);
      report.goldMaterial = gold.report;
    }
    console.info(`Verified Sakura ${sakura.report.assetRevision}`, sakura.report.sha256, __REPO_REVISION__);
    if (requestedTree === 'R17B') {
      const heading = document.querySelector('aside h1');
      if (heading) heading.textContent = `Sakura ${sakura.report.assetRevision}`;
      canvas.setAttribute('aria-label', `C?nh 3D Sakura ${sakura.report.assetRevision}`);
    }
    if (sakura.report.fallbackReason) {
      const notice = document.createElement('p');
      notice.setAttribute('role', 'status');
      notice.textContent = `Sakura R16 (${profile}) · thay thế R17B: ${sakura.report.fallbackReason}`;
      diagnostics.before(notice);
      document.title = 'OnlinePagoda V2 · Sakura R16 fallback';
      console.warn(notice.textContent);
    } else if (requestedTree === 'R17B') {
      document.title = 'OnlinePagoda V2 · Sakura R17B';
    }
    if (!comparison) {
      // Resolve the loaded tree's trunk pivot after scene attachment.
      const tree = asset.root.localToWorld(new Vector3());
      water?.tree.set(tree.x, tree.z);
      const pair = await createSeatScene(abort.signal, tree, crowd ? seed : undefined, diversity ? profile : undefined, rings);
      if (disposed) { pair.dispose(); return; }
      seats = pair;
      report.seatMaterialCount = pair.materialCount;
      if (pair.diversity) report.diversity = pair.diversity;
      if (presence) nameplates = createNameplates(canvas.parentElement!, pair.seats, asset.root);
      else if (liveRequested || scenario === 'community') {
        communityNames = createCommunityNames(canvas.parentElement!, pair.seats);
      }
      scene.add(pair.group);
      pair.preview.sample(0);
      routes = hero ? createHeroRoutes(tree, seed) : createCinematicRoutes(seatPose(pair.preview, 0.16, 5.05), tree, seed);
      if (fxEnabled) {
        const budget = richAmbientProfiles[profile];
        const pads = rich ? pair.slots?.map(slot => slot.position) ??
          [...pair.seats.values()].map(seat => seat.root.position.toArray()) : [];
        ambient = createAmbientFx(tree, seed, rich ? budget.tree : fxProfile.ambient,
          rich ? { pads, each: budget.perPad } : undefined);
        if (rich) {
          mist = createTrunkMist(tree, profile);
          environment.add(mist.points);
        }
        giftFx = createGiftFx(fxProfile.giftSparks);
        environment.add(ambient.points, giftFx.cloud);
        if (enableBlessing) {
          blessing = createBlessingCloud(tree, seed, fxProfile.blessing);
          environment.add(blessing.cloud);
        }
      }
      Object.assign(report, { pair: pair.report, treeTarget: tree.toArray(), rejectedRoutes: routes.rejected });
      if (pair.slots) {
        report.communityLayout = pair.slots;
        report.communityPadRadius = pair.padRadius;
        if (enableBotanicals && pair.padRadius !== undefined) {
          const layout = botanicalLayout(profile, seed, tree.toArray(), pair.slots, pair.padRadius);
          const plants = await createBotanicalScene(profile, layout, abort.signal);
          if (disposed) { plants.dispose(); return; }
          botanicals = plants;
          environment.add(plants.group);
          report.botanicals = plants.report;
        }
      }
      if (routes.rejected.length) console.warn('P0.9 cinematic clearance fallback', routes.rejected);
    }
    if (!lost) show('');
    if (manual) {
      Object.assign(window, { p08Review: {
        step: (seconds: number, draw = true, angle?: number, idle?: number, seatId?: string,
          fixed?: { position: number[]; target: number[]; fov: number }) => {
          if (!Number.isFinite(seconds) || seconds < Number(report.elapsedSeconds ?? 0)) throw new RangeError('Monotonic review clock required');
          render(performance.now(), { seconds, draw, angle, idle, seatId, fixed: fixed && {
            position: new Vector3().fromArray(fixed.position), target: new Vector3().fromArray(fixed.target), fov: fixed.fov,
          } });
          return report;
        },
        fit: (seatId = 'seat-1') => {
          const seat = seats?.seats.get(seatId);
          return seat && { ...seat.fit(), facing: seat.facing, padMatrix: seat.pad.matrixWorld.toArray() };
        },
        contact: (seatId = 'seat-1') => {
          const seat = seats?.seats.get(seatId);
          return seat && measureSeatContact(seat.actor, seat.pad, seat.seatRoot);
        },
        frame: (seatId: string) => {
          const seat = seats?.seats.get(seatId);
          if (!seat) throw new Error(`Missing seat ${seatId}`);
          const projected = new Vector3();
          let edge = 0;
          let depth = 0;
          seat.root.updateWorldMatrix(true, true);
          seat.root.traverse(node => {
            if (!(node instanceof Mesh)) return;
            const vertices = node.geometry.attributes.position;
            for (let i = 0; i < vertices.count; i++) {
              projected.fromBufferAttribute(vertices, i).applyMatrix4(node.matrixWorld).project(camera);
              edge = Math.max(edge, Math.abs(projected.x), Math.abs(projected.y));
              depth = Math.max(depth, Math.abs(projected.z));
            }
          });
          const origin = seat.seatRoot.getWorldPosition(new Vector3());
          const head = seat.head.getWorldPosition(new Vector3());
          const treeOccludes = [head, origin.clone().lerp(head, 0.5)].some(end =>
            hitsTree(camera.position.toArray(), end.toArray()));
          const front = new Vector3(0, 0, 1).transformDirection(seat.seatRoot.matrixWorld).setY(0);
          const fromSeat = camera.position.clone().sub(origin).setY(0);
          return { edge, depth, treeOccludes, faceAngleDeg: front.angleTo(fromSeat) * 180 / Math.PI };
        },
        treeCollisions: (points: number[][]) => points.slice(1).flatMap((end, i) =>
          hitsTree(points[i], end) ? [i + 1] : []),
        trace: () => driver.trace,
      } });
    } else req = requestAnimationFrame(render);
  } catch (error) {
    if (disposed) return;
    dispose();
    throw error;
  }

  function hitsTree(start: number[], end: number[]) {
    const origin = new Vector3().fromArray(start);
    const direction = new Vector3().fromArray(end).sub(origin);
    const length = direction.length();
    return length > 1e-6 && !!sakura && new Raycaster(origin, direction.normalize(), 0, length)
      .intersectObject(sakura.root, true).length > 0;
  }
}

boot().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  errors.push(message);
  show(message);
  diagnostics.textContent = JSON.stringify(report, null, 2);
});
