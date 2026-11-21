import './style.css';
import {
  AgXToneMapping, DirectionalLight, Group, PCFShadowMap, PerspectiveCamera, Scene, SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { loadSakura, type Profile } from './asset.ts';
import { capture, sampleCinematic } from './camera.ts';
import { referenceViews, setupLighting } from './lighting.ts';
import { attachSeat, mockSeat } from './presentation.ts';
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
if (query.get('clean') === '1') document.body.classList.add('clean');

const errors: string[] = [];
const report: Record<string, unknown> = {
  repoRevision: __REPO_REVISION__, profile, viewport: [captureWidth, captureHeight],
  safeMargin: capture.safeMargin, near: capture.near, far: capture.far, errors,
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
  const seats = new Group();
  seats.name = 'Seat anchors (DEMO)';
  attachSeat(seats, mockSeat);
  scene.add(environment, seats);
  const water = comparison ? undefined : createWater();
  if (water) environment.add(water.mesh);
  setupLighting(scene, profile, !!comparison);

  let req = 0;
  let lost = false;
  let disposed = false;
  let sakura: Awaited<ReturnType<typeof loadSakura>> | undefined;
  let start: number | undefined;
  let last: number | undefined;
  const frameTimes: number[] = [];
  const visited = new Set<string>();
  let lastReport = -Infinity;
  const render = (now: number) => {
    if (lost || disposed || !sakura) return;
    start ??= now;
    const seconds = frozenAt ?? (now - start) / 1000;
    const pose = sampleCinematic(seconds);
    if (comparison) {
      camera.position.fromArray(comparison.position);
      camera.up.fromArray(comparison.up);
      camera.lookAt(...comparison.target as [number, number, number]);
      camera.fov = comparison.fov;
    } else {
      camera.position.copy(pose.position);
      camera.lookAt(pose.target);
      camera.fov = pose.fov;
      if (water) water.time.value = seconds;
      visited.add(pose.shot);
    }
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    if (last !== undefined && now > last) {
      frameTimes.push(now - last);
      if (frameTimes.length > 120) frameTimes.shift();
    }
    last = now;
    const info = renderer.info;
    Object.assign(report, {
      elapsedSeconds: seconds, shot: view ?? pose.shot, visited: [...visited],
      position: camera.position.toArray(), target: comparison?.target ?? pose.target.toArray(), fov: camera.fov,
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
    if (!comparison && frozenAt === undefined) req = requestAnimationFrame(render);
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
    req = requestAnimationFrame(render);
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
    if (!lost) show('');
    req = requestAnimationFrame(render);
  } catch (error) {
    if (disposed) return;
    dispose();
    throw error;
  }
}

boot().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  errors.push(message);
  show(message);
  diagnostics.textContent = JSON.stringify(report, null, 2);
});
