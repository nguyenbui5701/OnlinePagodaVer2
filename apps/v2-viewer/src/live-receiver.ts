import type { DemoEvent, SessionEvent } from '../../../packages/v2-events/src/protocol.ts';
import type { LiveVoiceIdentity } from './audio/live-alias.ts';
import { readVoicePcm } from './audio/named-voice.ts';
import type { AudioApplied } from './live-audio-settings.ts';
import { GatewayError, postGateway } from './live-api.ts';

export type LivePacket = DemoEvent | SessionEvent;
export type LiveEntry = { seq: number; event: LivePacket };
export const liveBatchLimit = 48;
const statuses = new Set(['OFFLINE', 'CONNECTING', 'RECONNECTING', 'CONNECTED_NO_EVENTS', 'EVENTS_VERIFIED', 'ERROR', 'DEGRADED']);
export const reasons: Record<string, string> = {
  ROOM_OFFLINE: 'Kênh chưa LIVE hoặc phiên đã kết thúc.',
  ACCESS_DENIED: 'Provider từ chối quyền truy cập.',
  PAID_ROUTE: 'Provider yêu cầu route trả phí.',
  SIGNING_FAILED: 'Dịch vụ ký không trả về kết nối hợp lệ.',
  RATE_LIMITED: 'Provider đã giới hạn yêu cầu.',
  NETWORK: 'Không kết nối được tới provider.',
  UNKNOWN: 'Provider trả lỗi chưa xác định.',
  INVALID_USERNAME: 'Tên kênh TikTok không hợp lệ.',
  GIFT_UNMAPPED: 'Có gift final không thể ánh xạ an toàn.',
  GIFT_DELIVERY_FAILED: 'Có gift final không thể chuyển tới Viewer.',
  LOCAL_LINK_LOST: 'Mất liên lạc với Gateway cục bộ.',
};
export const counterKeys = ['chat', 'member', 'like', 'giftProgress', 'giftFinal', 'room'] as const;
export type LiveCounters = Record<typeof counterKeys[number], number>;
type Poll = { status: string; reason: string; entries: LiveEntry[]; deliveryUncertain: boolean; applyPending?: boolean; audioDesired?: unknown;
  counters: LiveCounters; viewerCount: number; dropped: number };
const natural = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;

export function decodeLivePoll(value: unknown, ack: number): Poll {
  const data = value as Poll & { version?: string };
  if (!data || data.version !== '0.2.0' || !statuses.has(data.status) ||
      typeof data.reason !== 'string' || (data.reason && !Object.hasOwn(reasons, data.reason)) ||
      typeof data.deliveryUncertain !== 'boolean' || !natural(data.viewerCount) || !natural(data.dropped) ||
      (data.applyPending !== undefined && typeof data.applyPending !== 'boolean') || !data.counters ||
      !counterKeys.every(key => natural(data.counters[key])) || !Array.isArray(data.entries) || data.entries.length > liveBatchLimit) {
    throw new Error('LIVE_PROTOCOL');
  }
  for (const [index, entry] of data.entries.entries()) {
    const event = entry?.event;
    if (entry?.seq !== ack + index + 1 || !event || !natural(event.roomEpoch) || !natural(event.connection) || !natural(event.atMs) ||
        !['session', 'chat', 'member', 'like', 'room', 'gift'].includes(event.type)) throw new Error('LIVE_PROTOCOL');
  }
  return data;
}

export type ReceiverStatus = { status: string; reason: string; uncertain: boolean; terminal?: boolean; poll?: Poll };
type Options = {
  feed: (entries: LiveEntry[]) => boolean;
  sourceLost: () => void;
  receipt: () => { ack: number; failed: boolean };
  status: (state: ReceiverStatus) => void;
  audioStatus?: () => AudioApplied | undefined;
};

export function createLiveReceiver({ feed, sourceLost, receipt, status, audioStatus }: Options) {
  const client = Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
  const abort = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  let watching = false;
  let claiming = false;
  let closed = false;
  let reportedFailure = false;
  let linkRetries = 0;
  let uncertain = false;
  let overlay = false;
  let rendererReady = false;
  let polling = false;

  const request = (path: string, data = {}, keepalive = false) =>
    postGateway(path, { client, ...data }, abort.signal, keepalive);
  const closing = () => ({ ack: receipt().ack, closing: true });

  async function poll() {
    if (!watching || closed || polling) return;
    polling = true;
    let delay = 250;
    let sentReady = rendererReady;
    try {
      if (receipt().failed && !reportedFailure) {
        uncertain = true;
        await request('/degraded');
        reportedFailure = true;
      }
      const { ack } = receipt();
      sentReady = rendererReady;
      const data = decodeLivePoll(await (await request('/poll', overlay ? { ack, ready: sentReady, audio: audioStatus?.() } : { ack })).json(), ack);
      if (closed) return;
      uncertain ||= data.deliveryUncertain;
      if (!feed(data.entries)) {
        uncertain = true;
        await request('/degraded');
        throw new Error('GIFT_DELIVERY_FAILED');
      }
      linkRetries = 0;
      status({ status: data.status, reason: data.reason, uncertain, poll: data });
      if (overlay && data.applyPending) {
        // Gateway blocks Connect once Apply is queued and only queues Apply after the event buffer drains.
        try { await request('/disconnect', closing()); }
        catch (error) { if (!(error instanceof GatewayError && error.status === 409)) throw error; }
        watching = false;
        dispose();
        location.reload();
        return;
      }
    } catch (error) {
      if (closed) return;
      const transient = error instanceof TypeError || (error instanceof DOMException && error.name === 'TimeoutError');
      if (transient && linkRetries < 2) {
        status({ status: 'RECONNECTING', reason: 'LOCAL_LINK_LOST', uncertain });
        delay = 250 * 2 ** linkRetries++;
        return;
      }
      watching = false;
      uncertain = true;
      void request('/disconnect', closing()).catch(() => {});
      sourceLost();
      status({ status: 'DEGRADED', reason: error instanceof Error && error.message === 'GIFT_DELIVERY_FAILED' ?
        'GIFT_DELIVERY_FAILED' : 'LOCAL_LINK_LOST', uncertain, terminal: true });
    } finally {
      polling = false;
      if (watching && !closed) timer = setTimeout(poll, overlay && !linkRetries && sentReady !== rendererReady ? 0 : delay);
    }
  }

  function setRendererReady(ready: boolean) {
    if (rendererReady === ready) return;
    rendererReady = ready;
    if (watching && !polling && !closed) {
      clearTimeout(timer);
      timer = setTimeout(poll, 0);
    }
  }

  async function claim(path: string, data: object) {
    claiming = true;
    try {
      await request(path, data);
      if (!closed && !watching) {
        watching = true;
        void poll();
      }
    } finally { claiming = false; }
  }

  async function attach(revision: number, attempt = 0) {
    if (closed) return;
    overlay = true;
    try { await claim('/attach', { revision }); }
    catch (error) {
      if (closed) return;
      const competing = error instanceof GatewayError && error.status === 409;
      status({ status: 'OFFLINE', reason: competing ? 'RECEIVER_BUSY' : 'GATEWAY_UNAVAILABLE', uncertain });
      if (!competing || attempt === 0) timer = setTimeout(() => void attach(revision, attempt + 1), 2000);
    }
  }

  function dispose() {
    if (closed) return;
    closed = true;
    if (watching || claiming) void request('/disconnect', closing(), true).catch(() => {});
    watching = false;
    clearTimeout(timer);
    abort.abort();
    window.removeEventListener('pagehide', dispose);
  }

  window.addEventListener('pagehide', dispose, { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted && closed) location.reload(); }, { once: true });
  return { attach, setRendererReady, connect: (username: string) => claim('/connect', { username }),
    disconnect: () => request('/disconnect'),
    async voice(identity: LiveVoiceIdentity, signal: AbortSignal) {
      if (!overlay || !watching || closed || !rendererReady) throw new Error('voice-session');
      return readVoicePcm(await postGateway('/named-voice', { client, ...identity },
        AbortSignal.any([abort.signal, signal]), false, 8500));
    }, dispose };
}