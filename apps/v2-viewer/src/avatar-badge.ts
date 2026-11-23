import type { Snapshot } from '../../../packages/v2-events/src/protocol.ts';

const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });
const noApprovedPhotos: ReadonlyMap<string, ReadonlySet<string>> = new Map();
type PhotoPolicy = typeof noApprovedPhotos;
type Binding = { roomSessionId: string; actorId: string; seatId: string };
const maxPhotoBytes = 128 * 1024;

export function avatarInitial(name: string) {
  return [...segmenter.segment(name)].find(({ segment }) => /[\p{L}\p{N}]/u.test(segment))
    ?.segment.toLocaleUpperCase('vi') ?? '•';
}

function approvedPhoto(input: string | undefined, policy: PhotoPolicy) {
  if (!input || input.length > 2048) return;
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) return;
    const host = url.hostname.replace(/\.$/, '');
    if (!host.includes('.') || /^[0-9.]+$/.test(host) || /\.(?:localhost|local|internal)$/.test(host)) return;
    // An exact media URL and its HTTPS origin must both be authorized.
    if (policy.get(url.origin)?.has(url.href)) return url.href;
  } catch {
    return;
  }
}

export function resolveAvatar(state: Snapshot, binding: Binding, policy = noApprovedPhotos) {
  if (!state.connected || state.roomSessionId !== binding.roomSessionId) return;
  const actor = state.avatars.find(item => item.visible && item.actorId === binding.actorId && item.seatId === binding.seatId);
  if (!actor) return;
  return { name: actor.displayName, initial: avatarInitial(actor.displayName), photo: approvedPhoto(actor.avatarUrl, policy) };
}

export async function loadApprovedAvatar(
  photo: string, signal: AbortSignal, request = fetch, decode = createImageBitmap,
): Promise<Blob | undefined> {
  try {
    const deadline = AbortSignal.any([signal, AbortSignal.timeout(2500)]);
    const response = await request(photo, {
      signal: deadline, redirect: 'error', referrerPolicy: 'no-referrer', credentials: 'omit', mode: 'cors',
    });
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok || response.redirected || response.url !== photo || !response.body ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(type) ||
      Number(response.headers.get('content-length')) > maxPhotoBytes) {
      await response.body?.cancel();
      return;
    }
    const reader = response.body.getReader();
    const bytes = new Uint8Array(maxPhotoBytes);
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (size + value.byteLength > bytes.length) {
          await reader.cancel();
          return;
        }
        bytes.set(value, size);
        size += value.byteLength;
      }
    } finally { reader.releaseLock(); }
    const png = type === 'image/png' && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const jpeg = type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = type === 'image/webp' && new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF' &&
      new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP';
    if (deadline.aborted || (!png && !jpeg && !webp)) return;
    const blob = new Blob([bytes.subarray(0, size)], { type });
    const image = await decode(blob);
    const valid = image.width > 0 && image.height > 0 && image.width <= 512 && image.height <= 512;
    image.close();
    if (valid && !deadline.aborted) return blob;
  } catch {
    // An unavailable image leaves the already-rendered initials in place.
  }
}

export function renderAvatarBadge(tag: HTMLElement, avatar: NonNullable<ReturnType<typeof resolveAvatar>>) {
  const badge = document.createElement('span');
  badge.className = 'avatar-badge';
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = avatar.initial;
  tag.replaceChildren(badge, document.createTextNode(avatar.name));
  const pending = new AbortController();
  let objectUrl: string | undefined;
  const releaseUrl = () => { if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = undefined; };
  if (avatar.photo) {
    void loadApprovedAvatar(avatar.photo, pending.signal).then(photo => {
      if (!photo || pending.signal.aborted) return;
      const img = document.createElement('img');
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => { if (!pending.signal.aborted) badge.replaceChildren(img); releaseUrl(); };
      img.onerror = releaseUrl;
      img.src = objectUrl = URL.createObjectURL(photo);
    });
  }
  return () => { pending.abort(); releaseUrl(); };
}
