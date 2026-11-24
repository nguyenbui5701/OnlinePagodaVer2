import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';
import { fault } from './errors.mjs';
import { inScope, isFinalGift, mapEvent, normalizeUsername } from './mapper.mjs';

const eventMap = Object.entries({ chat: WebcastEvent.CHAT, member: WebcastEvent.MEMBER,
  like: WebcastEvent.LIKE, roomUser: WebcastEvent.ROOM_USER, gift: WebcastEvent.GIFT });
const options = {
  processInitialData: false, fetchRoomInfoOnConnect: true, enableExtendedGiftInfo: false,
  authenticateWs: false, useMobile: false,
  webClientOptions: { timeout: { request: 15000 }, retry: { limit: 0 } },
  wsClientOptions: { handshakeTimeout: 15000 },
};
let inFlight = 0;
let halted = false;
function send(message, critical = false) {
  if (!process.connected || halted) return;
  if (inFlight >= 256) {
    if (!critical) return;
    halted = true;
    process.send({ type: 'fault', code: 'GIFT_DELIVERY_FAILED' });
    return;
  }
  inFlight++;
  process.send(message, error => {
    inFlight--;
    if (error && critical) process.exit(2);
  });
}

process.once('message', message => {
  const username = normalizeUsername(message?.username);
  if (message?.type !== 'connect' || !username) { send({ type: 'fault', code: 'INVALID_USERNAME' }); return; }
  try {
    const connection = new TikTokLiveConnection(username, options);
    const startedAt = Date.now();
    let room;
    connection.on(ControlEvent.CONNECTED, state => {
      room = state.roomId;
      send({ type: 'connected', room }, true);
    });
    connection.on(ControlEvent.ERROR, error => send({ type: 'fault', code: fault(error) }, true));
    connection.on(ControlEvent.DISCONNECTED, () => send({ type: 'fault', code: 'NETWORK' }, true));
    connection.on(WebcastEvent.STREAM_END, () => send({ type: 'fault', code: 'ROOM_OFFLINE' }, true));
    for (const [kind, event] of eventMap) connection.on(event, raw => {
      if (!room) return;
      const mapped = mapEvent(kind, raw, room, startedAt);
      if (mapped) send({ type: 'event', event: mapped }, mapped.phase === 'final');
      else if (kind === 'gift' && isFinalGift(raw) && inScope(raw, room, startedAt)) send({ type: 'fault', code: 'GIFT_UNMAPPED' }, true);
    });
    void connection.connect().catch(error => send({ type: 'fault', code: fault(error) }, true));
  } catch (error) {
    send({ type: 'fault', code: fault(error) }, true);
  }
});
process.on('disconnect', () => process.exit(0));
send({ type: 'ready' });