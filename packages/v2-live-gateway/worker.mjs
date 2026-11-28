import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';
import { fault } from './errors.mjs';
import { normalizeUsername } from './mapper.mjs';
import { createIngress } from './ingress.mjs';

const eventMap = Object.entries({ chat: WebcastEvent.CHAT, member: WebcastEvent.MEMBER,
  like: WebcastEvent.LIKE, roomUser: WebcastEvent.ROOM_USER, gift: WebcastEvent.GIFT });
const options = {
  processInitialData: false, fetchRoomInfoOnConnect: true, enableExtendedGiftInfo: false,
  authenticateWs: false, useMobile: false,
  webClientOptions: { timeout: { request: 15000 }, retry: { limit: 0 } },
  wsClientOptions: { handshakeTimeout: 15000 },
};
const ingress = createIngress((message, done) => {
  if (!process.connected) return false;
  process.send(message, done);
  return true; // send() returning false can mean queued backpressure, not a rejected IPC message.
}, code => process.exit(code));
const { send } = ingress;
setInterval(() => ingress.flush(), 1000).unref();
const faultAndFlush = code => { ingress.flush(); send({ type: 'fault', code }); };

process.once('message', message => {
  const username = normalizeUsername(message?.username);
  if (message?.type !== 'connect' || !username) { send({ type: 'fault', code: 'INVALID_USERNAME' }); return; }
  try {
    const connection = new TikTokLiveConnection(username, options);
    const startedAt = Date.now();
    let room;
    connection.on(ControlEvent.CONNECTED, state => {
      room = state.roomId;
      send({ type: 'connected', room });
    });
    connection.on(ControlEvent.ERROR, error => faultAndFlush(fault(error)));
    connection.on(ControlEvent.DISCONNECTED, () => faultAndFlush('NETWORK'));
    connection.on(WebcastEvent.STREAM_END, () => faultAndFlush('ROOM_OFFLINE'));
    for (const [kind, event] of eventMap) connection.on(event, raw => ingress.receive(kind, raw, room, startedAt));
    void connection.connect().catch(error => faultAndFlush(fault(error)));
  } catch (error) {
    faultAndFlush(fault(error));
  }
});
process.on('disconnect', () => process.exit(0));
send({ type: 'ready' });