import './style.css';
import {
  AgXToneMapping, DirectionalLight, Group, PCFShadowMap, PerspectiveCamera, Scene, SRGBColorSpace,
  Mesh, Raycaster, Vector3, WebGLRenderer,
} from 'three';
import { loadSakura, type Profile } from './asset.ts';
import { capture, createCinematicRoutes, parseCinematicSeed, type CameraPose } from './camera.ts';
import { referenceViews, setupLighting } from './lighting.ts';
import { createSeatScene, seatPose } from './seat-scene.ts';
import { SliceCamera } from './slice-camera.ts';
import { SliceDriver } from './slice-driver.ts';
import { showGift } from './slice-overlay.ts';
import { createWater } from './water.ts';

declare const __REPO_REVISION__: string;
const canvas = document.querySelector<HTMLCanvasElement>('#capture')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const diagnostics = document.querySelector<HTMLPreElement>('#diagnostics')!;
const query = new URLSearchParams(location.search);
const profile: Profile = query.get('profile') === 'quality' ? 'quality' : 'eco';
const requestedView = query.get('view') ?? '';
const view = Object.hasOwn(referenceViews, requestedView) ? requestedView as keyof typeof referenceViews : undefined;
const comparison = view ? referenceViews[view] : undefined;
const captureWidth = view && view !== 'hero_full_9x16' ? 720 : capture.width;
const captureHeight = view && view !== 'hero_full_9x16' ? 835 : capture.height;
const requestedTime = query.has('time') ? Number(query.get('time')) : NaN;
const frozenAt = Number.isFinite(requestedTime) ? requestedTime : undefined;
const manual = query.get('inspect') === '1' && !comparison;
const scenario = query.get('demo') === 'gifts' ? 'gifts' : query.get('demo') === 'capacity' ? 'capacity' : 'idle';
const driver = new SliceDriver(scenario);
const director = new SliceCamera();
const seed = parseCinematicSeed(query.get('seed'));
if (query.get('clean') === '1') document.body.classList.add('clean');

const errors: string[] = [];
const report: Record<string, unknown> = {
  repoRevision: __REPO_REVISION__, profile, viewport: [captureWidth, captureHeight],
  safeMargin: capture.safeMargin, near: capture.near, far: capture.far, scenario, seed, errors,
};
Object.assign(window, { viewerReport: report });

function show(message: string) {
  status.hidden = !message;
  status.textContent = message;
}

async function boot() {
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
  environment.name = 'Environment';
  scene.add(environment);
  const water = comparison ? undefined : createWater();
  if (water) environment.add(water.mesh);
  setupLighting(scene, profile, !!comparison);

  let req = 0;
  let lost = false;
  let disposed = false;
  let sakura: Awaited<ReturnType<typeof loadSakura>> | undefined;
  let seats: Awaited<ReturnType<typeof createSeatScene>> | undefined;
  let routes: ReturnType<typeof createCinematicRoutes> | undefined;
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
      const actor = presentation.actor;
      const seat = actor && seats.seats.get(actor.seatId);
      selected = seat && seat.root.visible && actor ? { seat, presentation: actor } : undefined;
      const focus = selected && presentation.state.focus && {
        requestId: presentation.state.focus.requestId, pose: seatPose(selected.seat, 0.30),
      };
      const routeTime = director.routeSeconds(atMs, focus?.requestId);
      cinematic = routes.sample(routeTime);
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
    const labels = presentation ? showGift(camera, presentation, selected) : undefined;
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
    renderer.render(scene, camera);
    if (last !== undefined && now > last) {
      frameTimes.push(now - last);
      if (frameTimes.length > 120) frameTimes.shift();
    }
    last = now;
    const info = renderer.info;
    Object.assign(report, {
      drawCalls: info.render.calls, trianglesDrawn: info.render.triangles,
      textures: info.memory.textures, geometries: info.memory.geometries,
    });
    if (now - lastReport >= 500) {
      lastReport = now;
      if (frameTimes.length) {
        const times = [...frameTimes].sort((a, b) => a - b);
        report.frameTiming = {
          samples: times.length, fps: 1000 * times.length / times.reduce((a, b) => a + b, 0),
          p50ms: times[Math.floor((times.length - 1) * 0.50)],
          p95ms: times[Math.floor((times.length - 1) * 0.95)],
        };
      }
      diagnostics.textContent = JSON.stringify(report, null, 2);
    }
    if (!comparison && !manual && frozenAt === undefined) req = requestAnimationFrame(render);
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    errors.push('webglcontextlost');
    cancelAnimationFrame(req);
    show('Mất ngữ cảnh WebGL. Đang chờ khôi phục…');
  };
  const contextRestored = () => {
    lost = false;
    last = undefined;
    frameTimes.length = 0;
    show(sakura ? '' : 'Đang tải Sakura R16…');
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
    sakura?.dispose();
    seats?.dispose();
    water?.dispose();
    for (const light of scene.children) if (light instanceof DirectionalLight) light.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
  const onPageHide = (event: PageTransitionEvent) => { if (!event.persisted) dispose(); };
  window.addEventListener('pagehide', onPageHide);
  import.meta.hot?.dispose(dispose);

  try {
    const asset = await loadSakura(profile, abort.signal);
    if (disposed) { asset.dispose(); return; }
    sakura = asset;
    environment.add(sakura.root);
    Object.assign(report, { asset: sakura.report });
    console.info('Verified Sakura R16', sakura.report.sha256, __REPO_REVISION__);
    if (!comparison) {
      // R16's imported scene pivot is the trunk base. Resolve it after scene attachment.
      const tree = asset.root.localToWorld(new Vector3());
      const pair = await createSeatScene(abort.signal, tree);
      if (disposed) { pair.dispose(); return; }
      seats = pair;
      scene.add(pair.group);
      pair.preview.sample(0);
      routes = createCinematicRoutes(seatPose(pair.preview, 0.16, 5.05), tree, seed);
      Object.assign(report, { pair: pair.report, treeTarget: tree.toArray(), rejectedRoutes: routes.rejected });
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
